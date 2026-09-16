import fs from 'fs';
import path from 'path';

export interface ProjectIdentity {
  projectName: string;
  framework: string;
  serverType: string;
}

export class ProjectDetector {
  /**
   * Identifies project name, framework, and server type from process metadata and directory files.
   */
  identify(
    port: number,
    processName: string,
    commandLine?: string,
    workingDirectory?: string
  ): ProjectIdentity {
    const pName = (processName || '').toLowerCase();
    const cmd = (commandLine || '').toLowerCase();

    // 1. Check known system/database services by port and process
    if (port === 5432 || pName.includes('postgres')) {
      return {
        projectName: 'PostgreSQL Database',
        framework: 'PostgreSQL',
        serverType: 'Database',
      };
    }
    if (port === 3306 || pName.includes('mysqld')) {
      return {
        projectName: 'MySQL Database',
        framework: 'MySQL',
        serverType: 'Database',
      };
    }
    if (port === 6379 || pName.includes('redis')) {
      return {
        projectName: 'Redis Cache',
        framework: 'Redis',
        serverType: 'In-Memory Cache',
      };
    }
    if (port === 27017 || pName.includes('mongod')) {
      return {
        projectName: 'MongoDB Database',
        framework: 'MongoDB',
        serverType: 'Document Database',
      };
    }
    if (pName.includes('docker') || cmd.includes('docker-proxy')) {
      return {
        projectName: 'Docker Container',
        framework: 'Docker',
        serverType: 'Container Service',
      };
    }
    if (pName.includes('nginx')) {
      return {
        projectName: 'Nginx Web Server',
        framework: 'Nginx',
        serverType: 'Reverse Proxy',
      };
    }

    // 2. If working directory exists, inspect project manifests
    let detectedName: string | undefined;
    let detectedFramework: string | undefined;
    let detectedServerType: string = 'Development Server';

    if (workingDirectory && fs.existsSync(workingDirectory)) {
      // 2a. Node.js project inspection (package.json)
      const pkgInfo = this.inspectPackageJson(workingDirectory);
      if (pkgInfo) {
        if (pkgInfo.name) detectedName = pkgInfo.name;
        if (pkgInfo.framework) detectedFramework = pkgInfo.framework;
        if (pkgInfo.serverType) detectedServerType = pkgInfo.serverType;
      }

      // 2b. Python project inspection (pyproject.toml, requirements.txt, manage.py)
      if (!detectedFramework) {
        const pyInfo = this.inspectPythonProject(workingDirectory, cmd);
        if (pyInfo) {
          if (pyInfo.name && !detectedName) detectedName = pyInfo.name;
          if (pyInfo.framework) detectedFramework = pyInfo.framework;
          if (pyInfo.serverType) detectedServerType = pyInfo.serverType;
        }
      }

      // If project name wasn't in manifest, use folder basename
      if (!detectedName) {
        const base = path.basename(workingDirectory);
        if (base && base !== '.' && base !== '/') {
          detectedName = base;
        }
      }
    }

    // 3. Fallback: inspect commandLine if framework not found yet
    if (!detectedFramework) {
      if (cmd.includes('vite')) {
        detectedFramework = 'Vite';
      } else if (cmd.includes('next')) {
        detectedFramework = 'Next.js';
      } else if (cmd.includes('astro')) {
        detectedFramework = 'Astro';
      } else if (cmd.includes('nuxt')) {
        detectedFramework = 'Nuxt';
      } else if (cmd.includes('svelte')) {
        detectedFramework = 'Svelte';
      } else if (cmd.includes('uvicorn') || cmd.includes('fastapi')) {
        detectedFramework = 'FastAPI';
        detectedServerType = 'API Backend';
      } else if (cmd.includes('flask')) {
        detectedFramework = 'Flask';
        detectedServerType = 'Web App';
      } else if (cmd.includes('manage.py runserver') || cmd.includes('django')) {
        detectedFramework = 'Django';
        detectedServerType = 'Web Application';
      } else if (cmd.includes('artisan serve')) {
        detectedFramework = 'Laravel';
        detectedServerType = 'PHP Application';
      } else if (pName.includes('node')) {
        detectedFramework = 'Node.js';
      } else if (pName.includes('python')) {
        detectedFramework = 'Python';
        detectedServerType = 'Python Service';
      } else if (pName.includes('go')) {
        detectedFramework = 'Go';
        detectedServerType = 'Go Server';
      } else if (pName.includes('cargo') || pName.includes('rust')) {
        detectedFramework = 'Rust';
        detectedServerType = 'Rust Service';
      }
    }

    // 4. Default project name if still empty
    if (!detectedName) {
      if (detectedFramework) {
        detectedName = `${detectedFramework} Service`;
      } else {
        detectedName = `Servicio Local (${port})`;
      }
    }

    return {
      projectName: detectedName,
      framework: detectedFramework || 'Servicio Desconocido',
      serverType: detectedServerType,
    };
  }

  private inspectPackageJson(dir: string): { name?: string; framework?: string; serverType?: string } | null {
    let currentDir = dir;
    // Walk up at most 3 levels to find package.json
    for (let i = 0; i < 3; i++) {
      const pkgPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const raw = fs.readFileSync(pkgPath, 'utf-8');
          const pkg = JSON.parse(raw);
          const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

          let framework: string | undefined;
          let serverType = 'Development Server';

          if (deps['next']) {
            framework = 'Next.js';
          } else if (deps['vite']) {
            framework = 'Vite';
          } else if (deps['astro']) {
            framework = 'Astro';
          } else if (deps['@remix-run/react']) {
            framework = 'Remix';
          } else if (deps['nuxt'] || deps['@nuxt/kit']) {
            framework = 'Nuxt';
          } else if (deps['@sveltejs/kit'] || deps['svelte']) {
            framework = 'Svelte';
          } else if (deps['@angular/core']) {
            framework = 'Angular';
          } else if (deps['react']) {
            framework = 'React';
          } else if (deps['vue']) {
            framework = 'Vue';
          } else if (deps['@nestjs/core']) {
            framework = 'NestJS';
            serverType = 'API Backend';
          } else if (deps['express']) {
            framework = 'Express';
            serverType = 'Node.js API';
          } else if (deps['fastify']) {
            framework = 'Fastify';
            serverType = 'High-perf API';
          }

          return {
            name: pkg.name || path.basename(currentDir),
            framework,
            serverType,
          };
        } catch {}
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
    return null;
  }

  private inspectPythonProject(dir: string, cmd: string): { name?: string; framework?: string; serverType?: string } | null {
    // Check pyproject.toml
    const pyprojectPath = path.join(dir, 'pyproject.toml');
    let name: string | undefined;
    let framework: string | undefined;

    if (fs.existsSync(pyprojectPath)) {
      try {
        const content = fs.readFileSync(pyprojectPath, 'utf-8');
        const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
        if (nameMatch) name = nameMatch[1];
        if (content.includes('fastapi')) framework = 'FastAPI';
        else if (content.includes('flask')) framework = 'Flask';
        else if (content.includes('django')) framework = 'Django';
      } catch {}
    }

    // Check manage.py for Django
    if (fs.existsSync(path.join(dir, 'manage.py'))) {
      framework = 'Django';
    }

    if (framework || cmd.includes('uvicorn') || cmd.includes('fastapi') || cmd.includes('flask')) {
      return {
        name,
        framework: framework || (cmd.includes('fastapi') ? 'FastAPI' : 'Flask'),
        serverType: 'Python Web Server',
      };
    }

    return null;
  }
}
