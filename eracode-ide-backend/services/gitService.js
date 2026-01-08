const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

class GitService {
    constructor() {
        this.git = simpleGit();
    }

    /**
     * Initialize git in the given directory
     */
    async init(cwd) {
        try {
            await this.git.cwd(cwd).init();
            return { success: true, message: 'Initialized empty Git repository' };
        } catch (error) {
            throw new Error(`Failed to init: ${error.message}`);
        }
    }

    /**
     * Get status of the repository
     */
    async getStatus(cwd) {
        try {
            if (!fs.existsSync(path.join(cwd, '.git'))) {
                return { isRepo: false };
            }

            const status = await this.git.cwd(cwd).status();
            // Add isRepo flag for frontend convenience
            return { ...status, isRepo: true };
        } catch (error) {
            // If not a git repo, simple-git might throw. Handle gracefully.
            if (error.message.includes('not a git repository')) {
                return { isRepo: false };
            }
            throw new Error(`Failed to get status: ${error.message}`);
        }
    }

    async stageFile(cwd, filePath) {
        try {
            await this.git.cwd(cwd).add(filePath);
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to stage file: ${error.message}`);
        }
    }

    async unstageFile(cwd, filePath) {
        try {
            await this.git.cwd(cwd).reset(['HEAD', filePath]);
            return { success: true };
        } catch (error) {
            // If no HEAD (initial commit), we might need to use 'rm --cached'
            try {
                await this.git.cwd(cwd).rmKeepLocal(filePath);
                return { success: true };
            } catch (innerError) {
                throw new Error(`Failed to unstage file: ${error.message}`);
            }
        }
    }

    async commit(cwd, message) {
        try {
            const result = await this.git.cwd(cwd).commit(message);
            return result;
        } catch (error) {
            throw new Error(`Failed to commit: ${error.message}`);
        }
    }

    async push(cwd) {
        try {
            // Assumes 'origin' and current branch. 
            // In a real IDE, you'd likely want to configure remote/branch.
            await this.git.cwd(cwd).push();
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to push: ${error.message}`);
        }
    }

    async pull(cwd) {
        try {
            await this.git.cwd(cwd).pull();
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to pull: ${error.message}`);
        }
    }

    async getLog(cwd) {
        try {
            // using a specialized separator for easier parsing
            const SPLIT_CHAR = '||||';
            const FORMAT = `%H${SPLIT_CHAR}%P${SPLIT_CHAR}%an${SPLIT_CHAR}%ae${SPLIT_CHAR}%ad${SPLIT_CHAR}%s${SPLIT_CHAR}%d`;

            const result = await this.git.cwd(cwd).raw([
                'log',
                '--all',
                '--date=iso',
                `--pretty=format:${FORMAT}`
            ]);

            if (!result) return { all: [], total: 0 };

            const lines = result.split('\n');
            const all = lines
                .filter(line => line.trim() !== '')
                .map(line => {
                    const [hash, parentsStr, author_name, author_email, date, message, refs] = line.split(SPLIT_CHAR);
                    return {
                        hash,
                        parents: parentsStr ? parentsStr.split(' ') : [],
                        author_name,
                        author_email,
                        date,
                        message,
                        refs: refs || ''
                    };
                });

            return { all, total: all.length };
        } catch (error) {
            // Fallback for empty repo or errors
            return { all: [], total: 0 };
        }
    }
}

module.exports = new GitService();
