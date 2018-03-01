$(document).ready(() => {
    $("#input-message").emojioneArea({
        shortnames: true,
        search: false,
        textcomplete: {
            maxCount: 5,
            placement: 'top'
        },
        events: {
            keydown: function (editor, event) {
                console.log(this);
                this.setText('');
                sendMsg(event, editor);
            }
        }
    });

    $.post('/getUser', (data) => {
        var template = $('#userInfoTemplate').html();
        var temp = Mustache.render(template, data);
        $('#userPro5').append(temp);
        addUser(data);
        socket.emit('joinChat', data);
    });
});

socket.on('newMsg', (data) => {
    var template = document.getElementById('msgLine').innerHTML;
    var temp = Mustache.render(template, data);
    var node = document.createRange().createContextualFragment(temp);
    document.getElementById('msgArea').appendChild(node);

    // Notify new message
    notifyNewMessage(data.user, data.message, "/avatar/" + data.avatar);

    // Scroll to bottom
    $('.ss-content').animate({
        scrollTop: $('#msgArea').height()
    }, 'slow');
});

socket.on('lstMsg', (data) => {
    var msgs = JSON.parse(data);
    msgs.forEach(msg => {
        var template = document.getElementById('msgLine').innerHTML;
        var temp = Mustache.render(template, msg);
        var node = document.createRange().createContextualFragment(temp);
        document.getElementById('msgArea').appendChild(node);
    });

    // Scroll to bottom
    $('.ss-content').animate({
        scrollTop: $('#msgArea').height()
    });
});

// Add user
socket.on('lstUser', (data) => {
    var username = $('#user').text().trim();
    var users = JSON.parse(data);
    users.forEach(user => {
        if (username != user.userName.trim()) {
            var template = document.getElementById('userItem').innerHTML;
            var temp = Mustache.render(template, user);
            var node = document.createRange().createContextualFragment(temp);
            document.getElementById('userGroup').appendChild(node);
        }
    });
});

// Add user
socket.on('newUser', (data) => {
    var user = $('#user').text().trim();
    if (user != data.userName.trim()) {
        // if (data.userName.trim().localeCompare(user)) {
        addUser(data);

        // Notify new user is connect to server.
        var welcomeMsg = 'User ' + data.userName + ' is online !';
        notifyNewMessage("GCS_Chat", welcomeMsg, data.avatar);
    }
});

function addUser(data) {
    var template = document.getElementById('userItem').innerHTML;
    var temp = Mustache.render(template, data);
    var node = document.createRange().createContextualFragment(temp);
    document.getElementById('userGroup').appendChild(node);
}

// Remove user
socket.on('rmUser', (data) => {
    document.getElementById(data).remove();
});

// Send message
function sendMsg(e, editor) {
    if (e.keyCode == 13) {
        var msg = editor.html();
        if (msg.trim() != '') {

            // document.getElementById('input-message').innerHTML = '';
            var user = document.getElementById('user').value;
            socket.emit('msg', {
                user: user,
                msg: msg
            });
        }
    }
}

function notifyNewMessage(user, content, avatar) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support system notifications");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        showNotification(user, content, avatar);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                showNotification(user, content, avatar);
            }
        });
    }

    // Finally, if the user has denied notifications and you 
    // want to be respectful there is no need to bother them any more.
}

function showNotification(user, content, avatar) {
    var userN = user;
    var body = content;

    if (user.length > 20) {
        userN = user.substring(0, 19) + "...";
    }

    if (content.length > 64) {
        body = content.substring(0, 63) + "...";
    }
    var options = {
        body: body,
        icon: avatar
    };

    var notification = new Notification(userN, options);
    setTimeout(notification.close.bind(notification), 5000);
}