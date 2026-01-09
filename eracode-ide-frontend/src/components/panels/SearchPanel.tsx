import { useState } from 'react'
import { Search, MoreHorizontal, Loader2, File, ChevronRight, ChevronDown } from 'lucide-react'
import { useFileSystemStore } from '../../stores/fileSystemStore'
import { useEditorStore } from '../../stores/editorStore'

interface Match {
  line: number
  content: string
}

interface SearchResult {
  file: string
  matches: Match[]
}

export default function SearchPanel() {
  const { rootDirectory } = useFileSystemStore()
  const { openFile } = useEditorStore()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || !rootDirectory?.path) return

    setSearching(true)
    setResults([])

    try {
      const res = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: rootDirectory.path,
          query: query
        })
      })
      const data = await res.json()
      setResults(data.results || [])

      // Auto-expand all returned files
      const newExpanded = new Set<string>()
      data.results?.forEach((r: SearchResult) => newExpanded.add(r.file))
      setExpandedFiles(newExpanded)

    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setSearching(false)
    }
  }

  const toggleFile = (filePath: string) => {
    const next = new Set(expandedFiles)
    if (next.has(filePath)) next.delete(filePath)
    else next.add(filePath)
    setExpandedFiles(next)
  }

  const handleResultClick = (file: string, line: number) => {
    // Convert absolute path to something the editor can handle if needed, 
    // but usually openFile takes absolute path if local.
    // We will pass the full path.
    openFile({
      id: file,
      name: file.split('\\').pop()?.split('/').pop() || 'file',
      path: file,
      type: 'file',
      content: '' // Editor will load it
    })
  }

  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Search
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>

      <div className="p-3 border-b border-dark-border">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-dark-base border border-dark-border rounded px-3 py-1.5 pl-8 text-[13px] text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-text-secondary" />
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="flex flex-col items-center justify-center p-8 text-text-secondary">
            <Loader2 size={24} className="animate-spin mb-2" />
            <span className="text-xs">Searching...</span>
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <div className="p-4 text-center text-xs text-text-secondary">No results found.</div>
        )}

        {!searching && results.length === 0 && !query && (
          <div className="p-4 text-center text-xs text-text-secondary">Enter a term to search across files.</div>
        )}

        <div className="flex flex-col">
          {results.map((result) => {
            const isExpanded = expandedFiles.has(result.file)
            const fileName = result.file.split('\\').pop()?.split('/').pop()
            const relPath = rootDirectory?.path ? result.file.replace(rootDirectory.path, '') : result.file

            return (
              <div key={result.file} className="flex flex-col">
                <div
                  className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer select-none"
                  onClick={() => toggleFile(result.file)}
                >
                  {isExpanded ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />}
                  <File size={14} className="text-blue-400" />
                  <span className="text-xs font-semibold text-text-primary truncate" title={result.file}>
                    {fileName}
                    <span className="text-text-secondary font-normal ml-1 opacity-50 text-[10px]">{relPath}</span>
                  </span>
                  <span className="ml-auto text-[10px] bg-dark-base px-1.5 rounded-full text-text-secondary">{result.matches.length}</span>
                </div>

                {isExpanded && (
                  <div className="flex flex-col">
                    {result.matches.map((match, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 pl-8 pr-2 py-0.5 hover:bg-primary/20 cursor-pointer group"
                        onClick={() => handleResultClick(result.file, match.line)}
                      >
                        <span className="text-[10px] text-text-secondary font-mono w-6 text-right shrink-0 group-hover:text-text-primary">{match.line}:</span>
                        <span className="text-[11px] text-text-secondary truncate font-mono group-hover:text-white">
                          {match.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
