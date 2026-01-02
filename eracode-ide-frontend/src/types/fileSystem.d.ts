interface FileSystemHandle {
    readonly kind: 'file' | 'directory'
    readonly name: string
}

interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file'
    getFile(): Promise<File>
    createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory'
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    getDirectoryHandle(
        name: string,
        options?: { create?: boolean }
    ): Promise<FileSystemDirectoryHandle>
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    values(): AsyncIterableIterator<FileSystemHandle>
}

interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>
    close(): Promise<void>
}

interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>
    showOpenFilePicker(): Promise<FileSystemFileHandle[]>
    showSaveFilePicker(): Promise<FileSystemFileHandle>
}
