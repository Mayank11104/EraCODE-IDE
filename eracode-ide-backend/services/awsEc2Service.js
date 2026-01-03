const { EC2Client, RunInstancesCommand, TerminateInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

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

    // Path to SSH private key
    this.keyPath = path.join(__dirname, '..', 'eracode-terminal-key.pem');

    // Verify key file exists
    if (!fs.existsSync(this.keyPath)) {
      console.error('❌ SSH key file not found:', this.keyPath);
      throw new Error('SSH key file missing!');
    }

    console.log('✅ AWS EC2 Service initialized');
  }

  /**
   * Launch new EC2 instance for cloud terminal
   */
  async launchInstance(sessionId) {
    try {
      console.log(`🚀 Launching EC2 instance for session: ${sessionId}`);

      const params = {
        ImageId: process.env.AWS_AMI_ID || 'ami-0d377a1a81c42a1e0', // Ubuntu 22.04 Ireland
        InstanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
        MinCount: 1,
        MaxCount: 1,
        KeyName: process.env.AWS_KEY_PAIR_NAME || 'eracode-terminal-key',
        SecurityGroups: [process.env.AWS_SECURITY_GROUP_NAME || 'eracode-terminal-sg'],
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: `eracode-terminal-${sessionId}` },
              { Key: 'Purpose', Value: 'cloud-terminal' },
              { Key: 'SessionId', Value: sessionId },
            ],
          },
        ],
      };

      const command = new RunInstancesCommand(params);
      const response = await this.ec2Client.send(command);

      const instanceId = response.Instances[0].InstanceId;
      console.log(`✅ Instance launched: ${instanceId}`);

      // Store session info
      this.cloudSessions.set(sessionId, {
        instanceId,
        status: 'launching',
        createdAt: Date.now(),
        lastHeartbeat: Date.now(),
      });

      // Wait for instance to be running
      const publicIp = await this.waitForInstance(instanceId);

      // Update session
      this.cloudSessions.get(sessionId).publicIp = publicIp;
      this.cloudSessions.get(sessionId).status = 'running';

      console.log(`✅ Instance ready: ${instanceId} at ${publicIp}`);

      return {
        instanceId,
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
      const privateKey = fs.readFileSync(this.keyPath);

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
            // Retry after 5 seconds
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
   * Terminate EC2 instance
   */
  async terminateInstance(sessionId) {
    const session = this.cloudSessions.get(sessionId);

    if (!session) {
      console.log(`⚠️ No session found for ${sessionId}`);
      return;
    }

    try {
      console.log(`🗑️ Terminating instance: ${session.instanceId}`);

      const command = new TerminateInstancesCommand({
        InstanceIds: [session.instanceId],
      });

      await this.ec2Client.send(command);
      console.log(`✅ Instance ${session.instanceId} terminated`);

      this.cloudSessions.delete(sessionId);
    } catch (error) {
      console.error('❌ Failed to terminate instance:', error.message);
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
