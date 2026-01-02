import { FileNode } from '../stores/fileSystemStore'

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
}

// Open folder picker and load directory structure
export async function openFolder(): Promise<FileNode | null> {
    if (!isFileSystemAccessSupported()) {
        alert('File System Access API is not supported in your browser. Please use Chrome or Edge.')
        return null
    }

    try {
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
        })

        const rootNode = await buildFileTree(dirHandle, dirHandle.name)
        return rootNode
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.log('User cancelled folder selection')
        } else {
            console.error('Error opening folder:', error)
        }
        return null
    }
}

// Recursively build file tree from directory handle
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
            // Folders first, then files, alphabetically
            if (a.type === b.type) return a.name.localeCompare(b.name)
            return a.type === 'folder' ? -1 : 1
        }),
    }
}

// Read file content
export async function readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile()
    return await file.text()
}

// Write content to file
export async function writeFileContent(
    fileHandle: FileSystemFileHandle,
    content: string
): Promise<void> {
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
}

// Create new file
export async function createFile(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string
): Promise<FileSystemFileHandle> {
    return await dirHandle.getFileHandle(fileName, { create: true })
}

// Create new folder
export async function createFolder(
    dirHandle: FileSystemDirectoryHandle,
    folderName: string
): Promise<FileSystemDirectoryHandle> {
    return await dirHandle.getDirectoryHandle(folderName, { create: true })
}

// Delete file or folder
export async function deleteNode(
    parentHandle: FileSystemDirectoryHandle,
    name: string
): Promise<void> {
    await parentHandle.removeEntry(name, { recursive: true })
}

// Rename file or folder (File System API doesn't support rename, so we copy & delete)
export async function renameNode(
    parentHandle: FileSystemDirectoryHandle,
    oldName: string,
    newName: string
): Promise<void> {
    // Get the old entry
    let oldHandle: FileSystemFileHandle | FileSystemDirectoryHandle
    try {
        oldHandle = await parentHandle.getFileHandle(oldName)
    } catch {
        oldHandle = await parentHandle.getDirectoryHandle(oldName)
    }

    if (oldHandle.kind === 'file') {
        // For files: read content, create new, delete old
        const fileHandle = oldHandle as FileSystemFileHandle
        const content = await readFileContent(fileHandle)
        const newFileHandle = await createFile(parentHandle, newName)
        await writeFileContent(newFileHandle, content)
        await deleteNode(parentHandle, oldName)
    } else {
        // For folders: create new, copy contents recursively, delete old
        const newDirHandle = await createFolder(parentHandle, newName)
        await copyDirectory(oldHandle as FileSystemDirectoryHandle, newDirHandle)
        await deleteNode(parentHandle, oldName)
    }
}

// Copy directory recursively
async function copyDirectory(
    sourceDir: FileSystemDirectoryHandle,
    targetDir: FileSystemDirectoryHandle
): Promise<void> {
    for await (const entry of sourceDir.values()) {
        if (entry.kind === 'file') {
            const fileHandle = entry as FileSystemFileHandle
            const content = await readFileContent(fileHandle)
            const newFileHandle = await createFile(targetDir, entry.name)
            await writeFileContent(newFileHandle, content)
        } else {
            const dirHandle = entry as FileSystemDirectoryHandle
            const newDirHandle = await createFolder(targetDir, entry.name)
            await copyDirectory(dirHandle, newDirHandle)
        }
    }
}

// Upload files via input
export async function uploadFiles(
    dirHandle: FileSystemDirectoryHandle,
    files: FileList
): Promise<void> {
    for (const file of Array.from(files)) {
        const fileHandle = await createFile(dirHandle, file.name)
        const content = await file.text()
        await writeFileContent(fileHandle, content)
    }
}
