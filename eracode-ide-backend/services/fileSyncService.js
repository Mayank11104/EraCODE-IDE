const chokidar = require('chokidar');
const SFTPClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class FileSyncService {
  constructor() {
    this.syncSessions = new Map(); // sessionId -> syncConfig
  }

  /**
   * Start real-time sync between local and cloud
   */
  async startSync(sessionId, sshConnection, localPath, remotePath, socket) {
    try {
      logger.info(`🔄 Starting real-time sync: ${localPath} <-> ${remotePath}`);

      // Create SFTP client
      const sftp = new SFTPClient();
      await sftp.connect({
        sock: sshConnection._sock // Use existing SSH connection
      });

      // Initial upload of all files
      socket.emit('cloud-terminal:progress', {
        stage: 'syncing',
        message: 'Uploading project files...',
        progress: 70
      });

      await this.uploadDirectory(sftp, localPath, remotePath);
      
      logger.success(`✅ Initial sync complete`);

      // Watch local files for changes
      const watcher = chokidar.watch(localPath, {
        ignored: /(^|[\/\\])\../, // Ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      });

      // Handle local file changes
      watcher
        .on('add', async (filePath) => {
          await this.handleLocalAdd(sftp, localPath, remotePath, filePath, socket, sessionId);
        })
        .on('change', async (filePath) => {
          await this.handleLocalChange(sftp, localPath, remotePath, filePath, socket, sessionId);
        })
        .on('unlink', async (filePath) => {
          await this.handleLocalDelete(sftp, localPath, remotePath, filePath, socket, sessionId);
        });

      // Store sync session
      this.syncSessions.set(sessionId, {
        sftp,
        watcher,
        localPath,
        remotePath,
        sshConnection
      });

      logger.success(`✅ Real-time sync active for ${sessionId}`);
      
      socket.emit('cloud-terminal:sync-started', {
        sessionId,
        localPath,
        remotePath
      });

    } catch (error) {
      logger.error('Sync start failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload entire directory recursively
   */
  async uploadDirectory(sftp, localDir, remoteDir) {
    try {
      // Create remote directory
      await sftp.mkdir(remoteDir, true);

      // Get all local files
      const files = await fs.readdir(localDir, { withFileTypes: true });

      for (const file of files) {
        const localPath = path.join(localDir, file.name);
        const remotePath = `${remoteDir}/${file.name}`;

        // Skip node_modules, .git, etc.
        if (this.shouldIgnore(file.name)) continue;

        if (file.isDirectory()) {
          await this.uploadDirectory(sftp, localPath, remotePath);
        } else {
          await sftp.fastPut(localPath, remotePath);
          logger.info(`📤 Uploaded: ${file.name}`);
        }
      }
    } catch (error) {
      logger.error(`Upload directory failed:`, error.message);
      throw error;
    }
  }

  /**
   * Handle local file added
   */
  async handleLocalAdd(sftp, localBase, remoteBase, filePath, socket, sessionId) {
    try {
      const relativePath = path.relative(localBase, filePath);
      const remotePath = `${remoteBase}/${relativePath.replace(/\\/g, '/')}`;

      await sftp.fastPut(filePath, remotePath);
      
      logger.info(`📤 Added: ${relativePath}`);
      socket.emit('cloud-terminal:file-synced', {
        sessionId,
        action: 'add',
        file: relativePath
      });
    } catch (error) {
      logger.error(`Sync add failed: ${error.message}`);
    }
  }

  /**
   * Handle local file changed
   */
  async handleLocalChange(sftp, localBase, remoteBase, filePath, socket, sessionId) {
    try {
      const relativePath = path.relative(localBase, filePath);
      const remotePath = `${remoteBase}/${relativePath.replace(/\\/g, '/')}`;

      await sftp.fastPut(filePath, remotePath);
      
      logger.info(`🔄 Updated: ${relativePath}`);
      socket.emit('cloud-terminal:file-synced', {
        sessionId,
        action: 'update',
        file: relativePath
      });
    } catch (error) {
      logger.error(`Sync update failed: ${error.message}`);
    }
  }

  /**
   * Handle local file deleted
   */
  async handleLocalDelete(sftp, localBase, remoteBase, filePath, socket, sessionId) {
    try {
      const relativePath = path.relative(localBase, filePath);
      const remotePath = `${remoteBase}/${relativePath.replace(/\\/g, '/')}`;

      await sftp.delete(remotePath);
      
      logger.info(`🗑️ Deleted: ${relativePath}`);
      socket.emit('cloud-terminal:file-synced', {
        sessionId,
        action: 'delete',
        file: relativePath
      });
    } catch (error) {
      logger.error(`Sync delete failed: ${error.message}`);
    }
  }

  /**
   * Stop sync for a session
   */
  async stopSync(sessionId) {
    const session = this.syncSessions.get(sessionId);
    if (session) {
      logger.info(`🛑 Stopping sync for ${sessionId}`);
      
      // Stop file watcher
      await session.watcher.close();
      
      // Close SFTP
      await session.sftp.end();
      
      this.syncSessions.delete(sessionId);
      logger.success(`✅ Sync stopped for ${sessionId}`);
    }
  }

  /**
   * Check if file should be ignored
   */
  shouldIgnore(name) {
    const ignoreList = [
      'node_modules',
      '.git',
      '.vscode',
      '__pycache__',
      '.env',
      'dist',
      'build',
      '.DS_Store'
    ];
    return ignoreList.includes(name);
  }
}

module.exports = new FileSyncService();
