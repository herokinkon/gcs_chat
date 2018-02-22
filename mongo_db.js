var mongoosedb = require('mongoose');

mongoosedb.connect('mongodb://localhost/gcs_chat_db');
var db = mongoosedb.connection;
db.on('error', console.error);

/**
 * User Collection
 */

// User Session Schema
var schema = mongoosedb.Schema;
var userSchema = new schema({
    sessionId: String,
    userName: String,
    socketIds: [String],
    avatar: String
});
// user Session model
var userModel = mongoosedb.model("users", userSchema);

exports.newSession = function createNewSession(sessionId, user, avatar) {
    var user1 = new userModel({
        sessionId: sessionId,
        userName: user,
        avatar: avatar
    }).save();
    console.log('Finish Create new session for ' + user);
};

exports.removeSession = function createNewSession(user) {
    userModel.remove({
        'userName': user
    }, (err) => {
        console.log(err);
    });
};

exports.newSocket = function createNewSocketForUser(socketId, userN) {
    userModel.findOne({
        'userName': userN
    }, (err, result) => {
        if (err) return handleError(err);
        result.socketIds.push(socketId);
        result.save();
        console.log("Save new socket id: " + result.socketIds);
    });
};


exports.removeSocket = function removeSocketForUser(socketId, userN) {
    userModel.findOne({
        'userName': userN
    }, (err, result) => {
        if (err) return handleError(err);
        if (result.socketIds != null) {
            result.socketIds.remove(socketId);
            result.save();
        }
    });
};

exports.getUserInfo = function getUserInfo(userN) {
    return new Promise((resolve, reject) => {
        userModel.findOne({
            'userName': userN
        }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

exports.getListUser = function getListUser() {
    return new Promise((resolve, reject) => {
        userModel.find((err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

/**
 * Message collection
 */

// Message schema
var msgSchema = new schema({
    id: Number,
    time: String,
    user: String,
    message: String,
    avatar: String
});
// user Session model
var msgModel = mongoosedb.model("message", msgSchema);
// Get list message
exports.getListMessage = function getListMessage() {
    return new Promise((resolve, reject) => {
        msgModel.find((err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

    });
}

// Store message in db
exports.storeMessage = function storeMessage(message) {
    var messageModel = new msgModel(message);
    messageModel.save();
}