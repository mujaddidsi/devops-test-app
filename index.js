const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        message: 'Hello from PM2!',
        timestamp: timestamp,
        hostname: require('os').hostname()
    }));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
