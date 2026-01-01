import { create } from 'zustand';

interface OpenFile {
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
    isDirty: boolean;
}

interface EditorStore {
    openFiles: OpenFile[];
    activeFileId: string | null;
    openFile: (file: Omit<OpenFile, 'isDirty'>) => void;
    closeFile: (id: string) => void;
    setActiveFile: (id: string) => void;
    updateFileContent: (id: string, content: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
    openFiles: [],
    activeFileId: null,

    openFile: (file) => set((state) => {
        // Check if file already open
        const exists = state.openFiles.find(f => f.id === file.id);

        if (exists) {
            // Just switch to it
            return { activeFileId: file.id };
        }

        // Add new file
        return {
            openFiles: [...state.openFiles, { ...file, isDirty: false }],
            activeFileId: file.id,
        };
    }),

    closeFile: (id) => set((state) => {
        const newFiles = state.openFiles.filter(f => f.id !== id);
        const newActiveId = state.activeFileId === id
            ? (newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null)
            : state.activeFileId;

        return {
            openFiles: newFiles,
            activeFileId: newActiveId,
        };
    }),

    setActiveFile: (id) => set({ activeFileId: id }),

    updateFileContent: (id, content) => set((state) => ({
        openFiles: state.openFiles.map(f =>
            f.id === id ? { ...f, content, isDirty: true } : f
        ),
    })),
}));
