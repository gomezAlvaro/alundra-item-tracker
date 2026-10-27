// Local server for moving pins: serves docs/ and lets the v4 page (edit mode) save pin positions.
// Usage: node scripts/edit-server.js [port]   then open http://localhost:8765/v4/ and press "Edit pins".
// Saved positions go to data/pin_overrides.json and the pages are rebuilt; commit that file with the rebuilt docs/.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const docs = path.join(root, 'docs');
const overridesFile = path.join(root, 'data/pin_overrides.json');
const port = Number(process.argv[2]) || 8765;
const TYPES = { '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };
const PIPELINE = ['scripts/v2/build.js', 'scripts/v4/build.js', 'scripts/v3/build.js'];

function save(body) {
    const current = JSON.parse(fs.readFileSync(overridesFile, 'utf8'));
    const chests = { ...current.chests }, locations = { ...current.locations };
    for (const [k, p] of Object.entries(body.chests || {})) chests[k] = { map: String(p.map), x: Math.round(p.x), y: Math.round(p.y), c: p.c || 'g' };
    for (const [k, p] of Object.entries(body.locations || {})) locations[k] = p.map((v, i) => i < 2 ? Math.round(v) : v);
    fs.writeFileSync(overridesFile, JSON.stringify({ chests, locations }, null, 2) + '\n');
    for (const script of PIPELINE) execFileSync(process.execPath, [path.join(root, script)], { cwd: root, stdio: 'pipe' });
    return { chests: Object.keys(body.chests || {}).length, locations: Object.keys(body.locations || {}).length };
}

http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
    if (url.pathname === '/api/ping') return send(200, 'application/json', '{"edit":true}');
    if (url.pathname === '/api/save' && req.method === 'POST') {
        let raw = '';
        req.on('data', c => { raw += c; });
        req.on('end', () => {
            try { send(200, 'application/json', JSON.stringify(save(JSON.parse(raw)))); }
            catch (e) { send(500, 'text/plain', String(e.stderr || e.message)); }
        });
        return;
    }
    let file = path.join(docs, decodeURIComponent(url.pathname));
    if (!file.startsWith(docs)) return send(403, 'text/plain', 'Forbidden');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return send(404, 'text/plain', 'Not found');
    send(200, TYPES[path.extname(file)] || 'application/octet-stream', fs.readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`Pin editor: http://localhost:${port}/v4/  (Ctrl+C to stop)`));
