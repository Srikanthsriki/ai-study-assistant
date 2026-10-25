"""
Reusable Gemini AI service.

All AI-powered features (chat, summarizer, question generator, quiz
generator, document Q&A) go through the functions in this file instead of
duplicating API-calling code across routes.

The GEMINI_API_KEY is read from the environment on the backend only —
it is never sent to or accessible from the frontend.
"""
import json
import re
import requests
from app.config import settings

MODEL_NAME = "gemini-3.5-flash"
FALLBACK_MODEL_NAMES = ("gemini-3.8-flash",)

SYSTEM_INSTRUCTION = (
    "You are an educational AI study assistant. Explain concepts clearly and "
    "accurately. Adapt explanations to the student's level. When solving "
    "problems, explain the reasoning step by step rather than giving "
    "unexplained answers. Use examples where helpful. For exam preparation, "
    "provide concise and structured answers. If the student asks for "
    "programming help, provide clean code and explain it. If information is "
    "uncertain, clearly say so rather than inventing facts."
)


class GeminiServiceError(Exception):
    """Raised when the Gemini API cannot fulfill a request."""
    pass


def _get_model(system_instruction: str = SYSTEM_INSTRUCTION, model_name: str = MODEL_NAME):
    if not settings.GEMINI_API_KEY:
        raise GeminiServiceError(
            "GEMINI_API_KEY is not configured on the server. "
            "Add it to backend/.env to enable AI features."
        )
    return model_name


def _extract_json(text: str):
    """Best-effort extraction of a JSON object/array from a model response,
    even if it's wrapped in markdown code fences."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```json\s*|^```\s*|```$", "", cleaned, flags=re.MULTILINE).strip()
    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    # Fall back to grabbing the first {...} or [...] block
    match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    raise GeminiServiceError("AI response was not valid JSON.")


def _call_gemini(
    prompt: str,
    system_instruction: str = SYSTEM_INSTRUCTION,
    *,
    expect_json: bool = False,
) -> str:
    model_names = (MODEL_NAME, *FALLBACK_MODEL_NAMES)
    last_error = None

    for model_name in model_names:
        try:
            _get_model(system_instruction, model_name)
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model_name}:generateContent"
            )
            response = requests.post(
                url,
                headers={"x-goog-api-key": settings.GEMINI_API_KEY},
                json={
                    "system_instruction": {
                        "parts": [{"text": system_instruction}],
                    },
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 1600 if expect_json else 700,
                        **({"responseMimeType": "application/json"} if expect_json else {}),
                    },
                },
                timeout=(5, 20),
            )

            if response.status_code >= 400:
                error = response.json().get("error", {})
                error_text = str(error)
                if response.status_code in (404, 400) and (
                    "model" in error_text.lower() or "not found" in error_text.lower()
                ):
                    last_error = error_text
                    continue
                if response.status_code == 429:
                    raise GeminiServiceError(
                        "Gemini free quota has been reached. Please try again later or add billing to your Gemini account."
                    )
                raise GeminiServiceError(
                    f"Gemini request failed ({response.status_code})."
                )

            response_text = "".join(
                part.get("text", "")
                for candidate in response.json().get("candidates", [])
                for part in candidate.get("content", {}).get("parts", [])
            )
            if not response_text:
                raise GeminiServiceError(
                    "AI Assistant is temporarily unavailable. Please try again."
                )
            return response_text

        except GeminiServiceError:
            raise

        except requests.Timeout as exc:
            last_error = exc
            continue

        except requests.RequestException as exc:
            last_error = exc
            raise GeminiServiceError(
                "AI Assistant could not reach Gemini. Please try again."
            ) from exc

    if last_error is not None:
        raise GeminiServiceError(
            "The selected Gemini model is currently unavailable. Please try again later."
        ) from last_error

    raise GeminiServiceError("AI Assistant is temporarily unavailable. Please try again.")



def chat_reply(history: list, user_message: str, context_text: str = None) -> str:
    """
    Generate a chat reply given prior conversation turns.
    `history` is a list of {"role": "user"/"assistant", "content": str}.
    `context_text` (optional) is extracted document text to ground the answer in.
    """
    convo_lines = []
    for turn in history[-8:]:
        speaker = "Student" if turn["role"] == "user" else "Assistant"
        convo_lines.append(f"{speaker}: {turn['content']}")

    context_block = ""
    if context_text:
        # Trim very long documents to a reasonable context window
        trimmed = context_text[:6000]
        context_block = (
            "\n\nThe student has uploaded a study document. Use the following "
            "extracted content as the primary source when answering, and say so "
            "if the answer isn't found in it:\n---\n" + trimmed + "\n---\n"
        )

    prompt = (
        f"{context_block}\n"
        f"Conversation so far:\n{chr(10).join(convo_lines)}\n\n"
        f"Student: {user_message}\nAssistant:"
    )
    return _call_gemini(prompt)


def summarize_text(text: str, length: str = "medium") -> str:
    style_map = {
        "short": "a very short summary (3-5 sentences)",
        "medium": "a medium-length summary (2-3 paragraphs) covering the main ideas",
        "detailed": "a detailed, thorough summary covering all important points and sub-topics",
        "bullet": "clean bullet-point notes covering key concepts, definitions and important points",
        "exam": "concise exam-revision notes: key terms, definitions, formulas (if any), and the most exam-relevant points",
    }
    style = style_map.get(length, style_map["medium"])
    prompt = (
        f"Summarize the following study material as {style}. "
        f"Preserve important terminology, key definitions, and formulas where relevant. "
        f"Use clear headings and formatting.\n\n---\n{text[:15000]}\n---"
    )
    return _call_gemini(prompt)


def generate_questions(topic_or_text: str, difficulty: str, num_questions: int, question_type: str) -> list:
    """Returns a list of question dicts (structure depends on question_type)."""
    type_instructions = {
        "mcq": (
            "Generate multiple-choice questions. Each item must be a JSON object with keys: "
            '"question" (string), "options" (array of exactly 4 strings), '
            '"correct_answer" (must exactly match one of the options), "explanation" (string).'
        ),
        "short": (
            'Generate short-answer questions. Each item: "question" (string), '
            '"model_answer" (short answer string), "explanation" (key points, string).'
        ),
        "long": (
            'Generate long-answer/essay questions. Each item: "question" (string), '
            '"model_answer" (a structured full answer string), "explanation" (key points, string).'
        ),
        "truefalse": (
            'Generate true/false questions. Each item: "question" (string), '
            '"correct_answer" ("True" or "False"), "explanation" (string).'
        ),
        "mixed": (
            "Generate a mix of MCQ, short-answer and true/false questions. Each item must include "
            '"question", "type" (one of "mcq","short","truefalse"), "options" (array, only for mcq, else null), '
            '"correct_answer" (or "model_answer" for short type), "explanation".'
        ),
    }
    instruction = type_instructions.get(question_type, type_instructions["mcq"])

    prompt = (
        f"You are creating exam practice questions for a college student on the topic/material below.\n"
        f"Difficulty: {difficulty}\n"
        f"Number of questions: {num_questions}\n"
        f"{instruction}\n"
        f"Respond ONLY with a valid JSON array of {num_questions} question objects. "
        f"No markdown, no commentary, no code fences — just the raw JSON array.\n\n"
        f"Topic/Material:\n---\n{topic_or_text[:12000]}\n---"
    )
    raw = _call_gemini(prompt, expect_json=True)
    data = _extract_json(raw)
    if not isinstance(data, list):
        raise GeminiServiceError("AI did not return a valid question list.")
    return data


def generate_quiz(topic_or_text: str, difficulty: str, num_questions: int) -> list:
    """Always returns MCQ-style questions suitable for the interactive quiz mode."""
    prompt = (
        f"Create a multiple-choice quiz for a college student.\n"
        f"Topic/Material below. Difficulty: {difficulty}. Number of questions: {num_questions}.\n"
        f'Respond ONLY with a JSON array. Each item: "question" (string), '
        f'"options" (array of exactly 4 strings), "correct_answer" (must exactly match one option), '
        f'"explanation" (short string explaining the correct answer). '
        f"No markdown, no commentary, no code fences — just the raw JSON array.\n\n"
        f"Topic/Material:\n---\n{topic_or_text[:12000]}\n---"
    )
    raw = _call_gemini(prompt, expect_json=True)
    data = _extract_json(raw)
    if not isinstance(data, list):
        raise GeminiServiceError("AI did not return a valid quiz.")
    return data
