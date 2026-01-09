// backend/services/systemMonitor.service.js

const si = require('systeminformation');
const os = require('os');

class SystemMonitorService {
  constructor() {
    this.startTime = Date.now();
  }

  // Get CPU usage
  async getCPUUsage() {
    const load = await si.currentLoad();
    return {
      usage: Math.round(load.currentLoad),
      cores: load.cpus.map(cpu => Math.round(cpu.load))
    };
  }

  // Get Memory usage
  async getMemoryUsage() {
    const mem = await si.mem();
    return {
      total: mem.total,
      used: mem.used,
      free: mem.free,
      usagePercent: Math.round((mem.used / mem.total) * 100)
    };
  }

  // Get Active Processes (top 10 by CPU)
  async getTopProcesses() {
    const processes = await si.processes();
    return processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 10)
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: Math.round(p.cpu * 10) / 10,
        mem: Math.round(p.mem * 10) / 10,
        command: p.command
      }));
  }

  // Get Active Dev Servers (common ports)
  async getActiveServers() {
    const netConnections = await si.networkConnections();
    const devPorts = [3000, 3001, 4200, 5000, 5173, 8000, 8080, 8888, 9000];
    
    return devPorts
      .map(port => {
        const connection = netConnections.find(
          conn => conn.localPort === String(port) && conn.state === 'LISTEN'
        );
        return {
          port,
          active: !!connection,
          process: connection?.process || null
        };
      })
      .filter(server => server.active);
  }

  // Get System Uptime and Quick Stats
  getSystemUptime() {
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return {
      uptime: `${hours}h ${minutes}m`,
      uptimeSeconds: uptime,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      totalCPUs: os.cpus().length
    };
  }

  // Get all metrics at once
  async getAllMetrics() {
    const [cpu, memory, processes, servers] = await Promise.all([
      this.getCPUUsage(),
      this.getMemoryUsage(),
      this.getTopProcesses(),
      this.getActiveServers()
    ]);

    return {
      timestamp: Date.now(),
      cpu,
      memory,
      processes,
      servers,
      system: this.getSystemUptime()
    };
  }
}

module.exports = new SystemMonitorService();
