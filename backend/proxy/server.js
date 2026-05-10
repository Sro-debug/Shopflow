require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PROXY_PORT || 4000;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── Simple proxy forwarder ────────────────────────────────────────
function forwardRequest(req, res, targetPath) {
  const url = new URL(`${GATEWAY_URL}${targetPath}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''),
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { Authorization: req.headers.authorization }),
    },
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([k, v]) => res.setHeader(k, v));
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy] Error:', err.message);
    res.status(502).json({ error: 'Gateway unavailable' });
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
}

// Forward all /api/* requests to the gateway
app.all('/api/*', (req, res) => {
  forwardRequest(req, res, req.url);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'proxy running', gateway: GATEWAY_URL }));

app.listen(PORT, () => {
  console.log(`[Proxy] Running on port ${PORT} → Gateway: ${GATEWAY_URL}`);
});
