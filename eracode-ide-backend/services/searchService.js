const fs = require('fs');
const path = require('path');

class SearchService {
    constructor() {
        this.ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode', '.idea'];
    }

    async searchRequest(cwd, query, settings = {}) {
        if (!query || !cwd) {
            throw new Error('Query and CWD are required');
        }

        const results = [];
        await this._searchRecursive(cwd, query, results, settings);
        return { results, count: results.length };
    }

    async _searchRecursive(dir, query, results, settings) {
        try {
            const files = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = path.join(dir, file.name);

                if (file.isDirectory()) {
                    if (!this.ignoreDirs.includes(file.name)) {
                        await this._searchRecursive(fullPath, query, results, settings);
                    }
                } else if (file.isFile()) {
                    // Simple text file check (skip binaries roughly)
                    if (this._isTextFile(file.name)) {
                        await this._searchInFile(fullPath, query, results, settings);
                    }
                }
            }
        } catch (error) {
            // Ignore access errors
            console.warn(`Skipping dir ${dir}: ${error.message}`);
        }
    }

    async _searchInFile(filePath, query, results, settings) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const isCaseSensitive = settings.caseSensitive || false;

            const matches = [];

            lines.forEach((line, index) => {
                const lineContent = isCaseSensitive ? line : line.toLowerCase();
                const searchQ = isCaseSensitive ? query : query.toLowerCase();

                if (lineContent.includes(searchQ)) {
                    matches.push({
                        line: index + 1,
                        content: line.trim()
                    });
                }
            });

            if (matches.length > 0) {
                results.push({
                    file: filePath,
                    matches
                });
            }
        } catch (error) {
            // Skip binary or unreadable files
        }
    }

    _isTextFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        // Skip obvious binaries
        const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.bin', '.zip', '.tar', '.gz'];
        return !binaryExts.includes(ext);
    }
}

module.exports = new SearchService();
