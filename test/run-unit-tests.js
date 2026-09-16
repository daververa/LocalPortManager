const assert = require('assert');
const { ProjectDetector } = require('../dist-electron/electron/services/project-detector');

console.log('=== EJECUTANDO PRUEBAS UNITARIAS DE HEURÍSTICAS ===\n');

const detector = new ProjectDetector();

// 1. PostgreSQL
{
  const res = detector.identify(5432, 'postgres.exe', 'postgres -D data');
  assert.strictEqual(res.projectName, 'PostgreSQL Database');
  assert.strictEqual(res.framework, 'PostgreSQL');
  assert.strictEqual(res.serverType, 'Database');
  console.log('✔ Heurística PostgreSQL validada.');
}

// 2. Vite
{
  const res = detector.identify(5173, 'node.exe', 'node C:\\app\\node_modules\\vite\\bin\\vite.js');
  assert.strictEqual(res.framework, 'Vite');
  console.log('✔ Heurística Vite validada.');
}

// 3. Next.js
{
  const res = detector.identify(3000, 'node.exe', 'node C:\\app\\node_modules\\next\\dist\\bin\\next dev');
  assert.strictEqual(res.framework, 'Next.js');
  console.log('✔ Heurística Next.js validada.');
}

// 4. FastAPI / uvicorn
{
  const res = detector.identify(8000, 'python.exe', 'python -m uvicorn app.main:app --port 8000');
  assert.strictEqual(res.framework, 'FastAPI');
  assert.strictEqual(res.serverType, 'API Backend');
  console.log('✔ Heurística FastAPI/uvicorn validada.');
}

// 5. Docker
{
  const res = detector.identify(8080, 'com.docker.backend.exe', 'docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 8080');
  assert.strictEqual(res.framework, 'Docker');
  assert.strictEqual(res.serverType, 'Container Service');
  console.log('✔ Heurística Docker validada.');
}

// 6. Redis
{
  const res = detector.identify(6379, 'redis-server.exe', '');
  assert.strictEqual(res.framework, 'Redis');
  console.log('✔ Heurística Redis validada.');
}

console.log('\n✔ Todas las pruebas unitarias pasaron exitosamente.');
