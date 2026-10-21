const endpoints = [
  '/authenticate_website',
  '/load-website-session',
  '/save-website-session',
  '/list-website-sessions',
  '/list-website-workshops',
  '/published-website-session',
  '/upload-website-asset',
  '/website-workshop-asset',
  '/list-phone-uploads',
  '/create-phone-upload-token',
  '/phone-upload-asset',
  // The local administration UI uses its existing authenticated backend.
  '/authenticate',
  '/manage-website-workshops',
  '/changeWebsitePassword',
  '/list-workshops',
  '/list-mission-workshops',
  '/setActiveKey',
  '/deleteOpenaiKey',
  '/deleteElevenlabsKey',
  '/changeStudentPassword',
  '/delete-workshop',
  '/add-workshop',
  '/changeMissionPassword',
  '/delete-mission-workshop',
  '/add-mission-workshop',
  '/changeManagementPassword',
  '/addOpenaiKey',
  '/addElevenlabsKey',
  '/changeGptModel',
  '/changeImageModel',
];

export default {
  plugins: [{
    name: 'drawing-phone-address',
    configureServer(server) {
      server.middlewares.use('/drawing-phone-origin', (req, res) => {
        const address = Object.values(os.networkInterfaces()).flat().find(item =>
          item && item.family === 'IPv4' && !item.internal &&
          /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ origin: address ? `http://${address.address}:5174` : null }));
      });
    },
  }],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    proxy: Object.fromEntries(endpoints.map(path => [path, {
      target: 'https://ai.stageoneeducation.com',
      changeOrigin: true,
      secure: true,
    }])),
  },
};
import os from 'node:os';

