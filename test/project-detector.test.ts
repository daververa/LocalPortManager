import { ProjectDetector } from '../electron/services/project-detector';

describe('ProjectDetector Heuristics', () => {
  const detector = new ProjectDetector();

  test('detects PostgreSQL by port 5432 and process name', () => {
    const res = detector.identify(5432, 'postgres.exe', 'postgres -D data');
    expect(res.projectName).toBe('PostgreSQL Database');
    expect(res.framework).toBe('PostgreSQL');
    expect(res.serverType).toBe('Database');
  });

  test('detects Vite from command line', () => {
    const res = detector.identify(5173, 'node.exe', 'node C:\\app\\node_modules\\vite\\bin\\vite.js');
    expect(res.framework).toBe('Vite');
  });

  test('detects Next.js from command line', () => {
    const res = detector.identify(3000, 'node.exe', 'node C:\\app\\node_modules\\next\\dist\\bin\\next dev');
    expect(res.framework).toBe('Next.js');
  });

  test('detects FastAPI/uvicorn from command line', () => {
    const res = detector.identify(8000, 'python.exe', 'python -m uvicorn app.main:app --port 8000');
    expect(res.framework).toBe('FastAPI');
    expect(res.serverType).toBe('API Backend');
  });

  test('detects Docker container bridge', () => {
    const res = detector.identify(8080, 'com.docker.backend.exe', 'docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 8080');
    expect(res.framework).toBe('Docker');
    expect(res.serverType).toBe('Container Service');
  });
});
