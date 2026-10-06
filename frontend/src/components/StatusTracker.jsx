import { CheckCircle2, FileText, Globe, Loader2, Search } from 'lucide-react'

const steps = [
  { key: 'search_web_node', title: 'Web Search', detail: 'Finding relevant sources across the web', icon: Search },
  { key: 'scrape_links_node', title: 'Deep Scraping', detail: 'Reading selected pages and extracting context', icon: Globe },
  { key: 'generate_report_node', title: 'Report Synthesis', detail: 'Connecting findings into a structured report', icon: FileText },
]

export default function StatusTracker({ completedNodes, activeNode, status }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Research progress">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Research progress</p>
          <p className="mt-1 text-xs text-slate-500">{status === 'reviewing' ? 'Your source review is needed' : status === 'completed' ? 'Research complete' : 'Live agent activity'}</p>
        </div>
        {status === 'completed' && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Complete</span>}
      </div>
      <ol className="space-y-4">
        {steps.map((step) => {
          const done = completedNodes.has(step.key)
          const active = activeNode === step.key && !done
          const Icon = step.icon
          return (
            <li className="flex items-center gap-3" key={step.key}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-emerald-50 text-emerald-600' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <CheckCircle2 size={18} /> : active ? <Loader2 className="animate-spin" size={17} /> : <Icon size={17} />}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${done || active ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{active && status === 'searching' ? 'Searching Google via SerpAPI...' : active && status === 'scraping' ? 'Review approved; reading sources...' : active && status === 'generating' ? 'Writing your research report...' : step.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
