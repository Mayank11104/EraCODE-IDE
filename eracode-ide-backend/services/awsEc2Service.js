// ============================================
// AWS EC2 SERVICE - CLOUD TERMINAL MANAGEMENT
// ============================================

const { 
  EC2Client, 
  RunInstancesCommand, 
  TerminateInstancesCommand,
  StopInstancesCommand,
  StartInstancesCommand,
  DescribeInstancesCommand 
} = require('@aws-sdk/client-ec2');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AWSEc2Service {
  constructor() {
    this.ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Store active cloud sessions
    this.cloudSessions = new Map();

    // ✅ Use WSL key path (has correct 400 permissions)
    this.keyPath = '/home/spydy/eracode-terminal-key.pem';

    // ✅ Get username from env
    this.username = process.env.AWS_USER_NAME || 'user';

    console.log('✅ AWS EC2 Service initialized');
    console.log('🔑 Using SSH key:', this.keyPath);
    console.log('👤 Username:', this.username);
  }

  /**
   * Generate unique instance name
   * Format: {username}-{customName}-{shortId}
   * Example: EraCODE-IDE-myproject-a3f9
   */
  generateInstanceName(customName) {
    const shortId = crypto.randomBytes(2).toString('hex');
    const safeName = customName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `${this.username}-${safeName}-${shortId}`;
  }

  /**
   * Launch new EC2 instance for cloud terminal
   */
  async launchInstance(sessionId, customInstanceName) {
    try {
      // Generate full instance name
      const instanceName = this.generateInstanceName(customInstanceName);
      
      console.log(`🚀 Launching EC2 instance: ${instanceName}`);
      console.log(`   Session ID: ${sessionId}`);

      const params = {
        ImageId: process.env.AWS_AMI_ID || 'ami-0d377a1a81c42a1e0',
        InstanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
        MinCount: 1,
        MaxCount: 1,
        KeyName: process.env.AWS_KEY_PAIR_NAME || 'eracode-terminal-key',
        SecurityGroups: [process.env.AWS_SECURITY_GROUP_NAME || 'eracode-terminal-sg'],
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: instanceName },
              { Key: 'Purpose', Value: 'cloud-terminal' },
              { Key: 'SessionId', Value: sessionId },
              { Key: 'Username', Value: this.username },
              { Key: 'CustomName', Value: customInstanceName }
            ],
          },
        ],
      };

      const command = new RunInstancesCommand(params);
      const response = await this.ec2Client.send(command);
      const instanceId = response.Instances[0].InstanceId;

      console.log(`✅ Instance launched: ${instanceId}`);
      console.log(`   Name: ${instanceName}`);

      // Store session info
      this.cloudSessions.set(sessionId, {
        instanceId,
        instanceName,
        customName: customInstanceName,
        status: 'launching',
        createdAt: Date.now(),
        lastHeartbeat: Date.now(),
      });

      // Wait for instance to be running
      const publicIp = await this.waitForInstance(instanceId);

      // Update session
      this.cloudSessions.get(sessionId).publicIp = publicIp;
      this.cloudSessions.get(sessionId).status = 'running';

      console.log(`✅ Instance ready: ${instanceName} at ${publicIp}`);

      return {
        instanceId,
        instanceName,  // ✅ This is the FULL name: EraCODE-IDE-abc-ccc1
        publicIp,
        region: process.env.AWS_REGION,
      };
    } catch (error) {
      console.error('❌ Failed to launch instance:', error.message);
      this.cloudSessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Find instance by name (can be either full name or custom name)
   * Will search by Name tag first, then by CustomName tag
   */
  async findInstanceByName(searchName) {
    try {
      console.log(`🔍 Searching for instance: ${searchName}`);

      // ✅ TRY 1: Search by full Name tag (exact match)
      let command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [searchName]
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'stopped', 'stopping']
          }
        ]
      });

      let response = await this.ec2Client.send(command);
      
      // ✅ TRY 2: If not found, search by CustomName tag
      if (!response.Reservations || response.Reservations.length === 0) {
        console.log(`🔍 Not found by Name tag, trying CustomName tag...`);
        
        command = new DescribeInstancesCommand({
          Filters: [
            {
              Name: 'tag:CustomName',
              Values: [searchName]
            },
            {
              Name: 'tag:Username',
              Values: [this.username]
            },
            {
              Name: 'instance-state-name',
              Values: ['running', 'stopped', 'stopping']
            }
          ]
        });

        response = await this.ec2Client.send(command);
      }

      if (!response.Reservations || response.Reservations.length === 0) {
        console.log(`❌ No instance found with name: ${searchName}`);
        return null;
      }

      const instance = response.Reservations[0].Instances[0];
      const instanceName = instance.Tags?.find(t => t.Key === 'Name')?.Value;
      const customName = instance.Tags?.find(t => t.Key === 'CustomName')?.Value;
      
      console.log(`✅ Found instance: ${instance.InstanceId}`);
      console.log(`   Full Name: ${instanceName}`);
      console.log(`   Custom Name: ${customName}`);
      console.log(`   State: ${instance.State.Name}`);

      return {
        instanceId: instance.InstanceId,
        instanceName: instanceName,  // ✅ Full AWS name
        customName: customName,      // ✅ User's custom name
        state: instance.State.Name,
        publicIp: instance.PublicIpAddress || null,
      };
    } catch (error) {
      console.error('❌ Error finding instance:', error.message);
      throw error;
    }
  }

  /**
   * Start stopped instance
   */
  async startInstance(instanceId) {
    try {
      console.log(`▶️ Starting instance: ${instanceId}`);

      const command = new StartInstancesCommand({
        InstanceIds: [instanceId],
      });

      await this.ec2Client.send(command);
      console.log(`✅ Instance start command sent: ${instanceId}`);

      // Wait for instance to be running and get public IP
      const publicIp = await this.waitForInstance(instanceId);
      
      return { publicIp };
    } catch (error) {
      console.error('❌ Failed to start instance:', error.message);
      throw error;
    }
  }

  /**
   * Stop instance (not terminate)
   */
  async stopInstance(sessionId) {
    const session = this.cloudSessions.get(sessionId);
    if (!session) {
      console.log(`⚠️ No session found for ${sessionId}`);
      return;
    }

    try {
      console.log(`⏸️ Stopping instance: ${session.instanceId}`);
      console.log(`   Name: ${session.instanceName}`);

      const command = new StopInstancesCommand({
        InstanceIds: [session.instanceId],
      });

      await this.ec2Client.send(command);
      console.log(`✅ Instance ${session.instanceId} stopped`);
      console.log(`💡 Use instance name "${session.instanceName}" to reconnect later`);

      this.cloudSessions.delete(sessionId);
    } catch (error) {
      console.error('❌ Failed to stop instance:', error.message);
      throw error;
    }
  }

  /**
   * Wait for EC2 instance to be running and get public IP
   */
  async waitForInstance(instanceId, maxAttempts = 40) {
    console.log(`⏳ Waiting for instance ${instanceId} to be ready...`);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        });

        const response = await this.ec2Client.send(command);
        const instance = response.Reservations[0]?.Instances[0];

        if (!instance) {
          throw new Error('Instance not found');
        }

        const state = instance.State.Name;
        const publicIp = instance.PublicIpAddress;

        console.log(`📊 Instance ${instanceId} state: ${state}`);

        if (state === 'running' && publicIp) {
          console.log(`✅ Instance running with IP: ${publicIp}`);
          return publicIp;
        }

        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`⚠️ Error checking instance status:`, error.message);
      }
    }

    throw new Error('Instance failed to start within timeout');
  }

  /**
   * Create SSH connection to EC2 instance
   */
  async createSSHConnection(publicIp) {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to ${publicIp} via SSH...`);

      const conn = new Client();
      const { execSync } = require('child_process');
      const privateKey = execSync(`wsl cat ${this.keyPath}`).toString();

      let attempts = 0;
      const maxAttempts = 20;

      const tryConnect = () => {
        attempts++;
        console.log(`🔄 SSH connection attempt ${attempts}/${maxAttempts}...`);

        conn.on('ready', () => {
          console.log('✅ SSH connection established!');
          resolve(conn);
        });

        conn.on('error', (err) => {
          console.log(`⚠️ SSH connection failed: ${err.message}`);

          if (attempts < maxAttempts) {
            setTimeout(() => {
              conn.connect({
                host: publicIp,
                port: 22,
                username: 'ubuntu',
                privateKey: privateKey,
              });
            }, 5000);
          } else {
            reject(new Error('SSH connection timeout'));
          }
        });

        conn.connect({
          host: publicIp,
          port: 22,
          username: 'ubuntu',
          privateKey: privateKey,
        });
      };

      tryConnect();
    });
  }

  /**
   * Execute SSH command on remote instance
   */
  async executeSSHCommand(sshConnection, command) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Executing: ${command}`);

      sshConnection.exec(command, (err, stream) => {
        if (err) {
          return reject(err);
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
          }
        });
      });
    });
  }

  /**
   * Get SSH private key path
   */
  getKeyPath() {
    return this.keyPath;
  }

  /**
   * Rsync project to EC2 instance (WSL-compatible for Windows)
   */
  async rsyncToEC2(localPath, publicIp, projectName, progressCallback) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const os = require('os');

      let sourcePath = localPath;
      if (os.platform() === 'win32') {
        sourcePath = localPath
          .replace(/\\/g, '/')
          .replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
      }

      if (!sourcePath.endsWith('/')) {
        sourcePath += '/';
      }

      const remotePath = `ubuntu@${publicIp}:/home/ubuntu/${projectName}/`;
      const wslKeyPath = this.keyPath;

      console.log('🔄 Rsync parameters:', {
        source: sourcePath,
        destination: remotePath,
        wslKeyPath: wslKeyPath
      });

      const rsyncArgs = [
        '-avz',
        '--progress',
        '--delete',
        '--exclude=node_modules',
        '--exclude=.git',
        '--exclude=dist',
        '--exclude=build',
        '--exclude=.next',
        '--exclude=coverage',
        '--exclude=env',
        '--exclude=venv',
        '--exclude=.venv',
        '--exclude=__pycache__',
        '--exclude=*.pyc',
        '--exclude=.pytest_cache',
        '--exclude=.env',
        '--exclude=.env.local',
        '--exclude=.env.*.local',
        '--exclude=*.pem',
        '--exclude=*.key',
        '--exclude=.DS_Store',
        '--exclude=Thumbs.db',
        '--exclude=.vscode',
        '--exclude=.idea',
        '-e', `ssh -i "${wslKeyPath}" -o StrictHostKeyChecking=no`,
        sourcePath,
        remotePath
      ];

      const isWindows = os.platform() === 'win32';
      const rsyncCommand = isWindows ? 'wsl' : 'rsync';
      const finalArgs = isWindows ? ['rsync', ...rsyncArgs] : rsyncArgs;

      console.log('🚀 Running rsync via:', rsyncCommand);

      const rsync = spawn(rsyncCommand, finalArgs);

      let lastPercent = 0;
      let currentFile = '';
      let fileCount = 0;

      rsync.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[rsync stdout]', output.substring(0, 100));

        const lines = output.split('\n');
        lines.forEach(line => {
          if (line.trim() && !line.includes('%') && !line.includes('sending') && !line.includes('total size')) {
            fileCount++;
            currentFile = line.trim();

            const estimatedPercent = Math.min(95, fileCount * 2);
            if (estimatedPercent > lastPercent) {
              lastPercent = estimatedPercent;
              if (progressCallback) {
                progressCallback(lastPercent, currentFile);
              }
            }
          }
        });
      });

      rsync.stderr.on('data', (data) => {
        const error = data.toString();
        console.log('[rsync stderr]', error);
        if (!error.includes('Warning:') && !error.includes('Permanently added')) {
          console.warn('⚠️ Rsync warning:', error);
        }
      });

      rsync.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Rsync completed successfully');
          if (progressCallback) {
            progressCallback(100, 'Sync complete!');
          }
          resolve();
        } else {
          console.error(`❌ Rsync failed with exit code ${code}`);
          reject(new Error(`rsync failed with exit code ${code}`));
        }
      });

      rsync.on('error', (error) => {
        console.error('❌ Rsync spawn error:', error);
        reject(new Error(`Failed to start rsync: ${error.message}`));
      });
    });
  }

  /**
   * Terminate EC2 instance (delete completely)
   */
  async terminateInstance(sessionId) {
    const session = this.cloudSessions.get(sessionId);
    if (!session) {
      console.log(`⚠️ No session found for ${sessionId}`);
      return;
    }

    try {
      console.log(`🗑️ Terminating instance: ${session.instanceId}`);
      console.log(`   Name: ${session.instanceName}`);

      const command = new TerminateInstancesCommand({
        InstanceIds: [session.instanceId],
      });

      await this.ec2Client.send(command);
      console.log(`✅ Instance ${session.instanceId} terminated (deleted)`);

      this.cloudSessions.delete(sessionId);
    } catch (error) {
      console.error('❌ Failed to terminate instance:', error.message);
      throw error;
    }
  }

  /**
   * Update session heartbeat
   */
  updateHeartbeat(sessionId) {
    const session = this.cloudSessions.get(sessionId);
    if (session) {
      session.lastHeartbeat = Date.now();
    }
  }

  /**
   * Cleanup stale sessions (run periodically)
   */
  async cleanupStaleSessions() {
    const now = Date.now();
    const timeout = parseInt(process.env.CLOUD_TERMINAL_IDLE_TIMEOUT || '15') * 60 * 1000;

    for (const [sessionId, session] of this.cloudSessions) {
      const idleTime = now - session.lastHeartbeat;

      if (idleTime > timeout) {
        console.log(`⏰ Session ${sessionId} idle for ${Math.round(idleTime / 60000)} minutes, terminating...`);
        await this.terminateInstance(sessionId);
      }
    } 
  }
}

module.exports = new AWSEc2Service();
