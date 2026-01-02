import { create } from 'zustand'

export interface FileNode {
    id: string
    name: string
    type: 'file' | 'folder'
    path: string
    content?: string
    handle?: FileSystemFileHandle | FileSystemDirectoryHandle
    children?: FileNode[]
}

interface FileSystemStore {
    rootDirectory: FileNode | null
    selectedNode: FileNode | null
    contextMenuNode: FileNode | null
    contextMenuPosition: { x: number; y: number } | null

    // Actions
    setRootDirectory: (root: FileNode) => void
    addNode: (parentPath: string, node: FileNode) => void
    deleteNode: (path: string) => void
    renameNode: (path: string, newName: string) => void
    updateNodeContent: (path: string, content: string) => void
    setSelectedNode: (node: FileNode | null) => void
    setContextMenu: (node: FileNode | null, position: { x: number; y: number } | null) => void
}

export const useFileSystemStore = create<FileSystemStore>((set) => ({
    rootDirectory: null,
    selectedNode: null,
    contextMenuNode: null,
    contextMenuPosition: null,

    setRootDirectory: (root) => set({ rootDirectory: root }),

    addNode: (parentPath, node) =>
        set((state) => {
            if (!state.rootDirectory) return state
            const newRoot = addNodeToTree(state.rootDirectory, parentPath, node)
            return { rootDirectory: newRoot }
        }),

    deleteNode: (path) =>
        set((state) => {
            if (!state.rootDirectory) return state
            const newRoot = deleteNodeFromTree(state.rootDirectory, path)
            return { rootDirectory: newRoot }
        }),

    renameNode: (path, newName) =>
        set((state) => {
            if (!state.rootDirectory) return state
            const newRoot = renameNodeInTree(state.rootDirectory, path, newName)
            return { rootDirectory: newRoot }
        }),

    updateNodeContent: (path, content) =>
        set((state) => {
            if (!state.rootDirectory) return state
            const newRoot = updateNodeContentInTree(state.rootDirectory, path, content)
            return { rootDirectory: newRoot }
        }),

    setSelectedNode: (node) => set({ selectedNode: node }),

    setContextMenu: (node, position) =>
        set({ contextMenuNode: node, contextMenuPosition: position }),
}))

// Helper functions
function addNodeToTree(root: FileNode, parentPath: string, newNode: FileNode): FileNode {
    if (root.path === parentPath) {
        return {
            ...root,
            children: [...(root.children || []), newNode],
        }
    }

    if (root.children) {
        return {
            ...root,
            children: root.children.map((child) => addNodeToTree(child, parentPath, newNode)),
        }
    }

    return root
}

function deleteNodeFromTree(root: FileNode, path: string): FileNode {
    if (root.children) {
        return {
            ...root,
            children: root.children
                .filter((child) => child.path !== path)
                .map((child) => deleteNodeFromTree(child, path)),
        }
    }
    return root
}

function renameNodeInTree(root: FileNode, path: string, newName: string): FileNode {
    if (root.path === path) {
        const pathParts = path.split('/')
        pathParts[pathParts.length - 1] = newName
        return {
            ...root,
            name: newName,
            path: pathParts.join('/'),
        }
    }

    if (root.children) {
        return {
            ...root,
            children: root.children.map((child) => renameNodeInTree(child, path, newName)),
        }
    }

    return root
}

function updateNodeContentInTree(root: FileNode, path: string, content: string): FileNode {
    if (root.path === path) {
        return { ...root, content }
    }

    if (root.children) {
        return {
            ...root,
            children: root.children.map((child) => updateNodeContentInTree(child, path, content)),
        }
    }

    return root
}
