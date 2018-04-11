// Initialize Modules
const net = require('net');
const io = require('socket.io-client');
const MongoClient = require('mongodb').MongoClient;

let uri = 'mongodb://heroku_cfxbsxk6:bl8e6ganuvdct4hfnc00a8hmdi@ds231749.mlab.com:31749/heroku_cfxbsxk6';
let dbName = 'heroku_cfxbsxk6';

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 2)) {
        s = "0" + s;
    }
    return s;
};

// Start TCP Server for MCU
const server = net.createServer((client) => {
    // On Scale Connected, start WebSocket connection to web app server
    console.log('Scale Connected!');
    let socket = io.connect('https://remodi-scale.herokuapp.com/');
    client.setTimeout(5000);
    socket.on('connect', function (socket) {
        console.log('Connected to front-end server!');
    });
    client.on('timeout', () => {
        console.log('socket timeout');
        //client.end();
        socket.close();
    });
    /*socket.on('name', function(data) {
        console.log(data);
    });*/

    // MCU Connection Events
    client.on('data', function (chunk) {
        //console.log(chunk.toString());
        let tokens = chunk.toString().split(",");
        let command = tokens[0];
        if (command === "L") {
            let loadCellZero = parseFloat(tokens[1]);
            let loadCellOne = parseFloat(tokens[2]);
            let loadCellTwo = parseFloat(tokens[3]);
            let loadCellThree = parseFloat(tokens[4]);

            // Send websocket data
            socket.emit('lc', loadCellZero, loadCellOne, loadCellTwo, loadCellThree);

            console.log(tokens);
            MongoClient.connect(uri, function (err, client) {
                if (err) {
                    throw err;
                }
                console.log("Database connected");
                const db = client.db(dbName);
                let myobj = {
                    date: new Date(),
                    loadCellZero: loadCellZero,
                    loadCellOne: loadCellOne,
                    loadCellTwo: loadCellTwo,
                    loadCellThree: loadCellThree
                };
                db.collection('loadcells').insertOne(myobj, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    console.log('Load Cell Data inserted');
                });
                client.close();
            });
        }
        else if (command === "T") {
            let date = new Date();
            date.setHours(date.getHours() - 5);
            let dateArr = [(date.getFullYear() - 2000).pad(2), (date.getMonth() + 1).pad(2), date.getDate().pad(2), date.getHours().pad(2), date.getMinutes().pad(2), date.getSeconds().pad(2)];
            let dateStr = dateArr.join(',');
            client.write(dateStr);
            console.log(dateStr);
            console.log("GET TIME");
        }
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

