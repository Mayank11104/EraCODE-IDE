import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  Settings as SettingsIcon,
  MoreHorizontal
} from 'lucide-react'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

export default function ExplorerPanel() {
  const [activeFile, setActiveFile] = useState('main.tsx')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['root', 'src', 'components'])
  )

  const fileTree: FileNode[] = [
    {
      id: 'root',
      name: 'eracode-ide',
      type: 'folder',
      children: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          children: [
            {
              id: 'components',
              name: 'components',
              type: 'folder',
              children: [
                { id: 'sidebar', name: 'Sidebar.tsx', type: 'file' },
                { id: 'explorer', name: 'ExplorerPanel.tsx', type: 'file' },
              ]
            },
            {
              id: 'pages',
              name: 'pages',
              type: 'folder',
              children: [
                { id: 'mainpage', name: 'MainPage.tsx', type: 'file' },
              ]
            },
            { id: 'app', name: 'App.tsx', type: 'file' },
            { id: 'main', name: 'main.tsx', type: 'file' },
          ]
        },
        { id: 'package', name: 'package.json', type: 'file' },
      ]
    }
  ]

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <FileCode size={16} className="text-cyan-400" />
    }
    if (fileName.endsWith('.json')) {
      return <FileJson size={16} className="text-yellow-500" />
    }
    if (fileName.endsWith('.css')) {
      return <FileText size={16} className="text-blue-400" />
    }
    return <FileText size={16} className="text-text-secondary" />
  }

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id)
      const isActive = activeFile === node.name

      if (node.type === 'folder') {
        return (
          <div key={node.id}>
            <div
              onClick={() => toggleFolder(node.id)}
              className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-dark-hover transition-colors"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-text-secondary flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen size={16} className="text-yellow-500 flex-shrink-0" />
              ) : (
                <Folder size={16} className="text-yellow-500 flex-shrink-0" />
              )}
              <span className="text-[13px] text-text-primary truncate">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, level + 1)}</div>
            )}
          </div>
        )
      }

      return (
        <div
          key={node.id}
          onClick={() => setActiveFile(node.name)}
          className={`
            flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-colors
            ${isActive ? 'bg-dark-hover text-white' : 'text-text-primary hover:bg-dark-hover/50'}
          `}
          style={{ paddingLeft: `${level * 12 + 28}px` }}
        >
          {getFileIcon(node.name)}
          <span className="text-[13px] truncate">{node.name}</span>
        </div>
      )
    })
  }

  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Explorer
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {renderTree(fileTree)}
      </div>
    </div>
  )
}
