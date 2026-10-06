import { Loader2, Search } from 'lucide-react'

const suggestions = [
  'Latest breakthroughs in quantum computing',
  'Agentic AI trends 2026',
]

export default function SearchBar({ query, setQuery, onSubmit, loading }) {
  return (
    <section className="mx-auto w-full max-w-3xl text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Research with sources, not guesses
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        What would you like to research?
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
        Explore the web, review the sources, and turn the findings into a clear report.
      </p>

      <form className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="research-query">Research question</label>
        <textarea
          id="research-query"
          className="min-h-20 w-full resize-y border-0 bg-transparent px-3 py-2 text-left text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
          placeholder="Ask a question, compare ideas, or investigate a topic..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={2000}
          required
        />
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-2">
          <span className="hidden text-xs text-slate-400 sm:block">A focused question gets a better report</span>
          <button className="ml-auto inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            {loading ? 'Researching' : 'Start research'}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
            type="button"
            disabled={loading}
            onClick={() => setQuery(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  )
}
