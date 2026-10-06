import { ExternalLink, Globe } from 'lucide-react'

export default function SourceReview({ results, selected, setSelected, extraUrls, setExtraUrls, onApprove, loading }) {
  function toggle(url) {
    setSelected((current) => current.includes(url) ? current.filter((item) => item !== url) : [...current, url])
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6" aria-labelledby="source-review-title">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700"><Globe size={18} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="source-review-title" className="text-sm font-semibold text-slate-900">Review sources to scrape</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">Choose the pages you want the agent to read. Your selections will be used in the report.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {results.map((result, index) => (
          <label key={`${result.link}-${index}`} className="flex cursor-pointer gap-3 rounded-xl border border-amber-100 bg-white p-3 transition hover:border-amber-300">
            <input className="mt-1 accent-slate-900" type="checkbox" checked={selected.includes(result.link)} onChange={() => toggle(result.link)} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">{result.title || result.link}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{result.snippet}</span>
              <a className="mt-2 inline-flex items-center gap-1 break-all text-xs text-slate-500 hover:text-slate-900" href={result.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                {result.link} <ExternalLink size={12} />
              </a>
            </span>
          </label>
        ))}
      </div>
      <label className="mt-4 block text-xs font-medium text-slate-700" htmlFor="extra-urls">Add URLs (one per line or comma-separated)</label>
      <textarea id="extra-urls" className="mt-2 min-h-16 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100" placeholder="https://example.com/article" value={extraUrls} onChange={(event) => setExtraUrls(event.target.value)} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{selected.length} source{selected.length === 1 ? '' : 's'} selected</span>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onApprove} disabled={loading || (selected.length === 0 && !extraUrls.trim())}>
          {loading ? 'Submitting…' : 'Approve and continue'}
        </button>
      </div>
    </section>
  )
}
