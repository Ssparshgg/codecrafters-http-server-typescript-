import * as net from "net";
import fs from "node:fs";
import zlib from "node:zlib";
const server = net.createServer((socket) => {
	socket.on("data", (data) => {
		let splitedData = data.toString().split("\r\n");
		const path = splitedData[0].split(" ")[1];
		const headers = splitedData.slice(1, -2);
		const method = splitedData[0].split(" ")[0];
		console.log("method", method);

		if (method === "POST" && path.startsWith("/files/")) {
			const paarts = path.split("/");
			const [_, __, fileName] = paarts;
			const args = process.argv.slice(2);
			const [___, absPath] = args;
			const filePath = absPath + "/" + fileName;
			const content = splitedData.slice(-1)[0];

			fs.writeFileSync(filePath, content);
			socket.write("HTTP/1.1 201 Created\r\n\r\n");
			socket.end();
		} else if (method === "GET") {
			if (path === "/") {
				socket.write("HTTP/1.1 200 OK\r\n\r\n");
			} else if (path.indexOf("/echo/") === 0) {
				const query = path.slice(6);
				console.log("query", query);

				const header = headers.find(
					(h) => h.indexOf("Accept-Encoding: ") === 0
				);
				console.log("header", header);

				const present = header ? header.includes("gzip") : false;
				console.log("present", present);

				let encoding = "undefined";

				if (present) {
					encoding = "gzip";
				}

				if (encoding === "gzip") {
					const buffer = Buffer.from(query, "utf8");
					const zipped = zlib.gzipSync(buffer);
					console.log("zipped", zipped);
					socket.write(
						`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${zipped.length}\r\n\r\n`
					);
					socket.write(zipped);
				} else {
					socket.write(
						`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
					);
				}
			} else if (path.indexOf("/user-agent") === 0) {
				const agent = headers
					.find((h) => h.indexOf("User-Agent: ") === 0)!
					.slice(12);
				console.log("agent", agent);

				socket.write(
					`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${agent.length}\r\n\r\n${agent}`
				);
			} else if (path.startsWith("/files/")) {
				const paarts = path.split("/");
				const [_, __, fileName] = paarts;
				const args = process.argv.slice(2);
				const [___, absPath] = args;
				const filePath = absPath + "/" + fileName;
				try {
					const content = fs.readFileSync(filePath);
					socket.write(
						`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
					);
				} catch (error) {
					socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
				}
			} else {
				socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
			}
			socket.end();
		}
	});
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
	console.log("Server is running on port 4221");
});
