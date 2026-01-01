import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  FileText,
  MoreHorizontal 
} from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { getLanguageFromFileName, getSampleFileContent } from '../../utils/fileUtils'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
}

export default function ExplorerPanel() {
  const openFile = useEditorStore((state) => state.openFile)
  const [activeFile, setActiveFile] = useState<string>('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['root', 'src', 'components'])
  )

  const fileTree: FileNode[] = [
    {
      id: 'root',
      name: 'eracode-ide',
      type: 'folder',
      path: 'eracode-ide',
      children: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: 'components',
              name: 'components',
              type: 'folder',
              path: 'src/components',
              children: [
                {
                  id: 'sidebar',
                  name: 'Sidebar.tsx',
                  type: 'file',
                  path: 'src/components/Sidebar.tsx',
                },
                {
                  id: 'explorer',
                  name: 'ExplorerPanel.tsx',
                  type: 'file',
                  path: 'src/components/ExplorerPanel.tsx',
                },
              ],
            },
            {
              id: 'pages',
              name: 'pages',
              type: 'folder',
              path: 'src/pages',
              children: [
                {
                  id: 'mainpage',
                  name: 'MainPage.tsx',
                  type: 'file',
                  path: 'src/pages/MainPage.tsx',
                },
              ],
            },
            {
              id: 'app',
              name: 'App.tsx',
              type: 'file',
              path: 'src/App.tsx',
            },
            {
              id: 'main',
              name: 'main.tsx',
              type: 'file',
              path: 'src/main.tsx',
            },
            {
              id: 'index-css',
              name: 'index.css',
              type: 'file',
              path: 'src/index.css',
            },
          ],
        },
        {
          id: 'public',
          name: 'public',
          type: 'folder',
          path: 'public',
          children: [
            {
              id: 'vite-svg',
              name: 'vite.svg',
              type: 'file',
              path: 'public/vite.svg',
            },
          ],
        },
        {
          id: 'package',
          name: 'package.json',
          type: 'file',
          path: 'package.json',
        },
        {
          id: 'tsconfig',
          name: 'tsconfig.json',
          type: 'file',
          path: 'tsconfig.json',
        },
        {
          id: 'vite-config',
          name: 'vite.config.ts',
          type: 'file',
          path: 'vite.config.ts',
        },
        {
          id: 'readme',
          name: 'README.md',
          type: 'file',
          path: 'README.md',
        },
      ],
    },
  ]

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const handleFileClick = (fileName: string, filePath: string) => {
    setActiveFile(filePath)
    openFile({
      id: filePath,
      name: fileName,
      path: filePath,
      language: getLanguageFromFileName(fileName),
      content: getSampleFileContent(fileName),
    })
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <FileCode size={16} className="text-blue-400" />
    }
    if (fileName.endsWith('.json')) {
      return <FileJson size={16} className="text-yellow-400" />
    }
    if (fileName.endsWith('.md')) {
      return <FileText size={16} className="text-gray-400" />
    }
    if (fileName.endsWith('.css')) {
      return <FileCode size={16} className="text-purple-400" />
    }
    return <FileText size={16} className="text-gray-400" />
  }

  const renderTree = (nodes: FileNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id)
      const hasChildren = node.children && node.children.length > 0

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-dark-hover transition-colors ${
              node.type === 'file' && activeFile === node.path ? 'bg-selection text-white' : 'text-text-primary'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.id)
              } else {
                handleFileClick(node.name, node.path)
              }
            }}
          >
            {/* Folder/File Icon */}
            {node.type === 'folder' ? (
              <>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-text-secondary shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-text-secondary shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen size={16} className="text-yellow-500 shrink-0" />
                ) : (
                  <Folder size={16} className="text-yellow-500 shrink-0" />
                )}
              </>
            ) : (
              <span className="ml-4 shrink-0">{getFileIcon(node.name)}</span>
            )}

            {/* File/Folder Name */}
            <span className="text-[13px] truncate">{node.name}</span>
          </div>

          {/* Children */}
          {node.type === 'folder' && isExpanded && hasChildren && (
            <div>{renderTree(node.children!, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Explorer
        </span>
        <MoreHorizontal
          size={16}
          className="text-text-secondary hover:text-white cursor-pointer transition-colors"
        />
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {renderTree(fileTree)}
      </div>

      {/* Bottom Outline Section */}
      <div className="border-t border-dark-border">
        <div className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-dark-hover transition-colors">
          <ChevronRight size={14} className="text-text-secondary" />
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
            Outline
          </span>
        </div>
      </div>
    </div>
  )
}
