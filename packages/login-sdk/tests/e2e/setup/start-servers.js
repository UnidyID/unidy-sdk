/**
 * Start Servers for E2E tests
 * 
 * This script starts both the API server and client server for E2E testing.
 */

const { startServer: startApiServer } = require('./api-server');
const { startServer: startClientServer } = require('./client-server');

// Start both servers
const apiServer = startApiServer();
const clientServer = startClientServer();

console.log('Both servers are running:');
console.log('- API Server: http://localhost:4000');
console.log('- Client Server: http://localhost:4001');
console.log('');
console.log('Press Ctrl+C to stop both servers.');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  apiServer.close(() => {
    console.log('API Server stopped.');
    
    clientServer.close(() => {
      console.log('Client Server stopped.');
      process.exit(0);
    });
  });
});