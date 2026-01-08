import { useState, useEffect, useRef } from 'react'
import { Gitgraph, templateExtend } from '@gitgraph/react'
import {
  GitBranch,
  RefreshCw,
  Check,
  Plus,
  Minus,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Clock,
  User,
  ExternalLink,
  Github,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { useFileSystemStore } from '../../stores/fileSystemStore'

interface GitStatus {
  isRepo: boolean
  current?: string
  tracking?: string
  ahead?: number
  behind?: number
  created?: string[]
  modified?: string[]
  deleted?: string[]
  staged?: string[]
  not_added?: string[]
  conflicted?: string[]
  files?: Array<{
    path: string
    index: string
    working_dir: string
  }>
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const Section = ({
  title,
  count,
  isOpen,
  onToggle,
  children,
  actions
}: {
  title: string,
  count?: number,
  isOpen: boolean,
  onToggle: () => void,
  children: React.ReactNode,
  actions?: React.ReactNode
}) => (
  <div className="border-b border-dark-border/50">
    <div
      className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-white/5 select-none text-xs"
      onClick={onToggle}
    >
      <div className="flex items-center gap-1 font-semibold text-text-secondary uppercase">
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
        {count !== undefined && <span className="bg-dark-base px-1.5 rounded-full text-[10px] ml-1">{count}</span>}
      </div>
      <div className="flex items-center" onClick={e => e.stopPropagation()}>
        {actions}
      </div>
    </div>
    {isOpen && (
      <div className="pb-2">
        {children}
      </div>
    )}
  </div>
);

export default function GitPanel() {
  const { rootDirectory } = useFileSystemStore()
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [pushPullLoading, setPushPullLoading] = useState(false)

  // Sections state
  const [expanded, setExpanded] = useState({ staged: true, changes: true, graph: true })

  const toggle = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const [commits, setCommits] = useState<any[]>([])

  const fetchLog = async () => {
    if (!rootDirectory?.path) return
    try {
      const res = await fetch(`http://localhost:3001/api/git/log?cwd=${encodeURIComponent(rootDirectory.path)}`)
      const data = await res.json()
      setCommits(data.all || [])
    } catch (error) {
      console.error('Failed to fetch git log', error)
    }
  }

  // Fetch log when graph is expanded or on mount/refresh
  useEffect(() => {
    if (expanded.graph) {
      fetchLog()
    }
  }, [expanded.graph, rootDirectory, status]) // Re-fetch on status change (new commit)

  const fetchStatus = async () => {
    if (!rootDirectory?.path) return
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3001/api/git/status?cwd=${encodeURIComponent(rootDirectory.path)}`)
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch git status', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [rootDirectory])

  const handleInit = async () => {
    if (!rootDirectory?.path) return
    try {
      await fetch('http://localhost:3001/api/git/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path })
      })
      fetchStatus()
    } catch (error) {
      alert('Failed to init git repo')
    }
  }

  const handleStage = async (file: string) => {
    if (!rootDirectory?.path) return
    try {
      await fetch('http://localhost:3001/api/git/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path, file })
      })
      fetchStatus()
    } catch (error) {
      console.error('Failed to stage file', error)
    }
  }

  const handleUnstage = async (file: string) => {
    if (!rootDirectory?.path) return
    try {
      await fetch('http://localhost:3001/api/git/unstage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path, file })
      })
      fetchStatus()
    } catch (error) {
      console.error('Failed to unstage file', error)
    }
  }

  const handleCommit = async () => {
    if (!rootDirectory?.path || !commitMessage) return
    try {
      await fetch('http://localhost:3001/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path, message: commitMessage })
      })
      setCommitMessage('')
      fetchStatus() // This will trigger log refresh too via dependency
    } catch (error) {
      console.error('Failed to commit', error)
      alert('Failed to commit')
    }
  }

  const handlePush = async () => {
    if (!rootDirectory?.path) return
    setPushPullLoading(true)
    try {
      await fetch('http://localhost:3001/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path })
      })
      fetchStatus()
      alert('Push successful')
    } catch (error) {
      console.error('Failed to push', error)
      alert('Failed to push')
    } finally {
      setPushPullLoading(false)
    }
  }

  const handlePull = async () => {
    if (!rootDirectory?.path) return
    setPushPullLoading(true)
    try {
      await fetch('http://localhost:3001/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: rootDirectory.path })
      })
      fetchStatus()
      alert('Pull successful')
    } catch (error) {
      console.error('Failed to pull', error)
      alert('Failed to pull')
    } finally {
      setPushPullLoading(false)
    }
  }

  // Helper to categorize files
  const getChanges = () => {
    if (!status) return { staged: [], changes: [] }

    // Staged files are in status.staged
    const staged = status.staged || []

    // Changes are modified, not_added, deleted, created (that are not staged)
    // simple-git status object can be a bit complex.
    // files[] array in status has all files with their status code (X, Y)
    // status.files = [{ path: 'foo.js', index: 'M', working_dir: ' ' }, ...]
    // But lets stick to the arrays if possible or use files if needed.

    // Actually simple-git returns 'files' array which is most reliable.
    // content of 'files': { path, index, working_dir }
    // index: ' ' (unmodified), 'M' (modified), 'A' (added), 'D' (deleted), 'R' (renamed), 'C' (copied), '?' (untracked)
    // working_dir: same codes

    // Let's rely on status.files if available, or fall back to arrays
    const changes: any[] = []
    const stagedFiles: any[] = []

    if (status.files) {
      // @ts-ignore
      status.files.forEach(file => {
        if (file.index !== ' ' && file.index !== '?') {
          stagedFiles.push(file)
        }
        if (file.working_dir !== ' ') {
          changes.push(file)
        }
      })
    } else {
      // Fallback if 'files' isn't populated for some reason (rare with simple-git)
      status.modified?.forEach(f => changes.push({ path: f, status: 'M' }))
      status.not_added?.forEach(f => changes.push({ path: f, status: '?' }))
      status.created?.forEach(f => changes.push({ path: f, status: 'A' }))
      status.deleted?.forEach(f => changes.push({ path: f, status: 'D' }))

      status.staged?.forEach(f => stagedFiles.push({ path: f, status: 'A' }))
    }

    // Deduping might be needed if using arrays, but 'files' logic is safer.
    // Let's use simple logic:
    // Files in 'staged' vs 'changes'

    return { staged: stagedFiles, changes }
  }

  const { staged, changes } = getChanges()

  if (!rootDirectory) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-text-secondary">
        <p>No folder opened.</p>
        <p className="text-xs mt-2">Open a folder to use Source Control.</p>
      </div>
    )
  }

  if (status && !status.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-text-primary mb-4">No git repository found.</p>
        <button
          onClick={handleInit}
          className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <GitBranch size={16} />
          Initialize Repostory
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-dark-surface">
      {/* Header */}
      <div className="p-3 border-b border-dark-border flex items-center justify-between bg-dark-base">
        <span className="font-medium text-xs uppercase tracking-wider text-text-secondary">Source Control</span>
        <div className="flex items-center gap-1">
          <button onClick={() => fetchStatus()} title="Refresh" className="p-1 hover:bg-white/10 rounded">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handlePull} title="Pull" disabled={pushPullLoading} className="p-1 hover:bg-white/10 rounded">
            <ArrowDown size={14} />
          </button>
          <button onClick={handlePush} title="Push" disabled={pushPullLoading} className="p-1 hover:bg-white/10 rounded">
            <ArrowUp size={14} />
          </button>
          <button title="More Actions" className="p-1 hover:bg-white/10 rounded">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Commit Input - Always Visible */}
      <div className="p-3 border-b border-dark-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Message (Ctrl+Enter to commit)"
            className="flex-1 bg-dark-base border border-dark-border rounded px-2 py-1.5 text-sm outline-none focus:border-primary text-text-primary"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleCommit()
              }
            }}
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage || staged.length === 0}
            className="bg-primary text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
            title="Commit"
          >
            <Check size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        <Section
          title="Staged Changes"
          count={staged.length}
          isOpen={expanded.staged}
          onToggle={() => toggle('staged')}
          actions={
            staged.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); staged.forEach(f => handleUnstage(f.path)); }}
                className="text-[10px] hover:text-white text-text-secondary px-2"
              >
                Unstage All
              </button>
            )
          }
        >
          {staged.length === 0 && <div className="text-xs text-text-secondary px-4 italic py-1">No staged changes</div>}
          <div>
            {staged.map((file: any) => (
              <div key={file.path} className="group flex items-center justify-between px-4 py-1 hover:bg-white/5 rounded cursor-pointer text-sm">
                <span className="flex-1 truncate text-green-400 font-mono text-xs">{file.path}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => handleUnstage(file.path)} title="Unstage">
                    <Minus size={14} className="text-text-secondary hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Changes */}
        <Section
          title="Changes"
          count={changes.length}
          isOpen={expanded.changes}
          onToggle={() => toggle('changes')}
          actions={
            changes.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); changes.forEach(f => handleStage(f.path)); }}
                className="text-[10px] hover:text-white text-text-secondary px-2"
              >
                Stage All
              </button>
            )
          }
        >
          {changes.length === 0 && <div className="text-xs text-text-secondary px-4 italic py-1">No changes</div>}
          <div>
            {changes.map((file: any) => (
              <div key={file.path} className="group flex items-center justify-between px-4 py-1 hover:bg-white/5 rounded cursor-pointer text-sm">
                <div className="flex items-center gap-2 flex-1 truncate">
                  <span className="text-yellow-400 font-mono text-xs w-3 text-center">
                    {file.working_dir !== ' ' ? 'M' : '?'}
                  </span>
                  <span className="truncate text-text-primary text-xs">{file.path}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => handleStage(file.path)} title="Stage">
                    <Plus size={14} className="text-text-secondary hover:text-white" />
                  </button>
                  <button title="Discard Changes">
                    <RotateCcw size={14} className="text-text-secondary hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Graph Section */}
        <Section
          title="Commits (Graph)"
          isOpen={expanded.graph}
          onToggle={() => toggle('graph')}
        >
          <div className="pl-2 relative min-h-[300px]">
            {commits.length === 0 ? (
              <div className="text-center text-text-secondary text-xs mt-4">
                No commits loaded.
              </div>
            ) : (
              <GitgraphWrapper commits={commits} />
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

const GitgraphWrapper = ({ commits }: { commits: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: any } | null>(null);

  const handleMouseOver = (commit: any, event: any) => {
    if (!containerRef.current) return;

    // We want the tooltip to hover near the mouse or the target
    // Using mouse position relative to container is safest if fixed is issue
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate position relative to the container
    const relativeX = event.clientX - containerRect.left;
    const relativeY = event.clientY - containerRect.top;

    setTooltip({
      x: relativeX + 20, // slight offset
      y: relativeY,
      data: commit
    });
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };

  return (
    <div className="p-2 relative min-h-full" ref={containerRef}>
      <Gitgraph
        options={{
          template: templateExtend("metro", {
            colors: ["#F2A900", "#00BFFF", "#008000", "#FF6961", "#A64DFF"],
            branch: {
              lineWidth: 2,
              spacing: 12, // Compact spacing
              label: {
                display: false,
              },
            },
            commit: {
              spacing: 24,
              dot: {
                size: 5,
                strokeWidth: 1.5,
              },
              message: {
                displayAuthor: true,
                displayHash: false,
                font: "normal 11px 'Segoe UI', sans-serif",
                color: '#cccccc'
              }
            },
          }),
          orientation: "vertical-reverse",
          // @ts-ignore
          onCommitDotMouseOver: handleMouseOver,
          onCommitMessageMouseOver: handleMouseOver,
          onCommitDotMouseOut: handleMouseOut,
          onCommitMessageMouseOut: handleMouseOut,
        }}
      >
        {(gitgraph) => {
          try {
            const importedCommits = commits.map(c => {
              const refs = c.refs
                ? c.refs.replace(/[()]/g, '').split(',').map((r: string) => r.trim()).filter((r: string) => r)
                : [];

              return {
                hash: c.hash,
                hashAbbrev: c.hash ? c.hash.substring(0, 7) : '',
                parents: c.parents || [],
                author: {
                  name: c.author_name,
                  email: c.author_email,
                  timestamp: Math.floor(new Date(c.date).getTime() / 1000),
                  timezone: ""
                },
                committer: {
                  name: c.author_name,
                  email: c.author_email,
                  timestamp: Math.floor(new Date(c.date).getTime() / 1000),
                  timezone: ""
                },
                subject: c.message,
                body: "",
                notes: "",
                refs: refs,
                // Pass original date string for tooltip display
                originalDate: c.date
              };
            });

            gitgraph.import(importedCommits);
          } catch (err) {
            console.error("Gitgraph import failed", err);
          }
        }}
      </Gitgraph>

      {tooltip && (
        <div
          className="absolute z-50 bg-[#252526] border border-[#454545] shadow-xl rounded px-3 py-2 text-xs text-[#cccccc] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            minWidth: '300px',
            maxWidth: '400px',
            transform: 'translateY(-10%)'
          }}
        >
          {/* Header: User, Time, Date */}
          <div className="flex items-center gap-2 mb-2 text-[#cccccc]">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
              {tooltip.data.author.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-white">{tooltip.data.author.name}</span>
            <span className="flex items-center gap-1 text-[#aaaaaa]">
              <Clock size={10} />
              {formatTimeAgo(tooltip.data.originalDate)}
            </span>
            <span className="text-[#888888]">
              ({new Date(tooltip.data.originalDate).toLocaleString()})
            </span>
          </div>

          {/* Body: Message */}
          <div className="mb-3 text-[13px] leading-tight text-white font-medium">
            {tooltip.data.subject}
          </div>

          {/* Refs */}
          {tooltip.data.refs && tooltip.data.refs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tooltip.data.refs.map((r: string) => (
                <div key={r} className="flex items-center gap-1 px-1.5 py-0.5 bg-[#007acc]/20 border border-[#007acc]/40 text-[#4daafc] rounded text-[10px]">
                  <GitBranch size={10} />
                  {r}
                </div>
              ))}
            </div>
          )}

          {/* Footer: Hash, Links */}
          <div className="flex items-center justify-between pt-2 border-t border-[#454545]">
            <div className="flex items-center gap-2">
              <span className="text-[#4daafc] font-mono hover:underline cursor-pointer flex items-center gap-1">
                {tooltip.data.hashAbbrev}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#4daafc] hover:underline cursor-pointer">
                <Github size={10} />
                Open on GitHub
                <ExternalLink size={10} />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
