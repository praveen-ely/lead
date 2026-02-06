const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = createProxyMiddleware({
  target: 'http://localhost:5002',
  changeOrigin: true,
  logLevel: 'debug'
});

module.exports = proxy;
