import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, Play, Square, ExternalLink, Trash2, Folder, Terminal } from 'lucide-react';
import { Project, PortItem } from '../../types/models';
import { Badge } from '../common/Badge';

interface ProjectsViewProps {
  activePorts: PortItem[];
  onOpenUrl: (url: string) => void;
  onOpenFolder: (path: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  activePorts,
  onOpenUrl,
  onOpenFolder,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [command, setCommand] = useState('npm run dev');
  const [expectedPort, setExpectedPort] = useState<number | undefined>(3000);
  const [framework, setFramework] = useState('Vite');
  const [consoleLogs, setConsoleLogs] = useState<{ [id: string]: string[] }>({});

  useEffect(() => {
    loadProjects();

    let unsubscribe: (() => void) | undefined;
    if (window.api?.onProjectOutput) {
      unsubscribe = window.api.onProjectOutput(({ projectId, text }) => {
        setConsoleLogs(prev => ({
          ...prev,
          [projectId]: [...(prev[projectId] || []).slice(-20), text],
        }));
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadProjects = async () => {
    if (!window.api) return;
    const list = await window.api.getProjects();
    setProjects(list);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !folder.trim() || !command.trim()) return;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      folder: folder.trim(),
      command: command.trim(),
      expectedPort: expectedPort ? Number(expectedPort) : undefined,
      framework: framework.trim(),
      status: 'stopped',
    };

    if (window.api) {
      await window.api.saveProject(newProj);
      await loadProjects();
    }
    setShowAddModal(false);
    setName('');
    setFolder('');
  };

  const handleDelete = async (id: string) => {
    if (window.api) {
      await window.api.deleteProject(id);
      await loadProjects();
    }
  };

  const handleStart = async (id: string) => {
    if (window.api) {
      setProjects(prev =>
        prev.map(p => (p.id === id ? { ...p, status: 'starting' } : p))
      );
      await window.api.startProject(id);
      await loadProjects();
    }
  };

  const handleStop = async (id: string) => {
    if (window.api) {
      await window.api.stopProject(id);
      setProjects(prev =>
        prev.map(p => (p.id === id ? { ...p, status: 'stopped' } : p))
      );
      await loadProjects();
    }
  };

  // Determine if a project has an active port in reality
  const getProjectRuntimeStatus = (p: Project) => {
    const match = activePorts.find(
      portItem =>
        (p.expectedPort && portItem.port === p.expectedPort) ||
        (portItem.workingDirectory && portItem.workingDirectory.toLowerCase() === p.folder.toLowerCase())
    );
    if (match) {
      return { status: match.state, activePort: match.port, pid: match.pid };
    }
    return { status: p.status, activePort: p.expectedPort, pid: undefined };
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none animate-fade-in">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Proyectos Guardados</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Inicia tus entornos de desarrollo locales con 1 solo clic y detección automática de puertos.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Proyecto</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center">
          <FolderGit2 className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No hay proyectos registrados</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Guarda tus carpetas de proyectos (Node.js, Python, etc.) con sus comandos de arranque para levantarlos rápidamente.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
          >
            Registrar primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map(proj => {
            const runtime = getProjectRuntimeStatus(proj);
            const isRunning = runtime.status === 'active';
            const isStarting = runtime.status === 'starting';

            return (
              <div
                key={proj.id}
                className="bg-[#18181C]/80 border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 transition-all shadow-md backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm truncate">{proj.name}</span>
                    <Badge status={runtime.status} />
                  </div>

                  <div className="text-xs text-zinc-400 mb-2 truncate flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{proj.folder}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                      {proj.command}
                    </span>
                    {proj.expectedPort && (
                      <span className="font-mono text-zinc-400">Puerto: {proj.expectedPort}</span>
                    )}
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    {isRunning && runtime.activePort && (
                      <button
                        onClick={() => onOpenUrl(`http://localhost:${runtime.activePort}`)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>localhost:{runtime.activePort}</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenFolder(proj.folder)}
                      title="Abrir carpeta en Explorer"
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(proj.id)}
                      title="Eliminar proyecto guardado"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {isRunning ? (
                      <button
                        onClick={() => handleStop(proj.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium active:scale-95 transition-all"
                      >
                        <Square className="w-3 h-3" />
                        <span>Detener</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStart(proj.id)}
                        disabled={isStarting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium active:scale-95 transition-all"
                      >
                        <Play className="w-3 h-3" />
                        <span>{isStarting ? 'Iniciando...' : 'Iniciar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-2xl shadow-2xl p-6 text-zinc-100 space-y-4"
          >
            <h3 className="text-base font-semibold text-white">Registrar Nuevo Proyecto</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ej. Mi Web / Dashboard"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Ruta en Disco (Carpeta)</label>
                <input
                  type="text"
                  required
                  value={folder}
                  onChange={e => setFolder(e.target.value)}
                  placeholder="C:\Users\...\mi-proyecto"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Comando de Inicio</label>
                  <input
                    type="text"
                    required
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                    placeholder="npm run dev"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Puerto Previsto (Opcional)</label>
                  <input
                    type="number"
                    value={expectedPort || ''}
                    onChange={e => setExpectedPort(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="ej. 3000 o 5173"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Framework / Tipo</label>
                <input
                  type="text"
                  value={framework}
                  onChange={e => setFramework(e.target.value)}
                  placeholder="Vite, Next.js, FastAPI, Flask..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all active:scale-95"
              >
                Guardar Proyecto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
