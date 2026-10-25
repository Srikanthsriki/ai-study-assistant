import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.services import gemini_service


class GeminiModelCompatibilityTest(unittest.TestCase):
    def test_model_name_is_supported(self):
        self.assertIn(
            gemini_service.MODEL_NAME,
            {"gemini-3.5-flash", "gemini-3.8-flash"},
        )


if __name__ == "__main__":
    unittest.main()
