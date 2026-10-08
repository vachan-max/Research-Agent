import { Moon, Sparkles, Sun } from 'lucide-react'

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="border-b border-slate-200/80 bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="DeepResearch AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">DeepResearch AI</span>
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
            <span></span>
          </button>
          <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
            Grok Agent Engine
          </span>
        </div>
      </div>
    </header>
  )
}
