import { create } from 'zustand'

export interface EditorFile {
    id: string
    name: string
    path: string
    language: string
    content: string
    isDirty?: boolean
    handle?: FileSystemFileHandle // ✅ ADD THIS
}

interface EditorStore {
    openFiles: EditorFile[]
    activeFileId: string | null

    openFile: (file: EditorFile) => void
    closeFile: (fileId: string) => void
    setActiveFile: (fileId: string) => void
    updateFileContent: (fileId: string, content: string) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
    openFiles: [],
    activeFileId: null,

    openFile: (file) =>
        set((state) => {
            const exists = state.openFiles.find((f) => f.id === file.id)
            if (exists) {
                return { activeFileId: file.id }
            }
            return {
                openFiles: [...state.openFiles, file],
                activeFileId: file.id,
            }
        }),

    closeFile: (fileId) =>
        set((state) => {
            const newFiles = state.openFiles.filter((f) => f.id !== fileId)
            const newActiveId =
                state.activeFileId === fileId
                    ? newFiles.length > 0
                        ? newFiles[newFiles.length - 1].id
                        : null
                    : state.activeFileId

            return {
                openFiles: newFiles,
                activeFileId: newActiveId,
            }
        }),

    setActiveFile: (fileId) => set({ activeFileId: fileId }),

    updateFileContent: (fileId, content) =>
        set((state) => ({
            openFiles: state.openFiles.map((file) =>
                file.id === fileId
                    ? { ...file, content, isDirty: file.content !== content }
                    : file
            ),
        })),
}))
