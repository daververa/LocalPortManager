import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { ProcessSafety } from '../../src/types/models';

const execAsync = util.promisify(exec);

export interface ProcessDetails {
  pid: number;
  name: string;
  executablePath?: string;
  commandLine?: string;
  parentProcessId?: number;
  creationDate?: string;
  uptimeFormatted?: string;
  workingDirectory?: string;
  safety: ProcessSafety;
  user?: string;
}

const SYSTEM_PROCESSES = new Set([
  'system',
  'system idle process',
  'registry',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'services.exe',
  'lsass.exe',
  'svchost.exe',
  'winlogon.exe',
  'explorer.exe',
  'dwm.exe',
  'conhost.exe',
  'spoolsv.exe',
  'fontdrvhost.exe',
]);

const CAUTION_PROCESSES = new Set([
  'postgres.exe',
  'mysqld.exe',
  'redis-server.exe',
  'mongod.exe',
  'nginx.exe',
  'httpd.exe',
  'caddy.exe',
  'com.docker.backend.exe',
  'wsl.exe',
  'vpnagent.exe',
]);

export class ProcessManager {
  private scriptPath: string;

  constructor() {
    const defaultPath = path.join(__dirname, 'native-scripts', 'get-cwd.ps1');
    const unpackedPath = defaultPath.replace('app.asar', 'app.asar.unpacked');
    this.scriptPath = fs.existsSync(unpackedPath) ? unpackedPath : defaultPath;
  }

  /**
   * Fetches metadata for all specified PIDs in a single batch.
   */
  async getProcessesInfo(pids: number[]): Promise<Map<number, ProcessDetails>> {
    const result = new Map<number, ProcessDetails>();
    if (pids.length === 0) return result;

    const uniquePids = Array.from(new Set(pids)).filter(p => p > 0);

    try {
      // Query Win32_Process for all running processes
      // We filter in PowerShell using an expression or fetch all and map
      const psFilter = uniquePids.map(p => `ProcessId = ${p}`).join(' or ');
      const queryCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \\"${psFilter}\\" | Select-Object ProcessId, Name, ExecutablePath, CommandLine, ParentProcessId, CreationDate | ConvertTo-Json -Compress"`;
      
      const { stdout } = await execAsync(queryCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 6000 });
      
      if (stdout && stdout.trim()) {
        const parsed = JSON.parse(stdout.trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of list) {
          const pid = Number(item.ProcessId);
          const name = String(item.Name || '');
          const exe = item.ExecutablePath ? String(item.ExecutablePath) : undefined;
          const cmd = item.CommandLine ? String(item.CommandLine) : undefined;
          const parent = item.ParentProcessId ? Number(item.ParentProcessId) : undefined;
          
          let creationDate: string | undefined;
          let uptimeFormatted: string | undefined;

          if (item.CreationDate) {
            try {
              // PowerShell CimInstance returns /Date(ms)/ or ISO string
              let timeMs = 0;
              if (typeof item.CreationDate === 'string' && item.CreationDate.includes('/Date(')) {
                const match = item.CreationDate.match(/\/Date\((\d+)\)\//);
                if (match) timeMs = parseInt(match[1], 10);
              } else {
                timeMs = new Date(item.CreationDate).getTime();
              }

              if (timeMs > 0) {
                const d = new Date(timeMs);
                creationDate = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                uptimeFormatted = this.formatUptime(Date.now() - timeMs);
              }
            } catch {}
          }

          const safety = this.classifySafety(pid, name);

          result.set(pid, {
            pid,
            name,
            executablePath: exe,
            commandLine: cmd,
            parentProcessId: parent,
            creationDate,
            uptimeFormatted,
            safety,
          });
        }
      }
    } catch (err) {
      console.warn('[ProcessManager] Batch query failed, proceeding with fallbacks:', err);
    }

    // Now resolve working directories for safe/caution processes
    await this.resolveWorkingDirectories(result);

    return result;
  }

  private classifySafety(pid: number, name: string): ProcessSafety {
    if (pid <= 4) return 'system';
    const lowerName = name.toLowerCase();
    if (SYSTEM_PROCESSES.has(lowerName)) return 'system';
    if (CAUTION_PROCESSES.has(lowerName)) return 'caution';
    return 'safe';
  }

  private formatUptime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Attempts to get exact CWD from PEB memory; falls back to parsing CommandLine
   */
  private async resolveWorkingDirectories(map: Map<number, ProcessDetails>): Promise<void> {
    const targetPids = Array.from(map.values())
      .filter(p => p.safety !== 'system')
      .map(p => p.pid);

    if (targetPids.length === 0) return;

    if (fs.existsSync(this.scriptPath)) {
      try {
        const pidsArg = targetPids.join(',');
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}" -ProcessIds ${pidsArg}`;
        const { stdout } = await execAsync(cmd, { timeout: 4000 });

        if (stdout && stdout.trim()) {
          const cwds = JSON.parse(stdout.trim());
          const list = Array.isArray(cwds) ? cwds : [cwds];
          for (const item of list) {
            if (item.pid && item.cwd && map.has(item.pid)) {
              map.get(item.pid)!.workingDirectory = item.cwd;
            }
          }
        }
      } catch (err) {
        console.warn('[ProcessManager] PEB CWD reader warning:', err);
      }
    }

    // Heuristic fallback for any process where PEB couldn't be read
    for (const [pid, details] of map.entries()) {
      if (!details.workingDirectory && details.commandLine) {
        const guessedCwd = this.extractCwdFromCommandLine(details.commandLine);
        if (guessedCwd) {
          details.workingDirectory = guessedCwd;
        }
      }
    }
  }

  private extractCwdFromCommandLine(commandLine: string): string | undefined {
    // Look for Windows path patterns in the command line (e.g. C:\Users\... or "C:\...")
    const pathMatches = commandLine.match(/[a-zA-Z]:\\[^"'\r\n]+/g);
    if (pathMatches) {
      for (const p of pathMatches) {
        // Strip trailing quotes or arguments
        let clean = p.trim().replace(/^["']|["']$/g, '');
        // If it's a file, take dirname
        if (fs.existsSync(clean)) {
          const stat = fs.statSync(clean);
          if (stat.isDirectory()) return clean;
          return path.dirname(clean);
        }
      }
    }
    return undefined;
  }
}
