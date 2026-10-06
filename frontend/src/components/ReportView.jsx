import { Check, Copy, FileText } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ReportView({ report }) {
  const [copied, setCopied] = useState(false)

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
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
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          onClick={copyReport}
          type="button"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Markdown'}
        </button>
      </div>

      <div className="markdown-body w-full overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {report}
        </ReactMarkdown>
      </div>
    </article>
  )
}
