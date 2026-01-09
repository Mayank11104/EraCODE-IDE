const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class DockerService {
    constructor() {
        this.docker = new Docker({ socketPath: '//./pipe/docker_engine' }); // Default Windows pipe
        // For Linux/Mac: new Docker({ socketPath: '/var/run/docker.sock' })
        // We can make this configurable later
    }

    /**
     * List all containers (running and stopped)
     */
    async listContainers() {
        try {
            const containers = await this.docker.listContainers({ all: true });
            return containers.map(container => ({
                id: container.Id.substring(0, 12),
                name: container.Names[0].replace('/', ''),
                image: container.Image,
                status: container.State, // 'created', 'restarting', 'running', 'removing', 'paused', 'exited', 'dead'
                state: container.Status, // e.g., "Up 2 hours"
                ports: container.Ports
            }));
        } catch (error) {
            logger.error('Failed to list containers', error);
            throw error;
        }
    }

    /**
     * Run a container
     * @param {Object} config - { image, name, ports, volumes, env }
     */
    async runContainer(config) {
        try {
            const imageName = config.image || 'nginx:latest';

            // Check if image exists locally (simplified check)
            const images = await this.docker.listImages();
            const imageExists = images.some(img => img.RepoTags && img.RepoTags.includes(imageName));

            if (!imageExists) {
                logger.info(`Pulling image ${imageName}...`);
                await new Promise((resolve, reject) => {
                    this.docker.pull(imageName, (err, stream) => {
                        if (err) return reject(err);
                        this.docker.modem.followProgress(stream, onFinished, onProgress);

                        function onFinished(err, output) {
                            if (err) return reject(err);
                            resolve(output);
                        }
                        function onProgress(event) {
                            // logger.info(event);
                        }
                    });
                });
            }

            const portBindings = {};
            const exposedPorts = {};

            // Format ports: "3000:3000" -> { "3000/tcp": [{ "HostPort": "3000" }] }
            if (config.port) {
                const [hostPort, containerPort] = config.port.split(':');
                const key = `${containerPort}/tcp`;
                exposedPorts[key] = {};
                portBindings[key] = [{ HostPort: hostPort }];
            }

            const container = await this.docker.createContainer({
                Image: imageName,
                name: config.name,
                ExposedPorts: exposedPorts,
                HostConfig: {
                    PortBindings: portBindings,
                },
                Env: config.env || []
            });

            await container.start();
            return { id: container.id, status: 'started' };
        } catch (error) {
            logger.error('Failed to run container', error);
            throw error;
        }
    }

    /**
     * Stop a container
     */
    async stopContainer(id) {
        try {
            const container = this.docker.getContainer(id);
            await container.stop();
            return { id, status: 'stopped' };
        } catch (error) {
            logger.error(`Failed to stop container ${id}`, error);
            throw error;
        }
    }

    /**
     * Restart a container
     */
    async restartContainer(id) {
        try {
            const container = this.docker.getContainer(id);
            await container.restart();
            return { id, status: 'restarted' };
        } catch (error) {
            logger.error(`Failed to restart container ${id}`, error);
            throw error;
        }
    }

    /**
     * Build an image
     * @param {string} contextPath - Path to directory containing Dockerfile
     * @param {string} tag - Tag for the image (e.g. 'my-app:latest')
     */
    async buildImage(contextPath, tag) {
        try {
            // Ensure context path exists
            if (!fs.existsSync(contextPath)) {
                throw new Error(`Context path not found: ${contextPath}`);
            }

            logger.info(`Building image ${tag} from ${contextPath}`);

            // Using child_process exec as fallback since we don't have tar-fs set up for dockerode buildImage
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec(`docker build -t ${tag} .`, { cwd: contextPath }, (error, stdout, stderr) => {
                    if (error) {
                        logger.error('Build failed', stderr);
                        reject(error);
                        return;
                    }
                    logger.info('Build success', stdout);
                    resolve({ status: 'built', output: stdout });
                });
            });

        } catch (error) {
            logger.error(`Failed to build image ${tag}`, error);
            throw error;
        }
    }

    /**
     * Get logs for a container
     */
    async getLogs(id) {
        try {
            const container = this.docker.getContainer(id);
            // Get last 100 lines
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail: 100
            });
            return logs.toString('utf8'); // Simple string return for now
        } catch (error) {
            logger.error(`Failed to get logs for ${id}`, error);
            throw error;
        }
    }
}

module.exports = new DockerService();
