const http = require('node:http');
const fs = require('fs');

const page = fs.readFileSync('index.html');

const list = [];

function getId(url) {
	const query = url.split('?');
	if (query.length === 2) {
		const queryItems = query[1].split('&');
		for (let i = 0; i < queryItems.length; i++) {
			if ((queryItems[i].split('=').length === 2) && (queryItems[i].split('=')[0] === 'id')) {
				return parseInt(queryItems[i].split('=')[1]);
			}
		}
	}
	return null;
}

function notFound(res) {
	res.writeHead(404, { 'Content-Type': 'text/plain' });
	res.end('Not Found');
}

function badRequest(res) {
	res.writeHead(400, { 'Content-Type': 'text/plain' });
	res.end('Bad Request');
}

const server = http.createServer((req, res) => {
	const path = req.url.split('?')[0];
	switch (path) {
		case '/':
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(page);
			break;
		case '/list':
			switch (req.method) {
				case 'GET':
					res.writeHead(200, { 'Content-Type': 'text/json' });
					res.end(JSON.stringify(list.map(item => { return { id: item.id, name: item.name }; }), null, 4));
					break;
				case 'DELETE':
					list.slice(0, 0);
					res.writeHead(200, { 'Content-Type': 'text/json' });
					res.end('[]');
					break;
				default:
					badRequest(res);
			}
			break;
		case '/item':
			switch (req.method) {
				case 'GET':
				case 'DELETE':
					const id = getId(req.url);
					if (!id) {
						badRequest();
					} else {
						const idx = list.findIndex(item => item.id === id);
						if (idx >= 0) {
							res.writeHead(200, { 'Content-Type': 'text/json' });
							if (req.method === 'GET') {
								res.end(JSON.stringify(list[idx], null, 4));
							} else {
								list.splice(idx, 1);
								res.end('[]');
							}
						} else {
							notFound();
						}
					}
					break;
				case 'POST':
				case 'PUT':
					let body = [];
					req.on('data', (chunk) => {
						body.push(chunk);
					}).on('end', () => {
						body = Buffer.concat(body).toString();

						const obj = JSON.parse(body);
						if (req.method === 'POST') {
							const item = {
								id: list.length ? list[list.length - 1].id + 1 : 1,
								name: obj.name,
								content: obj.content,
							};
							list.push(item);
							res.writeHead(200, { 'Content-Type': 'text/json' });
							res.end(JSON.stringify(item, null, 4));
						} else {
							const idx = list.findIndex(itm => itm.id === obj.id);
							if (idx >= 0) {
								list[idx].name = obj.name;
								list[idx].content = obj.content;
								res.writeHead(200, { 'Content-Type': 'text/json' });
								res.end(JSON.stringify(list[idx], null, 4));
							} else {
								notFound();
							}
						}
					});
					break;
				default:
					badRequest(res);
			}
			break;
		default:
			notFound(res);
	}
}).listen(1234);
