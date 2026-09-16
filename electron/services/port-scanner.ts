import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface RawListener {
  port: number;
  localAddress: string;
  pid: number;
  protocol: 'tcp' | 'udp';
}

export class PortScanner {
  /**
   * Scans local TCP listeners.
   */
  async scan(): Promise<RawListener[]> {
    try {
      return await this.scanWithPowerShell();
    } catch (err) {
      console.warn('[PortScanner] PowerShell scan failed, falling back to netstat:', err);
      return await this.scanWithNetstat();
    }
  }

  /**
   * Primary scanner: uses Get-NetTCPConnection
   */
  private async scanWithPowerShell(): Promise<RawListener[]> {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | ConvertTo-Json -Compress"`;
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 5000 });

    if (!stdout || !stdout.trim()) {
      return [];
    }

    const parsed = JSON.parse(stdout.trim());
    const items = Array.isArray(parsed) ? parsed : [parsed];

    const results: RawListener[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const port = Number(item.LocalPort);
      const pid = Number(item.OwningProcess);
      const addr = String(item.LocalAddress || '0.0.0.0');

      if (!port || isNaN(port) || pid === undefined) continue;

      // Group listeners by port and pid so we don't have duplicates for both IPv4 and IPv6
      const key = `${port}:${pid}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          port,
          localAddress: addr,
          pid,
          protocol: 'tcp',
        });
      }
    }

    return results.sort((a, b) => a.port - b.port);
  }

  /**
   * Fallback scanner: uses netstat -ano -p tcp
   */
  private async scanWithNetstat(): Promise<RawListener[]> {
    const { stdout } = await execAsync('netstat -ano -p tcp', { maxBuffer: 5 * 1024 * 1024, timeout: 5000 });
    const lines = stdout.split('\n');
    const results: RawListener[] = [];
    const seen = new Set<string>();

    // Regex for: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12480
    const netstatRegex = /^\s*TCP\s+([0-9a-fA-F.:\[\]]+):(\d+)\s+[0-9a-fA-F.:\[\]]+:\d+\s+LISTENING\s+(\d+)/i;

    for (const line of lines) {
      const match = line.match(netstatRegex);
      if (match) {
        const addr = match[1];
        const port = parseInt(match[2], 10);
        const pid = parseInt(match[3], 10);

        if (!isNaN(port) && !isNaN(pid)) {
          const key = `${port}:${pid}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              port,
              localAddress: addr,
              pid,
              protocol: 'tcp',
            });
          }
        }
      }
    }

    return results.sort((a, b) => a.port - b.port);
  }
}
