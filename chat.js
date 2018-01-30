var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var body = require('body-parser');
var session = require('express-session');
var fs = require('fs');

app.use(session({
    secret: 'xxxx',
    cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 999999999
    }
}));

app.use(body.urlencoded({
    extended: false
}));

app.use(express.static('public'));

app.get('/', (req, res) => {
    if (req.session.user != null) {
        res.sendfile('footerMessage.html');
    } else {
        res.sendfile('index.htm');
    }
});

var sess;
app.post('/login', (req, res) => {
    if (userNames.indexOf(req.body.name) > -1) {
        res.send('Existed user');
    } else {
        req.session.ip = req.ip;
        req.session.user = req.body.name;
        req.session.avatar = 'kinkon241992.jpg';
        sess = req.session;
        userNames.push(req.body.name);
        listUsers.push({
            id: sess.id,
            userName: req.body.name,
            avatar: 'kinkon241992.jpg'
        });
        res.sendfile('footerMessage.html');
    }
});

var userNames = [];
var listUsers = [];
var msgs = [];
var id = 1;
io.on('connection', (socket) => {

    socket.on('joinChat', () => {
        // Send new user info to other clients
        var userInf = {
            userName: sess.user,
            avatar: 'kinkon241992.jpg'
        };
        socket.broadcast.emit('newUser', userInf);
        // send list user for new client
        socket.emit('lstUser', JSON.stringify(listUsers));
    });

    socket.on('msg', (data) => {
        var date = new Date();
        var time = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        var dat = {
            id: id,
            user: sess.user,
            time: time,
            message: data
        };
        id++;
        io.sockets.emit('newMsg', dat);
        if (msgs.length == 5) {
            persistMessageLog(msgs);
            msgs = [];
        } else {
            msgs.push(dat);
        }
    });

});


http.listen(8888, () => {
    console.log('Listening on port');
});

function persistMessageLog(...data) {
    var str = JSON.stringify(data);
    fs.writeFile("chatlog.txt", str);
}