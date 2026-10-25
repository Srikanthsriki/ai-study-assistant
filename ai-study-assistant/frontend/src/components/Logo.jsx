import { BookOpen, Sparkles } from 'lucide-react'

export default function Logo({ size = 'md', withText = true }) {
  const boxSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 18
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative ${boxSize} flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm`}>
        <BookOpen size={iconSize} className="text-white" strokeWidth={2.2} />
        <Sparkles size={iconSize * 0.5} className="absolute -right-1 -top-1 text-accent-400" strokeWidth={2.5} />
      </div>
      {withText && (
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${textSize}`}>
          AI Study Assistant
        </span>
      )}
    </div>
  )
}
