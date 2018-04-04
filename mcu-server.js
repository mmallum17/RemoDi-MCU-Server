// Initialize Modules
const net = require('net');
const io = require('socket.io-client');
const MongoClient = require('mongodb').MongoClient;

let uri = 'mongodb://heroku_cfxbsxk6:bl8e6ganuvdct4hfnc00a8hmdi@ds231749.mlab.com:31749/heroku_cfxbsxk6';
let dbName = 'heroku_cfxbsxk6';

// Start TCP Server for MCU
const server = net.createServer((client) => {
    // On Scale Connected, start WebSocket connection to web app server
    console.log('Scale Connected!');
    let socket = io.connect('https://remodi-scale.herokuapp.com/');
    client.setTimeout(5000);
    socket.on('connect', function(socket) {
        console.log('Connected to front-end server!');
    });
    client.on('timeout', () => {
       console.log('socket timeout');
       //client.end();
        socket.close();
    });
    socket.on('name', function(data) {
        console.log(data);
    });

    // MCU Connection Events
    client.on('data', function (chunk) {
        console.log(chunk.toString());
        MongoClient.connect(uri, function(err, client) {
            if (err) {
                throw err;
            }
            console.log("Database connected");
            const db = client.db(dbName);
            let myobj = {date: new Date(), LC0: 0.1, LC1: 1.1, LC2: 2.1, LC3: 3.};
            db.collection('load_cell_data').insertOne(myobj, function (err, result) {
                if (err) {
                    throw err;
                }
                console.log('Load Cell Data inserted');
                client.close();
            });
        });
        //socket.emit('weight', chunk.toString());
    });
    client.on('end', () => {
        console.log('Scale Disconnected!');
        socket.close();
    });
});

// If error occurs, handle accordingly
server.on('error', (err) => {
    //throw err;
    console.log(err.stack);
});

// Listen for MCU
server.listen(4000, () => {
    console.log('TCP Server Listening on Port 4000');
});