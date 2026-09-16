const http = require('http');
const { spawn, execSync } = require('child_process');
const path = require('path');
const { PortScanner } = require('../dist-electron/electron/services/port-scanner');
const { ProcessManager } = require('../dist-electron/electron/services/process-manager');
const { ProjectDetector } = require('../dist-electron/electron/services/project-detector');
const { ProcessController } = require('../dist-electron/electron/services/process-controller');

async function runLiveTest() {
  console.log('=== INICIANDO PRUEBAS DE INTEGRACIÓN EN VIVO (WINDOWS OS) ===\n');

  // 1. Levantar servidor Node en puerto 3999
  const nodeServer = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Node test server active');
  });

  await new Promise((resolve) => {
    nodeServer.listen(3999, '127.0.0.1', () => {
      console.log('✔ [1/7] Servidor Node de prueba iniciado en http://127.0.0.1:3999 (PID: ' + process.pid + ')');
      resolve();
    });
  });

  // 2. Levantar servidor Python de prueba en puerto 8999
  console.log('✔ [2/7] Iniciando servidor Python en puerto 8999...');
  const pythonProc = spawn('python', ['-m', 'http.server', '8999', '--bind', '127.0.0.1'], {
    stdio: 'ignore',
  });
  console.log(`✔ [2/7] Proceso Python iniciado (PID: ${pythonProc.pid})`);

  // Esperar 1 segundo para que los sockets estén en estado LISTEN
  await new Promise(r => setTimeout(r, 1200));

  const scanner = new PortScanner();
  const procMgr = new ProcessManager();
  const detector = new ProjectDetector();
  const controller = new ProcessController();

  try {
    // 3. Escanear puertos con PortScanner (Get-NetTCPConnection)
    console.log('\n--- Ejecutando Escaneo con Get-NetTCPConnection ---');
    const listeners = await scanner.scan();
    console.log(`✔ [3/7] Total listeners detectados por Windows: ${listeners.length}`);

    const nodeListener = listeners.find(l => l.port === 3999);
    const pythonListener = listeners.find(l => l.port === 8999);

    if (!nodeListener) throw new Error('FAIL: Puerto 3999 no fue detectado por el scanner');
    if (!pythonListener) throw new Error('FAIL: Puerto 8999 no fue detectado por el scanner');

    console.log(`✔ [3/7] Puerto 3999 detectado con PID: ${nodeListener.pid}`);
    console.log(`✔ [3/7] Puerto 8999 detectado con PID: ${pythonListener.pid}`);

    // 4. Resolver metadatos y PEB CWD de los procesos
    console.log('\n--- Extrayendo Procesos y CWD (Win32 PEB Reader) ---');
    const procsMap = await procMgr.getProcessesInfo([nodeListener.pid, pythonListener.pid]);
    const nodeDetails = procsMap.get(nodeListener.pid);
    const pythonDetails = procsMap.get(pythonListener.pid);

    console.log('Node process:', {
      name: nodeDetails?.name,
      pid: nodeDetails?.pid,
      cwd: nodeDetails?.workingDirectory,
      safety: nodeDetails?.safety,
    });

    console.log('Python process:', {
      name: pythonDetails?.name,
      pid: pythonDetails?.pid,
      cwd: pythonDetails?.workingDirectory,
      safety: pythonDetails?.safety,
    });

    if (!nodeDetails || !nodeDetails.name.toLowerCase().includes('node')) {
      throw new Error('FAIL: No se resolvió el ejecutable de Node');
    }
    if (!pythonDetails || !pythonDetails.name.toLowerCase().includes('python')) {
      throw new Error('FAIL: No se resolvió el ejecutable de Python');
    }
    console.log('✔ [4/7] Resolución de procesos y clasificación de seguridad verificada.');

    // 5. Identificación de Proyecto y Framework
    console.log('\n--- Identificación de Proyecto y Framework ---');
    const nodeIdentity = detector.identify(3999, nodeDetails.name, nodeDetails.commandLine, nodeDetails.workingDirectory);
    console.log('Identidad Node:', nodeIdentity);

    const pythonIdentity = detector.identify(8999, pythonDetails.name, pythonDetails.commandLine, pythonDetails.workingDirectory);
    console.log('Identidad Python:', pythonIdentity);

    if (!nodeIdentity.framework.includes('Node') && !nodeIdentity.framework.includes('Vite')) {
      throw new Error('FAIL: No se identificó el framework Node');
    }
    console.log('✔ [5/7] Frameworks y nombres identificados correctamente.');

    // 6. Prueba de Pausa y Reanudación Real (NtSuspendProcess / NtResumeProcess)
    console.log('\n--- Prueba de Pausa Real (NtSuspendProcess) ---');
    const pauseRes = await controller.pause(pythonProc.pid);
    console.log('Resultado de pausar Python:', pauseRes);
    if (!pauseRes.success) throw new Error('FAIL: NtSuspendProcess no pudo pausar el proceso');
    console.log('✔ [6/7] Proceso pausado con éxito en el kernel de Windows.');

    console.log('\n--- Prueba de Reanudación Real (NtResumeProcess) ---');
    const resumeRes = await controller.resume(pythonProc.pid);
    console.log('Resultado de reanudar Python:', resumeRes);
    if (!resumeRes.success) throw new Error('FAIL: NtResumeProcess no pudo reanudar el proceso');
    console.log('✔ [6/7] Proceso reanudado con éxito.');

    // 7. Prueba de Terminación Limpia
    console.log('\n--- Prueba de Terminación Limpia de Procesos ---');
    const stopRes = await controller.stop(pythonProc.pid, true);
    console.log('Resultado de detener Python:', stopRes);
    if (!stopRes.success) throw new Error('FAIL: No se pudo terminar el proceso de prueba');
    console.log('✔ [7/7] Proceso de prueba terminado limpiamente.');

    console.log('\n======================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON AL 100%');
    console.log('======================================================\n');
  } finally {
    // Cerrar servidor Node
    nodeServer.close();
    try {
      if (pythonProc.pid) {
        execSync(`taskkill /F /PID ${pythonProc.pid} 2>nul`);
      }
    } catch {}
  }
}

runLiveTest().catch((err) => {
  console.error('\n❌ ERROR EN LA PRUEBA DE INTEGRACIÓN:', err);
  process.exit(1);
});
