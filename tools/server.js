const fs = require('fs');
const http = require("http");
const path = require("path");

const port = 3000;

const mimeTypes = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.map': 'application/json',
    '.html': 'text/html',
    '.woff': 'application/font-woff',
    '.png': 'image/png',
    '.jpeg': 'image/jpeg',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
};
const sendFile = (res, filename) => {
    const ext = path.extname(filename);
    if (mimeTypes.hasOwnProperty(ext)) {
        res.writeHead(200, {'Content-Type': mimeTypes[ext]});
    } else {
        console.log(`Unknown mime type for extension ${ext}`);
    }

    fs.createReadStream(path.join(__dirname, "../build", filename))
        .pipe(res);
};

const showStatic = (req, res) => {
    sendFile(res, req.url.substr(1));
};
const showStaticWithHtml = (req, res) => {
    sendFile(res, `${req.url.substr(1)}.html`);
};
const showIndex = (req, res) => {
    sendFile(res, "index.html");
};

const startsWith = (url, prefixes) => {
    for (const prefix of prefixes) {
        if (url.indexOf(prefix) === 0) {
            return true;
        }
    }
    return false;
};

const server = http.createServer((req, res) => {
    const prefixesStaticWithHtml = ['/export_3.3', '/manifest_hack', '/test', '/test_case'];
    const prefixesStatic = ['/css/', '/fonts/', '/gen/', '/ico/', '/img/'];

    if (startsWith(req.url, prefixesStaticWithHtml)) {
        showStaticWithHtml(req, res);
    } else if (startsWith(req.url, prefixesStatic)) {
        showStatic(req, res);
    } else {
        showIndex(req, res);
    }
});

server.listen(port, 'localhost', () => console.log(`View Basketball GM at http://localhost:${port}`));
