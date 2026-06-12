const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const APP_PIN = process.env.APP_PIN || '';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

const seedState = {
  clients: [
    {
      id: crypto.randomUUID(),
      name: 'Cliente Demonstração',
      hours: 30,
      contactName: 'Contato Principal',
      contactEmail: 'contato@cliente.com',
      contactPhone: '(11) 99999-0000',
      contractType: 'Suporte e consultoria',
      notes: 'Use este registro como exemplo ou edite com os dados reais.',
      services: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          hours: 2.5,
          agent: 'Equipe Mouragrid',
          category: 'Suporte',
          description: 'Ajuste inicial de ambiente e validação de acesso com o cliente.'
        }
      ]
    }
  ],
  selectedClientId: null,
  updatedAt: new Date().toISOString()
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { ...seedState, selectedClientId: seedState.clients[0].id };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function readState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeState(state) {
  const normalized = {
    clients: Array.isArray(state.clients) ? state.clients : [],
    selectedClientId: state.selectedClientId || null,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalized, null, 2));
  return normalized;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 5_000_000) {
        request.destroy();
        reject(new Error('Payload muito grande.'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function isAuthorized(request) {
  if (!APP_PIN) return true;
  return request.headers['x-app-pin'] === APP_PIN;
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const cleanPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end('Acesso negado.');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end('Arquivo nao encontrado.');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=3600'
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith('/api/state')) {
      if (!isAuthorized(request)) {
        sendJson(response, 401, { error: 'PIN invalido.' });
        return;
      }

      if (request.method === 'GET') {
        sendJson(response, 200, readState());
        return;
      }

      if (request.method === 'POST') {
        const body = await readBody(request);
        const parsed = JSON.parse(body || '{}');
        sendJson(response, 200, writeState(parsed));
        return;
      }

      sendJson(response, 405, { error: 'Metodo nao permitido.' });
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'Erro interno.' });
  }
});

server.listen(PORT, () => {
  console.log(`Mouragrid Controle de Horas online em http://localhost:${PORT}`);
});
