const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy to API server
app.use('/api', createProxyMiddleware({ target: 'http://localhost:4016', changeOrigin: true }));

// Proxy to Admin server
app.use('/admin', createProxyMiddleware({ target: 'http://localhost:4064', changeOrigin: true }));

// Proxy to Next.js server
app.use('/', createProxyMiddleware({ target: 'http://localhost:4128', changeOrigin: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});