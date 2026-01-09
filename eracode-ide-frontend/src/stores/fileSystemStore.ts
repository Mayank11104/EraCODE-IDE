import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createIDBStorage } from './persistence'

export interface FileNode {
    id: string
    name: string
    type: 'file' | 'folder'
    path: string
    handle?: FileSystemHandle
    children?: FileNode[]
}

interface FileSystemStore {
    rootDirectory: FileNode | null
    selectedNode: FileNode | null
    contextMenuNode: FileNode | null
    contextMenuPosition: { x: number; y: number } | null

    setRootDirectory: (root: FileNode | null) => void
    addNode: (parentPath: string, node: FileNode) => void
    deleteNode: (path: string) => void
    renameNode: (path: string, newName: string) => void
    setSelectedNode: (node: FileNode | null) => void
    setContextMenu: (node: FileNode | null, position: { x: number; y: number } | null) => void
}

export const useFileSystemStore = create<FileSystemStore>()(
    persist(
        (set) => ({
            // ... (store implementation remains same)
            rootDirectory: null,
            selectedNode: null,
            contextMenuNode: null,
            contextMenuPosition: null,

            setRootDirectory: (root) => set({ rootDirectory: root }),

            addNode: (parentPath, node) =>
                set((state) => {
                    if (!state.rootDirectory) return state

                    const addToNode = (current: FileNode): FileNode => {
                        if (current.path === parentPath) {
                            return {
                                ...current,
                                children: [...(current.children || []), node].sort((a, b) => {
                                    if (a.type === b.type) return a.name.localeCompare(b.name)
                                    return a.type === 'folder' ? -1 : 1
                                }),
                            }
                        }
                        if (current.children) {
                            return {
                                ...current,
                                children: current.children.map(addToNode),
                            }
                        }
                        return current
                    }

                    return { rootDirectory: addToNode(state.rootDirectory) }
                }),

            deleteNode: (path) =>
                set((state) => {
                    if (!state.rootDirectory) return state

                    const deleteFromNode = (current: FileNode): FileNode | null => {
                        if (current.path === path) return null
                        if (current.children) {
                            return {
                                ...current,
                                children: current.children.map(deleteFromNode).filter((n): n is FileNode => n !== null),
                            }
                        }
                        return current
                    }

                    const newRoot = deleteFromNode(state.rootDirectory)
                    return { rootDirectory: newRoot }
                }),

            renameNode: (path, newName) =>
                set((state) => {
                    if (!state.rootDirectory) return state

                    const renameInNode = (current: FileNode): FileNode => {
                        if (current.path === path) {
                            const pathParts = path.split('/')
                            pathParts[pathParts.length - 1] = newName
                            const newPath = pathParts.join('/')
                            return { ...current, name: newName, path: newPath, id: newPath }
                        }
                        if (current.children) {
                            return {
                                ...current,
                                children: current.children.map(renameInNode),
                            }
                        }
                        return current
                    }

                    return { rootDirectory: renameInNode(state.rootDirectory) }
                }),

            setSelectedNode: (node) => set({ selectedNode: node }),

            setContextMenu: (node, position) =>
                set({ contextMenuNode: node, contextMenuPosition: position }),
        }),
        {
            name: 'filesystem-storage',
            storage: createIDBStorage(),
            partialize: (state) => ({ rootDirectory: state.rootDirectory }),
        }
    )
)
