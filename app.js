var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendfile('index.htm');
});

var client = 0;

io.on('connection', (socket) => {
    console.log('A user is connected');
    client++;
    // setTimeout(() => {
    //     socket.send('Message sent after 3 sec');
    // }, 3000);
    socket.broadcast.emit('broadcast', {
        xxx: client + ' client connected!'
    });

    socket.emit('newClient', {
        xxx: 'Hello new client!'
    });

    socket.on('testClient', (data) => {
        console.log(data);
    });

    socket.on('disconnect', () => {
        client--;
        socket.broadcast.emit('broadcast', {
            xxx: client + ' client connected!'
        });
        console.log('Disconnect socket');
    });
});

http.listen(8888, () => {
    console.log('Listenning on port');
});