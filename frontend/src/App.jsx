import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import Header from './components/Header.jsx'
import ReportView from './components/ReportView.jsx'
import SearchBar from './components/SearchBar.jsx'
import SourceReview from './components/SourceReview.jsx'
import StatusTracker from './components/StatusTracker.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function parseSseFrame(frame) {
  const fields = {}
  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue
    const separator = line.indexOf(':')
    const field = separator < 0 ? line : line.slice(0, separator)
    let value = separator < 0 ? '' : line.slice(separator + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    if (field === 'data') fields.data = fields.data ? `${fields.data}\n${value}` : value
    else fields[field] = value
  }
  return fields
}

export default function App() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [currentStep, setCurrentStep] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [report, setReport] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [completedNodes, setCompletedNodes] = useState(() => new Set())
  const [activeNode, setActiveNode] = useState('')
  const [runId, setRunId] = useState('')
  const [selectedSources, setSelectedSources] = useState([])
  const [extraUrls, setExtraUrls] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('dashboard-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const abortRef = useRef(null)

  const busy = ['searching', 'scraping', 'generating', 'reviewing'].includes(status)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  async function handleSearch(event) {
    event.preventDefault()
    if (!query.trim() || busy) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('searching')
    setCurrentStep('Searching Google via SerpAPI...')
    setSearchResults([])
    setReport('')
    setErrorMessage('')
    setCompletedNodes(new Set())
    setActiveNode('search_web_node')
    setRunId('')
    setSelectedSources([])
    setExtraUrls('')

    try {
      const response = await fetch(`${API_BASE}/api/research/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ query: query.trim() }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(body || `Research request failed (${response.status}).`)
      }
      if (!response.body) throw new Error('Streaming response body is unavailable in this browser.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
        const frames = buffer.split(/\r?\n\r?\n/)
        buffer = frames.pop() || ''
        for (const frame of frames) await handleSseEvent(parseSseFrame(frame), controller.signal)
        if (done) break
      }
      if (buffer.trim()) await handleSseEvent(parseSseFrame(buffer), controller.signal)
    } catch (error) {
      if (error.name === 'AbortError') return
      setStatus('error')
      setCurrentStep('Research could not be completed')
      setErrorMessage(error.message || 'An unexpected error occurred.')
      setActiveNode('')
    }
  }

  async function handleSseEvent(event, signal) {
    if (!event.event) return
    let payload = {}
    try { payload = event.data ? JSON.parse(event.data) : {} } catch { throw new Error('Received malformed data from the research stream.') }

    if (event.event === 'error') {
      throw new Error(payload.message || 'The research server returned an error.')
    }
    if (event.event === 'source_review') {
      const results = Array.isArray(payload.search_results) ? payload.search_results : []
      setRunId(payload.run_id || '')
      setSearchResults(results)
      setSelectedSources(results.slice(0, 2).map((item) => item.link).filter(Boolean))
      setCompletedNodes((current) => new Set([...current, 'search_web_node']))
      setActiveNode('')
      setStatus('reviewing')
      setCurrentStep('Choose which sources the agent should read.')
      return
    }
    if (event.event === 'node_complete') {
      const node = payload.node
      const state = payload.state || {}
      if (node === 'search_web_node') {
        const results = state.search_results || []
        setSearchResults(results)
        setCompletedNodes((current) => new Set([...current, node]))
        setStatus('reviewing')
        setCurrentStep('Review sources before the agent scrapes them.')
      } else if (node === 'scrape_links_node') {
        setCompletedNodes((current) => new Set([...current, node]))
        setActiveNode('generate_report_node')
        setStatus('generating')
        setCurrentStep('Synthesizing a report from the scraped sources...')
      } else if (node === 'generate_report_node') {
        setCompletedNodes((current) => new Set([...current, node]))
        setReport(state.final_report || '')
        setActiveNode('')
        setStatus('completed')
        setCurrentStep('Research report is ready.')
      }
      return
    }
    if (event.event === 'done') {
      setStatus((current) => current === 'error' ? current : 'completed')
      setActiveNode('')
      return
    }
    if (signal.aborted) return
  }

  async function approveSources() {
    if (!runId || reviewSubmitting) return
    const added = extraUrls.split(/[\n,]/).map((url) => url.trim()).filter(Boolean)
    const selected = searchResults.filter((item) => selectedSources.includes(item.link))
    const additions = added.map((url) => ({ title: url, link: url, snippet: 'User-added source' }))
    if (!selected.length && !additions.length) return
    setReviewSubmitting(true)
    setStatus('scraping')
    setActiveNode('scrape_links_node')
    setCurrentStep('Review approved; scraping selected sources...')
    try {
      const response = await fetch(`${API_BASE}/api/research/${encodeURIComponent(runId)}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: [...selected, ...additions] }),
      })
      if (!response.ok) {
        const body = await response.text()
        throw new Error(body || `Could not submit source approval (${response.status}).`)
      }
      setStatus('scraping')
    } catch (error) {
      setStatus('reviewing')
      setActiveNode('')
      setErrorMessage(error.message || 'Could not submit source approval.')
    } finally {
      setReviewSubmitting(false)
    }
  }

 return (
  <div id="top" className="min-h-screen bg-slate-50 text-slate-900 transition-colors">
    <Header theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
      <SearchBar query={query} setQuery={setQuery} onSubmit={handleSearch} loading={busy} />
      
      {errorMessage && (
        <div role="alert" className="mx-auto flex w-full max-w-3xl items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {status !== 'idle' && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {/* Top Section: Progress Tracker */}
          <div className="space-y-4">
            <StatusTracker completedNodes={completedNodes} activeNode={activeNode} status={status} />
            {status === 'completed' && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 size={17} /> Research complete
              </div>
            )}
            {status === 'searching' && (
              <p aria-live="polite" className="flex items-center gap-2 px-1 text-xs text-slate-500">
                <Sparkles size={14} />{currentStep}
              </p>
            )}
          </div>

          {/* Bottom Section: Review & Report View */}
          <div className="min-w-0 space-y-5">
            {status === 'reviewing' && (
              <SourceReview 
                results={searchResults} 
                selected={selectedSources} 
                setSelected={setSelectedSources} 
                extraUrls={extraUrls} 
                setExtraUrls={setExtraUrls} 
                onApprove={approveSources} 
                loading={reviewSubmitting} 
              />
            )}
            
            {report && <ReportView report={report} />}
            
            {!searchResults.length && !report && status === 'searching' && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
                {currentStep || 'Connecting to the research agent...'}
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-xs leading-5 text-slate-500">
          <Sparkles className="shrink-0 text-slate-400" size={16} />
          <span>Your agent searches the web, asks you to review sources, then creates a cited, readable report.</span>
        </div>
      )}
    </main>
    
    <footer className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-400">
      DeepResearch AI · Powered by your research agent
    </footer>
  </div>
)
}
