const fs = require('fs').promises;
const path = require('path');

class FileService {
    /**
     * List files in a directory
     * @param {string} dirPath 
     * @returns {Promise<Array>}
     */
    async listDir(dirPath) {
        try {
            // Check if directory exists
            await fs.access(dirPath);

            const stats = await fs.stat(dirPath);
            if (!stats.isDirectory()) {
                throw new Error(`${dirPath} is not a directory`);
            }

            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            const files = entries.map(entry => {
                const fullPath = path.join(dirPath, entry.name).replace(/\\/g, '/'); // Normalize paths
                return {
                    name: entry.name,
                    type: entry.isDirectory() ? 'folder' : 'file',
                    path: fullPath
                };
            });

            // Sort: folders first, then files
            return files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'folder' ? -1 : 1;
            });
        } catch (error) {
            throw new Error(`Failed to list directory: ${error.message}`);
        }
    }
}

module.exports = new FileService();
