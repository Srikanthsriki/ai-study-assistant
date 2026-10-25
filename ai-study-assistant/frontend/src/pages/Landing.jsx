import { Link } from 'react-router-dom'
import {
  MessageSquare, FileText, Sparkles, HelpCircle, ClipboardCheck,
  NotebookPen, TrendingUp, UserCheck, Sun, Moon, UploadCloud,
  MessagesSquare, ListChecks, Award, ArrowRight, CheckCircle2
} from 'lucide-react'
import Logo from '../components/Logo'
import { useTheme } from '../context/ThemeContext'

const features = [
  { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'Ask anything — programming, math, data science, and more — and get clear, step-by-step answers.' },
  { icon: FileText, title: 'PDF/Study Material Analysis', desc: 'Upload your notes or textbooks and let the AI understand them for you.' },
  { icon: Sparkles, title: 'Smart Summarization', desc: 'Turn long chapters into short, medium, or exam-ready revision notes.' },
  { icon: HelpCircle, title: 'Question Generator', desc: 'Generate MCQs, short and long answer questions from any topic or material.' },
  { icon: ClipboardCheck, title: 'Quiz Mode', desc: 'Practice with interactive quizzes and get instant, detailed feedback.' },
  { icon: NotebookPen, title: 'Study Notes', desc: 'Organize, pin, and search your notes — including AI-generated summaries.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Visualize your study activity, quiz scores, and strongest subjects.' },
  { icon: UserCheck, title: 'Personalized Study Support', desc: 'An assistant that adapts explanations to your level and preferences.' },
]

const steps = [
  { icon: UploadCloud, title: 'Upload or enter study material', desc: 'Add a PDF, DOCX, TXT file, or simply paste your notes.' },
  { icon: MessagesSquare, title: 'Ask AI questions', desc: 'Chat with the AI about your material or any academic topic.' },
  { icon: Sparkles, title: 'Generate summaries/questions', desc: 'Create revision notes or practice questions in seconds.' },
  { icon: ListChecks, title: 'Practice quizzes', desc: 'Test your understanding with interactive, auto-graded quizzes.' },
  { icon: Award, title: 'Track progress', desc: 'See your growth over time with clear stats and charts.' },
]

const benefits = [
  'Understand difficult topics faster with step-by-step AI explanations',
  'Save hours by auto-summarizing long chapters and notes',
  'Practice smarter with quizzes tailored to your weak areas',
  'Keep every note, question set, and score in one organized place',
  'Study anywhere — fully responsive on desktop, tablet, and mobile',
]

export default function Landing() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400">Home</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400">Features</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400">About</a>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn-ghost">Login</Link>
            <Link to="/register" className="btn-primary">Sign Up</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Sparkles size={14} /> Powered by Google Gemini
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Your Personal <span className="text-brand-600">AI Study Assistant</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Understand difficult topics, summarize notes, generate questions, practice quizzes, and study smarter with AI.
          </p>
          <p className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400">
            "Learn Smarter. Study Better. Achieve More."
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary px-7 py-3 text-base">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary px-7 py-3 text-base">
              Try AI Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Everything you need to study smarter</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">A complete toolkit for modern students, powered by AI.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition-transform hover:-translate-y-1">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 dark:bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">How it works</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">Five simple steps from confusion to confidence.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s.title} className="card relative p-6">
                <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                  <s.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / About */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Built for students who want results</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              AI Study Assistant combines a conversational AI tutor, document understanding,
              and quiz-based practice into one clean platform — so you spend less time
              organizing and more time actually learning.
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/apex_logo.jpeg"
              alt="Apex Predator brand logo"
              className="block h-auto w-full max-w-[440px] rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center shadow-lg">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to study smarter?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Create your free account and start chatting with your AI study assistant today.
          </p>
          <Link to="/register" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 sm:flex-row">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <a href="#about" className="hover:text-brand-600">About</a>
            <a href="#features" className="hover:text-brand-600">Features</a>
            <span className="cursor-default">Contact</span>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
          </div>
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} AI Study Assistant</p>
        </div>
      </footer>
    </div>
  )
}
