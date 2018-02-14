var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var body = require('body-parser');
var cookie = require('cookie-parser');
var sharedsession = require("express-socket.io-session");

var db = require("./mongo_db");

var multer = require('multer');
var session = require("express-session")({
    secret: "xxx",
    resave: true,
    saveUninitialized: true
});

// Use express-session middleware for express
app.use(session);
app.use(cookie());
// Use shared session middleware for socket.io
// setting autoSave:true
io.use(sharedsession(session, {
    autoSave: true
}));

var fs = require('fs');

app.use(multer({
    dest: '/tmp/'
}).any());

app.use(body.urlencoded({
    extended: false
}));

// Public folder for client
app.use(express.static('public'));

// Home
app.get('/', (req, res) => {
    if (req.session.name != null) {
        res.sendfile('footerMessage.html');
    } else {
        res.sendfile('index.htm');
    }
});

// Get user information
app.post('/getUser', (req, res) => {
    var userName = req.session.name;
    var avatar = req.session.avatar;
    res.send({
        userName: userName,
        avatar: avatar
    });
});

// Login user
app.post('/', (req, res) => {
    db.getListSockets(req.body.name).then((result) => {
        if (req.session.name != null) {
            res.sendfile('footerMessage.html');
        } else if (result.userName != null) {
            res.send('Existed user');
        } else if (req.body.name.trim() != '') {
            var avatar;
            if (req.files[0] == null) {
                avatar = "user.png";
            } else {
                avatar = req.files[0].filename;
                persistAvatar(req, "avatar/");
            }

            req.session.name = req.body.name;
            req.session.avatar = avatar;
            res.sendfile('footerMessage.html');
            db.newSession(req.session.id, req.session.name, avatar);
            console.log('finish request');
        }
    });

});

app.post('/uploadImage', (req, res) => {
    var img = req.files[0].filename;
    persistAvatar(req, "pic/").then((data) => {
        res.send("/pic/" + img);
    });
});

app.get('/logout', (req, res) => {
    var userName = req.session.name;
    db.getListSockets(userName).then((result) => {
        for (var i = 0; i < result.socketIds.length; i++) {
            console.log("Destroy socket");
            io.sockets.connected[result.socketIds[i]].handshake.session.user = null;
            io.sockets.connected[result.socketIds[i]].disconnect(true);
        }
        db.removeSession(userName);
        req.session.destroy();
        res.redirect('/');
    });
});

var userNames = [];
var listUsers = [];
var msgs = [];
var id = 1;
io.on('connection', (socket) => {
    socket.on('joinChat', (data) => {
        console.log(data.userName + ": " + socket.handshake.address);
        // Send new user info to other clients
        if (socket.handshake.session.user == null) {
            socket.handshake.session.user = data.userName;
            socket.handshake.session.avatar = data.avatar;
            socket.broadcast.emit('newUser', data);
        }
        // send list user for new client
        socket.emit('lstUser', JSON.stringify(listUsers));

        // Add socket id to of user
        db.newSocket(socket.id, data.userName);

        // Send old chat message
        if (msgs.length != 0) {
            socket.emit('lstMsg', JSON.stringify(msgs));
        }
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
            user: socket.handshake.session.user,
            time: time,
            message: data.msg,
            avatar: socket.handshake.session.avatar
        };
        id++;
        io.sockets.emit('newMsg', dat);
        msgs.push(dat);
        if (msgs.length % 15 == 0) {
            persistMessageLog(msgs);
            // msgs = [];
        }
    });

    socket.on("disconnect", () => {
        if (socket.handshake.session.user != null) {
            db.removeSocket(socket.id, socket.handshake.session.user);
        }
    });
});


http.listen(8888, () => {
    console.log('Listening on port');
});

function persistMessageLog(...data) {
    var str = JSON.stringify(data);
    fs.appendFile("chatlog.txt", str, () => {});
}

function persistAvatar(req, folder) {
    return new Promise((resolve, reject) => {
        var file = __dirname + "/public/" + folder + req.files[0].filename;

        fs.readFile(req.files[0].path, function (err, data) {
            fs.writeFile(file, data, function (err) {
                if (err) {
                    console.log(err);
                }
                resolve(file);
            });
        });
    });
}