import { Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a className="flex items-center gap-3" href="#top" aria-label="DeepResearch AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">DeepResearch AI</span>
        </a>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          Grok Agent Engine
        </span>
      </div>
    </header>
  )
}
