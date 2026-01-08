import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  FilePlus,
  FolderPlus,
  Upload,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Copy,
  Scissors,
  Clipboard,
  Files,
} from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import { useFileSystemStore, FileNode } from '../../stores/fileSystemStore'
import {
  openFolder,
  readFileContent,
  writeFileContent,
  createFile,
  createFolder,
  deleteNode,
  renameNode,
  uploadFiles,
  isFileSystemAccessSupported,
} from '../../utils/fileSystemUtils'
import { getLanguageFromFileName } from '../../utils/fileUtils'
import ContextMenu from '../ContextMenu'

type CreatingMode = 'file' | 'folder' | null
type ClipboardMode = 'copy' | 'cut' | null

interface ClipboardData {
  node: FileNode
  mode: ClipboardMode
}

export default function ExplorerPanel() {
  const openFile = useEditorStore((state) => state.openFile)
  const updateFileContent = useEditorStore((state) => state.updateFileContent)
  const openFiles = useEditorStore((state) => state.openFiles)

  const {
    rootDirectory,
    selectedNode,
    contextMenuNode,
    contextMenuPosition,
    setRootDirectory,
    addNode,
    deleteNode: deleteNodeFromStore,
    renameNode: renameNodeInStore,
    setSelectedNode,
    setContextMenu,
  } = useFileSystemStore()

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [renamingNode, setRenamingNode] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Inline creation state
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [creatingMode, setCreatingMode] = useState<CreatingMode>(null)
  const [creatingName, setCreatingName] = useState('')
  const [creationError, setCreationError] = useState<string | null>(null)

  // ✅ NEW: Clipboard state
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)

  // ✅ NEW: Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Delete - Delete selected file/folder
      if (e.key === 'Delete' && selectedNode) {
        e.preventDefault()
        handleDeleteSelected()
      }

      // F2 - Rename selected
      if (e.key === 'F2' && selectedNode) {
        e.preventDefault()
        handleRenameSelected()
      }

      // Ctrl+N - New file
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault()
        startCreating('file')
      }

      // Ctrl+Shift+N - New folder
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        startCreating('folder')
      }

      // Ctrl+D - Duplicate file
      if (e.ctrlKey && e.key === 'd' && selectedNode) {
        e.preventDefault()
        handleDuplicate()
      }

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c' && selectedNode) {
        e.preventDefault()
        handleCopy()
      }

      // Ctrl+X - Cut
      if (e.ctrlKey && e.key === 'x' && selectedNode) {
        e.preventDefault()
        handleCut()
      }

      // Ctrl+V - Paste
      if (e.ctrlKey && e.key === 'v' && clipboard && selectedNode) {
        e.preventDefault()
        handlePaste()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, clipboard, rootDirectory])

  const toggleFolder = async (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })

    // Lazy load for Dev Mode (Backend Files)
    if (!rootDirectory?.handle) {
      const node = findNodeByPath(folderId)

      if (node && node.type === 'folder' && (!node.children || node.children.length === 0) && !node.handle) {
        const children = await fetchBackendFiles(node.path)
        if (children.length > 0) {
          // We need to add these children to the store
          // Since we don't have a bulk add, we iterate
          children.forEach(child => addNode(node.path, child))

          // If we successfully fetched, strict mode might have prevented render update if we mutated, 
          // but addNode updates store which triggers render.
        }
      }
    }
  }

  const handleFileClick = async (node: FileNode) => {
    if (!node.handle || node.handle.kind !== 'file') return

    const fileHandle = node.handle as FileSystemFileHandle
    const content = await readFileContent(fileHandle)

    openFile({
      id: node.path,
      name: node.name,
      path: node.path,
      language: getLanguageFromFileName(node.name),
      content,
      handle: fileHandle,
    })

    setSelectedNode(node)
  }

  const handleFolderClick = (node: FileNode) => {
    toggleFolder(node.id)
    setSelectedNode(node)
  }

  // Dev Mode State
  const [showDevInput, setShowDevInput] = useState(false)
  const [manualPath, setManualPath] = useState('')

  const handleOpenFolder = async () => {
    const root = await openFolder()
    if (root) {
      // ✅ Ask user for the actual path - EMPTY input for manual paste
      const userPath = prompt(
        `📁 Folder "${root.name}" opened!\n\n` +
        `Please paste the full folder path for terminal:\n\n` +
        `Example: C:\\Users\\asus\\OneDrive\\Desktop\\${root.name}`
      )

      // ✅ Store path in root directory
      if (userPath && userPath.trim()) {
        root.path = userPath.trim()
        console.log('✅ Folder path set:', userPath.trim())
      } else {
        console.log('⚠️ No path provided')
      }

      setRootDirectory(root)
      setExpandedFolders(new Set([root.id]))
      setSelectedNode(root)
    }
  }

  // Fetch files from backend (Dev Mode fallback)
  const fetchBackendFiles = async (path: string): Promise<FileNode[]> => {
    console.log('Fetching backend files for:', path)
    try {
      const res = await fetch(`http://localhost:3001/api/files/list?path=${encodeURIComponent(path)}`)
      if (!res.ok) {
        const errText = await res.text()
        console.error('Backend fetch failed:', res.status, errText)
        alert(`Failed to fetch files: ${res.status} ${res.statusText}`)
        throw new Error('Failed to fetch files')
      }

      const files: any[] = await res.json()
      console.log('Fetched files:', files)

      const nodes = files.map((file: any) => ({
        id: file.path,
        name: file.name,
        type: file.type,
        path: file.path,
        handle: undefined,
        children: file.type === 'folder' ? [] : undefined
      }))
      return nodes
    } catch (error) {
      console.error('Backend file fetch error', error)
      alert(`Error fetching files: ${error}`)
      return []
    }
  }

  // Modified handleManualOpen to fetch initial files
  const handleManualOpen = async () => {
    if (!manualPath.trim()) return

    const name = manualPath.split(/[/\\]/).pop() || 'Project'

    // Fetch initial children
    console.log('Starting manual open for:', manualPath.trim())
    const children = await fetchBackendFiles(manualPath.trim())

    if (children.length === 0) {
      console.warn('No children found or fetch failed')
    }

    const manualRoot: FileNode = {
      id: "root-manual",
      name: name,
      type: "folder",
      path: manualPath.trim(),
      handle: undefined,
      children: children // Populate initial children
    }

    console.log('🔧 Dev Mode: Opening manual path:', manualPath, manualRoot)
    setRootDirectory(manualRoot)
    setExpandedFolders(new Set([manualRoot.id]))
    setSelectedNode(manualRoot)
    setShowDevInput(false)
  }

  // Also need to handle refreshing/expanding folders in backend mode. 
  // For now, let's just make the initial load work as per request.
  // Recursion for deep folders would require modifying toggleFolder to fetch if children empty and no handle.

  // Let's update buildFileTree to use backend if handle missing? No, buildFileTree takes handle.
  // We'll stick to handleManualOpen populating root.


  const handleRefresh = async () => {
    if (!rootDirectory || !rootDirectory.handle) return

    try {
      const dirHandle = rootDirectory.handle as FileSystemDirectoryHandle
      const currentExpanded = new Set(expandedFolders)
      const refreshedRoot = await buildFileTree(dirHandle, dirHandle.name)
      setRootDirectory(refreshedRoot)
      setExpandedFolders(currentExpanded)
      console.log('✅ Explorer refreshed successfully')
    } catch (error) {
      console.error('Error refreshing explorer:', error)
      alert('Failed to refresh explorer')
    }
  }

  const checkDuplicateName = (targetNode: FileNode, name: string, type: 'file' | 'folder'): string | null => {
    if (!targetNode.children) return null

    const nameLower = name.toLowerCase()

    for (const child of targetNode.children) {
      const childNameLower = child.name.toLowerCase()

      if (type === 'folder') {
        if (child.type === 'folder' && childNameLower === nameLower) {
          return `Folder "${name}" already exists`
        }
      } else {
        if (child.type === 'file' && childNameLower === nameLower) {
          return `File "${name}" already exists`
        }
      }
    }

    return null
  }

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Name cannot be empty'
    }

    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g
    if (invalidChars.test(name)) {
      return 'Name contains invalid characters'
    }

    if (name.trim().length === 0) {
      return 'Name cannot be only spaces'
    }

    return null
  }

  const startCreating = (mode: 'file' | 'folder') => {
    if (!rootDirectory) return

    let targetNode: FileNode

    if (selectedNode && selectedNode.type === 'folder') {
      targetNode = selectedNode
    } else if (selectedNode && selectedNode.type === 'file') {
      const parentNode = findNodeByPath(getParentPath(selectedNode.path))
      if (!parentNode) return
      targetNode = parentNode
    } else {
      targetNode = rootDirectory
    }

    if (!expandedFolders.has(targetNode.id)) {
      setExpandedFolders((prev) => new Set([...prev, targetNode.id]))
    }

    setCreatingIn(targetNode.path)
    setCreatingMode(mode)
    setCreatingName('')
    setCreationError(null)

    setTimeout(() => createInputRef.current?.focus(), 100)
  }

  const handleCreatingNameChange = (name: string) => {
    setCreatingName(name)
    if (creationError) {
      setCreationError(null)
    }
  }

  const confirmCreation = async () => {
    if (!creatingIn || !creatingMode) {
      cancelCreation()
      return
    }

    const name = creatingName.trim()

    const nameError = validateName(name)
    if (nameError) {
      setCreationError(nameError)
      return
    }

    const targetNode = findNodeByPath(creatingIn)
    if (!targetNode || !targetNode.handle) {
      cancelCreation()
      return
    }

    const duplicateError = checkDuplicateName(targetNode, name, creatingMode)
    if (duplicateError) {
      setCreationError(duplicateError)
      return
    }

    try {
      const targetHandle = targetNode.handle as FileSystemDirectoryHandle

      if (creatingMode === 'file') {
        const fileHandle = await createFile(targetHandle, name)
        const newNode: FileNode = {
          id: `${creatingIn}/${name}`,
          name: name,
          type: 'file',
          path: `${creatingIn}/${name}`,
          handle: fileHandle,
        }
        addNode(creatingIn, newNode)
      } else {
        const dirHandle = await createFolder(targetHandle, name)
        const newNode: FileNode = {
          id: `${creatingIn}/${name}`,
          name: name,
          type: 'folder',
          path: `${creatingIn}/${name}`,
          handle: dirHandle,
          children: [],
        }
        addNode(creatingIn, newNode)
      }

      cancelCreation()
    } catch (error: any) {
      console.error('Error creating:', error)

      if (error.message.includes('exist')) {
        setCreationError(`${creatingMode === 'file' ? 'File' : 'Folder'} already exists`)
      } else {
        setCreationError(`Failed to create ${creatingMode}`)
      }
    }
  }

  const cancelCreation = () => {
    setCreatingIn(null)
    setCreatingMode(null)
    setCreatingName('')
    setCreationError(null)
  }

  // ✅ NEW: Copy functionality
  const handleCopy = () => {
    if (!selectedNode) return
    setClipboard({ node: selectedNode, mode: 'copy' })
    console.log('📋 Copied:', selectedNode.name)
  }

  // ✅ NEW: Cut functionality
  const handleCut = () => {
    if (!selectedNode) return
    setClipboard({ node: selectedNode, mode: 'cut' })
    console.log('✂️ Cut:', selectedNode.name)
  }

  // ✅ NEW: Paste functionality
  const handlePaste = async () => {
    if (!clipboard || !selectedNode) return

    try {
      // Determine target folder
      let targetNode: FileNode
      if (selectedNode.type === 'folder') {
        targetNode = selectedNode
      } else {
        const parentNode = findNodeByPath(getParentPath(selectedNode.path))
        if (!parentNode) return
        targetNode = parentNode
      }

      const targetHandle = targetNode.handle as FileSystemDirectoryHandle
      const sourceNode = clipboard.node

      // Check for duplicate
      const duplicateError = checkDuplicateName(targetNode, sourceNode.name, sourceNode.type)
      if (duplicateError) {
        alert(duplicateError)
        return
      }

      if (clipboard.mode === 'copy') {
        // Copy file/folder
        await copyNode(sourceNode, targetHandle, targetNode.path)
        console.log('✅ Copied successfully')
      } else {
        // Move (cut) file/folder
        const sourceParentHandle = await getParentHandle(sourceNode)
        await copyNode(sourceNode, targetHandle, targetNode.path)
        await deleteNode(sourceParentHandle, sourceNode.name)
        deleteNodeFromStore(sourceNode.path)
        console.log('✅ Moved successfully')
        setClipboard(null)
      }

      handleRefresh()
    } catch (error) {
      console.error('Error pasting:', error)
      alert('Failed to paste')
    }
  }

  // ✅ NEW: Copy node (file or folder) to target
  const copyNode = async (
    node: FileNode,
    targetHandle: FileSystemDirectoryHandle,
    targetPath: string
  ) => {
    if (node.type === 'file') {
      const sourceHandle = node.handle as FileSystemFileHandle
      const content = await readFileContent(sourceHandle)
      const newFileHandle = await createFile(targetHandle, node.name)
      await writeFileContent(newFileHandle, content)

      const newNode: FileNode = {
        id: `${targetPath}/${node.name}`,
        name: node.name,
        type: 'file',
        path: `${targetPath}/${node.name}`,
        handle: newFileHandle,
      }
      addNode(targetPath, newNode)
    } else {
      // Copy folder recursively
      const newDirHandle = await createFolder(targetHandle, node.name)
      const newNode: FileNode = {
        id: `${targetPath}/${node.name}`,
        name: node.name,
        type: 'folder',
        path: `${targetPath}/${node.name}`,
        handle: newDirHandle,
        children: [],
      }
      addNode(targetPath, newNode)

      // Copy children
      if (node.children) {
        for (const child of node.children) {
          await copyNode(child, newDirHandle, `${targetPath}/${node.name}`)
        }
      }
    }
  }

  // ✅ NEW: Duplicate file
  const handleDuplicate = async () => {
    if (!selectedNode || selectedNode.type !== 'file') {
      alert('Can only duplicate files')
      return
    }

    try {
      const parentNode = findNodeByPath(getParentPath(selectedNode.path))
      if (!parentNode) return

      const parentHandle = parentNode.handle as FileSystemDirectoryHandle

      // Generate new name: file.txt -> file copy.txt
      const nameParts = selectedNode.name.split('.')
      let newName: string

      if (nameParts.length > 1) {
        const ext = nameParts.pop()
        newName = `${nameParts.join('.')} copy.${ext}`
      } else {
        newName = `${selectedNode.name} copy`
      }

      // Check if "copy" name exists, add number
      let finalName = newName
      let counter = 2
      while (checkDuplicateName(parentNode, finalName, 'file')) {
        if (nameParts.length > 1) {
          const ext = selectedNode.name.split('.').pop()
          finalName = `${nameParts.join('.')} copy ${counter}.${ext}`
        } else {
          finalName = `${selectedNode.name} copy ${counter}`
        }
        counter++
      }

      // Copy content
      const sourceHandle = selectedNode.handle as FileSystemFileHandle
      const content = await readFileContent(sourceHandle)
      const newFileHandle = await createFile(parentHandle, finalName)
      await writeFileContent(newFileHandle, content)

      const newNode: FileNode = {
        id: `${parentNode.path}/${finalName}`,
        name: finalName,
        type: 'file',
        path: `${parentNode.path}/${finalName}`,
        handle: newFileHandle,
      }
      addNode(parentNode.path, newNode)

      console.log('✅ File duplicated:', finalName)
    } catch (error) {
      console.error('Error duplicating:', error)
      alert('Failed to duplicate file')
    }
  }

  // ✅ NEW: Copy path to clipboard
  const handleCopyPath = async () => {
    if (!contextMenuNode) return
    try {
      await navigator.clipboard.writeText(contextMenuNode.path)
      console.log('📋 Copied path:', contextMenuNode.path)
      setContextMenu(null, null)
    } catch (error) {
      console.error('Error copying path:', error)
    }
  }

  // ✅ NEW: Copy relative path to clipboard
  const handleCopyRelativePath = async () => {
    if (!contextMenuNode || !rootDirectory) return
    try {
      const relativePath = contextMenuNode.path.replace(rootDirectory.path + '/', '')
      await navigator.clipboard.writeText(relativePath)
      console.log('📋 Copied relative path:', relativePath)
      setContextMenu(null, null)
    } catch (error) {
      console.error('Error copying relative path:', error)
    }
  }

  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu(node, { x: e.clientX, y: e.clientY })
  }

  const handleCreateFile = async () => {
    if (!contextMenuNode) return
    setContextMenu(null, null)
    setSelectedNode(contextMenuNode)
    startCreating('file')
  }

  const handleCreateFolder = async () => {
    if (!contextMenuNode) return
    setContextMenu(null, null)
    setSelectedNode(contextMenuNode)
    startCreating('folder')
  }

  // ✅ NEW: Delete from keyboard shortcut
  const handleDeleteSelected = async () => {
    if (!selectedNode || !selectedNode.handle) return

    const confirmed = confirm(`Are you sure you want to delete "${selectedNode.name}"?`)
    if (!confirmed) return

    try {
      const parentHandle = await getParentHandle(selectedNode)
      await deleteNode(parentHandle, selectedNode.name)
      deleteNodeFromStore(selectedNode.path)
      setSelectedNode(null)
      console.log('✅ Deleted:', selectedNode.name)
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    }
  }

  const handleDelete = async () => {
    if (!contextMenuNode || !contextMenuNode.handle) return

    const confirmed = confirm(`Are you sure you want to delete "${contextMenuNode.name}"?`)
    if (!confirmed) return

    try {
      const parentHandle = await getParentHandle(contextMenuNode)
      await deleteNode(parentHandle, contextMenuNode.name)
      deleteNodeFromStore(contextMenuNode.path)
      setContextMenu(null, null)
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    }
  }

  // ✅ NEW: Rename from keyboard shortcut
  const handleRenameSelected = () => {
    if (!selectedNode) return
    setRenamingNode(selectedNode.path)
    setNewName(selectedNode.name)
  }

  const handleRename = () => {
    if (!contextMenuNode) return
    setRenamingNode(contextMenuNode.path)
    setNewName(contextMenuNode.name)
    setContextMenu(null, null)
  }

  const handleRenameSubmit = async (node: FileNode) => {
    const trimmedName = newName.trim()

    if (!trimmedName || trimmedName === node.name) {
      setRenamingNode(null)
      return
    }

    const nameError = validateName(trimmedName)
    if (nameError) {
      alert(nameError)
      return
    }

    const parentNode = findNodeByPath(getParentPath(node.path))
    if (parentNode) {
      const duplicateError = checkDuplicateName(parentNode, trimmedName, node.type)
      if (duplicateError) {
        alert(duplicateError)
        return
      }
    }

    try {
      const parentHandle = await getParentHandle(node)
      await renameNode(parentHandle, node.name, trimmedName)
      renameNodeInStore(node.path, trimmedName)
      setRenamingNode(null)
    } catch (error) {
      console.error('Error renaming:', error)
      alert('Failed to rename')
      setRenamingNode(null)
    }
  }

  const handleUploadFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !rootDirectory || !rootDirectory.handle) return

    try {
      const dirHandle = rootDirectory.handle as FileSystemDirectoryHandle
      await uploadFiles(dirHandle, e.target.files)
      handleRefresh()
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
    }
  }

  useEffect(() => {
    const saveFile = async () => {
      for (const file of openFiles) {
        if (file.isDirty && file.handle) {
          try {
            await writeFileContent(file.handle as FileSystemFileHandle, file.content)
            updateFileContent(file.id, file.content)
          } catch (error) {
            console.error('Error saving file:', error)
          }
        }
      }
    }

    const interval = setInterval(saveFile, 2000)
    return () => clearInterval(interval)
  }, [openFiles, updateFileContent])

  async function buildFileTree(
    dirHandle: FileSystemDirectoryHandle,
    path: string
  ): Promise<FileNode> {
    const children: FileNode[] = []

    for await (const entry of dirHandle.values()) {
      const childPath = `${path}/${entry.name}`

      if (entry.kind === 'directory') {
        const childNode = await buildFileTree(entry, childPath)
        children.push(childNode)
      } else {
        children.push({
          id: childPath,
          name: entry.name,
          type: 'file',
          path: childPath,
          handle: entry,
        })
      }
    }

    return {
      id: path,
      name: dirHandle.name,
      type: 'folder',
      path,
      handle: dirHandle,
      children: children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name)
        return a.type === 'folder' ? -1 : 1
      }),
    }
  }

  function getParentPath(path: string): string {
    const parts = path.split('/')
    parts.pop()
    return parts.join('/')
  }

  function findNodeByPath(path: string): FileNode | null {
    if (!rootDirectory) return null

    const findNode = (node: FileNode): FileNode | null => {
      if (node.path === path) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child)
          if (found) return found
        }
      }
      return null
    }

    return findNode(rootDirectory)
  }

  async function getParentHandle(node: FileNode): Promise<FileSystemDirectoryHandle> {
    const parentPath = getParentPath(node.path)

    const findParent = (current: FileNode): FileSystemDirectoryHandle | null => {
      if (current.path === parentPath && current.handle?.kind === 'directory') {
        return current.handle as FileSystemDirectoryHandle
      }
      if (current.children) {
        for (const child of current.children) {
          const result = findParent(child)
          if (result) return result
        }
      }
      return null
    }

    const parentHandle = rootDirectory ? findParent(rootDirectory) : null
    if (!parentHandle) throw new Error('Parent directory not found')
    return parentHandle
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
      return <FileCode size={16} className="text-blue-400" />
    }
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) {
      return <FileCode size={16} className="text-yellow-400" />
    }
    if (fileName.endsWith('.json')) {
      return <FileJson size={16} className="text-yellow-400" />
    }
    if (fileName.endsWith('.md')) {
      return <FileText size={16} className="text-blue-300" />
    }
    if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
      return <FileCode size={16} className="text-purple-400" />
    }
    if (fileName.endsWith('.html')) {
      return <FileCode size={16} className="text-orange-400" />
    }
    if (fileName.endsWith('.py')) {
      return <FileCode size={16} className="text-green-400" />
    }
    return <FileText size={16} className="text-gray-400" />
  }

  const renderTree = (nodes: FileNode[], level: number = 0): React.ReactNode => {
    if (!nodes) return null

    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id)
      const isRenaming = renamingNode === node.path
      const isSelected = selectedNode?.path === node.path
      const isHovered = hoveredNode === node.path
      const isCut = clipboard?.mode === 'cut' && clipboard.node.path === node.path

      return (
        <div key={node.id}>
          <div
            className={`
              group flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-all
              ${isCut ? 'opacity-50' : ''}
              ${isSelected
                ? 'bg-primary/30 text-white border-l-2 border-primary'
                : isHovered
                  ? 'bg-dark-hover/80 text-white'
                  : 'text-text-primary hover:bg-dark-hover'
              }
            `}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                handleFolderClick(node)
              } else {
                handleFileClick(node)
              }
            }}
            onContextMenu={(e) => handleRightClick(e, node)}
            onMouseEnter={() => setHoveredNode(node.path)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {node.type === 'folder' ? (
              <>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-text-secondary shrink-0 transition-transform" />
                ) : (
                  <ChevronRight size={16} className="text-text-secondary shrink-0 transition-transform" />
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

            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => handleRenameSubmit(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(node)
                  if (e.key === 'Escape') setRenamingNode(null)
                }}
                className="flex-1 bg-dark-base text-text-primary text-[13px] px-2 py-0.5 outline-none border border-primary rounded cursor-text"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`text-[13px] truncate ${isSelected ? 'font-semibold' : ''}`}>
                {node.name}
              </span>
            )}
          </div>

          {node.type === 'folder' && isExpanded && creatingIn === node.path && (
            <div className="px-2 py-1">
              <div
                className={`flex items-center gap-1.5 py-1 bg-dark-hover/50 rounded ${creationError ? 'border border-red-500/50' : ''
                  }`}
                style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              >
                <span className="ml-4 shrink-0">
                  {creatingMode === 'file' ? (
                    <FileText size={16} className="text-gray-400" />
                  ) : (
                    <Folder size={16} className="text-yellow-500" />
                  )}
                </span>
                <input
                  ref={createInputRef}
                  type="text"
                  value={creatingName}
                  onChange={(e) => handleCreatingNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreation()
                    if (e.key === 'Escape') cancelCreation()
                  }}
                  placeholder={`${creatingMode === 'file' ? 'filename.ext' : 'foldername'}`}
                  className="flex-1 bg-dark-base text-text-primary text-[13px] px-2 py-0.5 outline-none border border-primary rounded"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={confirmCreation}
                  className="p-0.5 hover:bg-green-500/20 rounded transition-colors"
                  title="Confirm (Enter)"
                >
                  <Check size={14} className="text-green-400" />
                </button>
                <button
                  onClick={cancelCreation}
                  className="p-0.5 hover:bg-red-500/20 rounded transition-colors"
                  title="Cancel (Escape)"
                >
                  <X size={14} className="text-red-400" />
                </button>
              </div>

              {creationError && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 text-red-400 text-[11px]"
                  style={{ paddingLeft: `${(level + 1) * 12 + 32}px` }}
                >
                  <AlertCircle size={12} />
                  <span>{creationError}</span>
                </div>
              )}
            </div>
          )}

          {node.type === 'folder' && isExpanded && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0 select-none">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-base border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-primary uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          {rootDirectory && (
            <>
              <button
                onClick={() => startCreating('file')}
                className="p-1.5 hover:bg-dark-hover rounded transition-colors cursor-pointer"
                title="New File (Ctrl+N)"
              >
                <FilePlus size={16} className="text-text-primary hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => startCreating('folder')}
                className="p-1.5 hover:bg-dark-hover rounded transition-colors cursor-pointer"
                title="New Folder (Ctrl+Shift+N)"
              >
                <FolderPlus size={16} className="text-text-primary hover:text-primary transition-colors" />
              </button>

              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-dark-hover rounded transition-colors cursor-pointer"
                title="Refresh Explorer"
              >
                <RefreshCw size={16} className="text-text-primary hover:text-primary transition-colors" />
              </button>

              <button
                onClick={handleUploadFiles}
                className="p-1.5 hover:bg-dark-hover rounded transition-colors cursor-pointer"
                title="Upload Files"
              >
                <Upload size={16} className="text-text-primary hover:text-primary transition-colors" />
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto py-1">
        {rootDirectory ? (
          renderTree([rootDirectory])
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary px-4">
            <div className="bg-dark-base rounded-lg p-6 text-center border border-dark-border">
              <FolderPlus size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-sm text-text-primary font-semibold mb-1">No Folder Open</p>
              <p className="text-xs text-text-secondary mb-4">
                Open a folder to start working with files
              </p>
              <button
                onClick={handleOpenFolder}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/80 transition-colors shadow-lg cursor-pointer"
              >
                Open Folder
              </button>

              {/* ✅ Dev Mode: Manual Path Entry */}
              <div className="mt-4 w-full max-w-xs">
                {showDevInput ? (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="text"
                      value={manualPath}
                      onChange={(e) => setManualPath(e.target.value)}
                      placeholder="E:/path/to/project"
                      className="flex-1 bg-dark-surface border border-dark-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleManualOpen()}
                    />
                    <button
                      onClick={handleManualOpen}
                      className="px-2 py-1 bg-accent text-white rounded text-xs hover:bg-accent/80"
                    >
                      Go
                    </button>
                    <button
                      onClick={() => setShowDevInput(false)}
                      className="p-1 text-text-secondary hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDevInput(true)}
                    className="text-[10px] text-text-secondary hover:text-primary underline decoration-dotted"
                  >
                    Dev: Enter Path Manually
                  </button>
                )}
              </div>

              {!isFileSystemAccessSupported() && (
                <p className="mt-3 text-red-400 text-[10px]">
                  ⚠️ File System API not supported. Use Chrome or Edge.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Enhanced Context Menu */}
      {contextMenuPosition && contextMenuNode && (
        <ContextMenu
          position={contextMenuPosition}
          onClose={() => setContextMenu(null, null)}
          items={[
            {
              label: 'New File',
              icon: <FilePlus size={14} />,
              onClick: handleCreateFile,
              show: contextMenuNode.type === 'folder',
            },
            {
              label: 'New Folder',
              icon: <FolderPlus size={14} />,
              onClick: handleCreateFolder,
              show: contextMenuNode.type === 'folder',
            },
            { separator: true, show: contextMenuNode.type === 'folder' },
            {
              label: 'Copy',
              icon: <Copy size={14} />,
              onClick: () => {
                setSelectedNode(contextMenuNode)
                handleCopy()
                setContextMenu(null, null)
              },
            },
            {
              label: 'Cut',
              icon: <Scissors size={14} />,
              onClick: () => {
                setSelectedNode(contextMenuNode)
                handleCut()
                setContextMenu(null, null)
              },
            },
            {
              label: 'Paste',
              icon: <Clipboard size={14} />,
              onClick: () => {
                setSelectedNode(contextMenuNode)
                handlePaste()
              },
              show: clipboard !== null && contextMenuNode.type === 'folder',
            },
            {
              label: 'Duplicate',
              icon: <Files size={14} />,
              onClick: () => {
                setSelectedNode(contextMenuNode)
                handleDuplicate()
                setContextMenu(null, null)
              },
              show: contextMenuNode.type === 'file',
            },
            { separator: true },
            {
              label: 'Copy Path',
              onClick: handleCopyPath,
            },
            {
              label: 'Copy Relative Path',
              onClick: handleCopyRelativePath,
            },
            { separator: true },
            {
              label: 'Rename',
              onClick: handleRename,
            },
            {
              label: 'Delete',
              onClick: handleDelete,
              danger: true,
            },
          ]}
        />
      )}

      <div className="border-t border-dark-border bg-dark-base">
        <div className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-dark-hover transition-colors">
          <ChevronRight size={14} className="text-text-secondary" />
          <span className="text-[11px] font-bold text-text-primary uppercase tracking-wide">
            Outline
          </span>
        </div>
      </div>
    </div>
  )
}
