import { exec, spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { shell, clipboard } from 'electron';

const execAsync = util.promisify(exec);

export class ProcessController {
  private suspendScriptPath: string;
  private spawnedProcesses: Map<string, ChildProcess> = new Map();

  constructor() {
    this.suspendScriptPath = path.join(__dirname, 'native-scripts', 'suspend-resume.ps1');
  }

  async openUrl(url: string): Promise<void> {
    await shell.openExternal(url);
  }

  copyUrl(url: string): void {
    clipboard.writeText(url);
  }

  async openFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!folderPath || !fs.existsSync(folderPath)) {
        return { success: false, error: 'La ruta especificada no existe en disco.' };
      }
      const err = await shell.openPath(folderPath);
      if (err) {
        return { success: false, error: err };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async openTerminal(folderPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const targetDir = folderPath && fs.existsSync(folderPath) ? folderPath : process.env.USERPROFILE || 'C:\\';
      
      // Try Windows Terminal (wt.exe) first
      try {
        const child = spawn('wt.exe', ['-d', targetDir], { detached: true, stdio: 'ignore' });
        child.unref();
        return { success: true };
      } catch {
        // Fallback to PowerShell
        const child = spawn('powershell.exe', ['-NoExit', '-Command', `Set-Location '${targetDir}'`], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async pause(pid: number): Promise<{ success: boolean; error?: string }> {
    if (pid <= 4) {
      return { success: false, error: 'No se permite suspender procesos críticos del sistema.' };
    }

    try {
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.suspendScriptPath}" -Action Suspend -ProcessId ${pid}`;
      const { stdout } = await execAsync(cmd, { timeout: 4000 });
      if (stdout && stdout.trim()) {
        const res = JSON.parse(stdout.trim());
        if (res.success) {
          return { success: true };
        }
      }
      return { success: false, error: 'No se pudo suspender el proceso. Verifique permisos.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async resume(pid: number): Promise<{ success: boolean; error?: string }> {
    if (pid <= 4) {
      return { success: false, error: 'Operación no válida en proceso del sistema.' };
    }

    try {
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.suspendScriptPath}" -Action Resume -ProcessId ${pid}`;
      const { stdout } = await execAsync(cmd, { timeout: 4000 });
      if (stdout && stdout.trim()) {
        const res = JSON.parse(stdout.trim());
        if (res.success) {
          return { success: true };
        }
      }
      return { success: false, error: 'No se pudo reanudar el proceso.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async stop(pid: number, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    if (pid <= 4) {
      return { success: false, error: 'Seguridad: Prohibido finalizar procesos del núcleo de Windows.' };
    }

    try {
      // /T terminates process and all its children. /F is force.
      const killCmd = force ? `taskkill /F /T /PID ${pid}` : `taskkill /T /PID ${pid}`;
      await execAsync(killCmd);
      return { success: true };
    } catch (e: any) {
      // If graceful failed, user can invoke force
      if (!force) {
        return {
          success: false,
          error: `El proceso no se detuvo de forma limpia (${e.message}). Puedes forzar la detención.`,
        };
      }
      return { success: false, error: e.message };
    }
  }

  async restart(pid: number, commandLine?: string, cwd?: string): Promise<{ success: boolean; error?: string }> {
    if (!commandLine) {
      return { success: false, error: 'No se pudo recuperar la línea de comando original para reiniciar.' };
    }

    // Stop existing process first
    const stopResult = await this.stop(pid, true);
    if (!stopResult.success) {
      return stopResult;
    }

    // Wait 1.5 seconds for socket/port release
    await new Promise(r => setTimeout(r, 1500));

    // Spawn new process
    try {
      const options: any = {
        detached: true,
        shell: true,
        stdio: 'ignore',
      };
      if (cwd && fs.existsSync(cwd)) {
        options.cwd = cwd;
      }

      const child = spawn(commandLine, [], options);
      child.unref();

      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Error al reiniciar proceso: ${e.message}` };
    }
  }

  startProject(
    projectId: string,
    folder: string,
    command: string,
    onOutput?: (line: string) => void
  ): { success: boolean; error?: string } {
    try {
      if (!fs.existsSync(folder)) {
        return { success: false, error: `La carpeta '${folder}' no existe.` };
      }

      // Stop any existing process for this project id
      if (this.spawnedProcesses.has(projectId)) {
        const proc = this.spawnedProcesses.get(projectId);
        try {
          proc?.kill();
        } catch {}
        this.spawnedProcesses.delete(projectId);
      }

      const child = spawn(command, {
        cwd: folder,
        shell: true,
      });

      this.spawnedProcesses.set(projectId, child);

      child.stdout?.on('data', data => {
        if (onOutput) onOutput(data.toString());
      });

      child.stderr?.on('data', data => {
        if (onOutput) onOutput(data.toString());
      });

      child.on('close', () => {
        this.spawnedProcesses.delete(projectId);
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  stopProject(projectId: string): { success: boolean; error?: string } {
    const proc = this.spawnedProcesses.get(projectId);
    if (proc) {
      try {
        if (proc.pid) {
          exec(`taskkill /F /T /PID ${proc.pid}`);
        }
        proc.kill();
        this.spawnedProcesses.delete(projectId);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'No hay proceso activo registrado para este proyecto.' };
  }
}
