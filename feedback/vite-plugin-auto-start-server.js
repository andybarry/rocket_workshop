import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function autoStartServer() {
  let serverProcess = null;
  let isServerRunning = false;

  const startServer = async () => {
    if (isServerRunning) return;

    // First check if server is already running
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        console.log('✅ Backend server is already running and healthy');
        isServerRunning = true;
        return;
      }
    } catch (err) {
      // Server is not running, proceed to start it
    }

    console.log('🚀 Auto-starting backend server...');
    serverProcess = spawn('node', ['server.js'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Feedback server running')) {
        isServerRunning = true;
        console.log('✅ Backend server started successfully');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Backend server error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      isServerRunning = false;
      console.log(`Backend server exited with code ${code}`);
    });

    // Check if server is running after a delay
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          isServerRunning = true;
          console.log('✅ Backend server is running and healthy');
        }
      } catch (err) {
        console.log('⚠️ Backend server may still be starting...');
      }
    }, 2000);
  };

  const stopServer = () => {
    if (serverProcess) {
      serverProcess.kill();
      isServerRunning = false;
      console.log('🛑 Backend server stopped');
    }
  };

  return {
    name: 'auto-start-server',
    configureServer(server) {
      // Start the backend server when Vite dev server starts
      startServer();

      // Clean up when Vite dev server stops
      process.on('SIGINT', stopServer);
      process.on('SIGTERM', stopServer);
    },
    buildStart() {
      // Also start server during build
      startServer();
    }
  };
}
