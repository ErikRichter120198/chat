const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'create':
                const roomID = uuidv4();
                rooms[roomID] = [];
                ws.send(JSON.stringify({ type: 'created', roomID }));
                break;

            case 'join':
                if (rooms[data.roomID]) {
                    rooms[data.roomID].push(ws);
                    ws.send(JSON.stringify({ type: 'joined', roomID: data.roomID }));
                    rooms[data.roomID].forEach(client => {
                        if (client !== ws) {
                            client.send(JSON.stringify({ type: 'new_member', roomID: data.roomID }));
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
                }
                break;

            case 'signal':
                if (rooms[data.roomID]) {
                    rooms[data.roomID].forEach(client => {
                        if (client !== ws) {
                            client.send(JSON.stringify({ type: 'signal', message: data.message }));
                        }
                    });
                }
                break;
        }
    });

    ws.on('close', () => {
        // Handle cleanup if necessary
   });
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

