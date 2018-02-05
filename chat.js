var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var body = require('body-parser');
var cookie = require('cookie-parser');

var multer = require('multer');
var session = require("express-session")({
    secret: "xxx",
    resave: true,
    saveUninitialized: true
});

// Use express-session middleware for express
app.use(session);
app.use(cookie());

var fs = require('fs');

app.use(multer({
    dest: '/tmp/'
}).any());

app.use(body.urlencoded({
    extended: false
}));

// Public folder for client
app.use(express.static('public'));

app.get('/', (req, res) => {
    // res.sendfile('footerMessage.html');
    // var user = getUserInfo(req.ip);
    // req.session.test = 'test message';
    // req.cookies.test = 'test';
    if (req.session.name != null) {
        res.sendfile('footerMessage.html');
    } else {
        res.sendfile('index.htm');
    }
});

app.post('/getUser', (req, res) => {
    var userName = req.session.name;
    var avatar = req.session.avatar;
    res.send({
        userName: userName,
        avatar: avatar
    });
});

app.post('/', (req, res) => {
    if (userNames.indexOf(req.body.name) > -1) {
        res.send('Existed user');
    } else if (req.body.name.trim() != '') {
        persistAvatar(req);
        userNames.push(req.body.name);
        listUsers.push({
            id: req.ip,
            userName: req.body.name,
            avatar: req.files[0].filename
        });
        req.session.name = req.body.name;
        req.session.avatar = req.files[0].filename;
        res.sendfile('footerMessage.html');
        console.log('finish request');
    }
});

var userNames = [];
var listUsers = [];
var msgs = [];
var id = 1;
io.on('connection', (socket) => {
    socket.on('joinChat', () => {
        // Send new user info to other clients
        var userInf = getUserInfo(socket.handshake.address);
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
        var userInf = getUserInfo(socket.handshake.address);

        var dat = {
            id: id,
            user: userInf.user,
            time: time,
            message: data,
            avatar: userInf.avatar
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

function persistAvatar(req) {
    var file = __dirname + "/public/avatar/" + req.files[0].filename;

    fs.readFile(req.files[0].path, function (err, data) {
        fs.writeFile(file, data, function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
}

function getUserInfo(address) {

    for (var user in listUsers) {
        if (listUsers[user].id == address) {
            var info = {
                userName: listUsers[user].userName,
                avatar: listUsers[user].avatar
            };
            return info;
        }
    }
}