const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const content = 'This is a test image content acting as a PNG file.';
const filename = 'test-asset.png';

const bodyBefore = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
const bodyAfter = `\r\n--${boundary}--\r\n`;

const payload = Buffer.concat([
    Buffer.from(bodyBefore),
    Buffer.from(content),
    Buffer.from(bodyAfter)
]);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/upload/assets',
    method: 'POST',
    headers: {
        'x-workspace-name': 'TEST_WORKSPACE',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
    });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
