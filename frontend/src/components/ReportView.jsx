import { AlertCircle, Check, ChevronDown, Copy, Download, FileText, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ReportView({ report }) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [exporting, setExporting] = useState('')
  const [exportError, setExportError] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  async function handleExport(format) {
    const extensions = { pdf: 'pdf', docx: 'docx', md: 'md' }
    if (!extensions[format] || exporting) return
    setExportError('')
    setMenuOpen(false)
    setExporting(format)
    try {
      let blob
      if (format === 'md') {
        blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
      } else {
        const response = await fetch(`http://localhost:8000/api/export/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_markdown: report }),
        })
        if (!response.ok) {
          let message = `Export failed (${response.status}).`
          try {
            const details = await response.json()
            message = details.detail || message
          } catch { /* Keep the HTTP status message when the response is not JSON. */ }
          throw new Error(message)
        }
        blob = await response.blob()
      }
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `research_report.${extensions[format]}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      setExportError(error.message || 'Could not export this brief.')
    } finally {
      setExporting('')
    }
  }

const components = {
    // Wrap tables in an overflow container so wide tables scroll horizontally
    table: ({ node, ...props }) => (
      <div className="my-6 w-full overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-800" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th
        className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 align-top"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className="min-w-[140px] border-t border-slate-100 px-4 py-3 text-slate-700 align-top leading-relaxed"
        {...props}
      />
    ),
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileText size={17} className="text-slate-500" /> Research report
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            onClick={copyReport}
            type="button"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <div ref={menuRef} className="relative">
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70"
              disabled={Boolean(exporting)}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              {exporting ? 'Preparing…' : 'Export Brief'}
              {!exporting && <ChevronDown size={13} />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg" role="menu">
                {[
                  ['pdf', 'PDF Document', 'Portable document'],
                  ['docx', 'Word Document', 'Editable document'],
                  ['md', 'Markdown File', 'Plain text source'],
                ].map(([format, label, description]) => (
                  <button
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-slate-50 disabled:opacity-50"
                    key={format}
                    onClick={() => handleExport(format)}
                    role="menuitem"
                    type="button"
                  >
                    <span className="text-xs font-medium text-slate-800">{label}</span>
                    <span className="mt-0.5 text-[11px] text-slate-400">{description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {exportError && <div className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700 sm:px-7" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={14} />{exportError}</div>}

      <div className="markdown-body w-full overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {report}
        </ReactMarkdown>
      </div>
    </article>
  )
}
