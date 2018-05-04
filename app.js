// Const value.
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const ipc = require("ipc");
const fs = require("fs");

const mainPath = "./src/html/main.html";
const authPath = "./src/html/auth.html";
const tokenPath = "./json/token.json";
const keyPath = "./json/key.json";
const timelinePath = "./json/home_timeline.json";

var authWindow = null;
var mainWindow = null;

// Twitter.
var twitter = {
    api: null,
    accessToken: "",
    accessTokenSecret: "",
    requestToken: "",
    requestTokenSecret: ""
}

var start = function () {
    mainWindow = new BrowserWindow({
        width: 0,
        height: 0,
        useContentSize: true,
        frame: false,
        show: true,
        transparent: true
    });
    mainWindow.setAlwaysOnTop(true);
    mainWindow.loadURL('file://' + __dirname + "/" + mainPath);
}

app.on('ready', () => {
    var twitterAPI = require('node-twitter-api');
    var keys = null;
    fs.readFile(keyPath, function (error, data) {
        keys = JSON.parse(data);
        twitter.api = new twitterAPI({
            consumerKey: keys.consumerKey,
            consumerSecret: keys.consumerSecret,
            callback: "tweebar"
        });

        fs.access(tokenPath, function (err) {
            if (err) {
                authWindow = new BrowserWindow({
                    width: 800,
                    height: 600
                });
                authWindow.loadURL('file://' + __dirname + "/" + authPath);
                twitter.api.getRequestToken(function (error, requestToken_, requestTokenSecret_, results) {
                    if (error) {
                        throw error;
                    } else {
                        twitter.requestToken = requestToken_;
                        twitter.requestTokenSecret = requestTokenSecret_;
                        var requestTokenUrl = "https://api.twitter.com/oauth/authorize?oauth_token=" + twitter.requestToken;
                        authWindow.webContents.send("loadUrl", requestTokenUrl);
                    }
                });
            } else {
                var token = null;
                fs.readFile(tokenPath, function (error, data) {
                    if (error) throw error;
                    token = JSON.parse(data);
                    twitter.accessToken = token.accessToken;
                    twitter.accessTokenSecret = token.accessTokenSecret;
                    start();
                });

            }
        });
    });

})

app.on('window-all-closed', function () {
    app.quit();
});

var sendTimeLineDataLocal = function () {
    fs.access(timelinePath, function (error) {
        if (error) {
            throw error;
        } else {
            fs.readFile(timelinePath, function (error, data) {
                mainWindow.webContents.send("set-timeline-data", data);
            });
        }
    });
}

var sendTimeLineData = function () {
    var option = {
        count: 200,
        include_entities: false
    }
    var sendTimeLineDataInner = function (option) {
        twitter.api.getTimeline("home_timeline", option, twitter.accessToken, twitter.accessTokenSecret, function (error, data, response) {
            if (error) {
                throw error;
            } else {
                var strData = JSON.stringify(data);
                fs.writeFile(timelinePath, strData, function (error) {
                    if (error) throw error;
                    mainWindow.webContents.send("set-timeline-data", data);
                });
            }
        });
    }

    fs.access(timelinePath, function (error) {
        if (error) {
            sendTimeLineDataInner(option);
        } else {
            fs.readFile(timelinePath, function (error, data) {
                data = JSON.parse(data);
                option = {
                    count: 200,
                    include_entities: false,
                    since_id: data[data.length - 1].id
                }
                sendTimeLineDataInner(option);
            });
        }
    });
}

ipcMain.on("get-access-token", function (event, oauthVerifier) {
    twitter.api.getAccessToken(twitter.requestToken, twitter.requestTokenSecret, oauthVerifier, function (error, accessToken_, accessTokenSecret_, results) {
        if (error) {
            throw error;
        } else {
            var tokenData = {
                accessToken: accessToken_,
                accessTokenSecret: accessTokenSecret_
            }
            fs.writeFile(tokenPath, JSON.stringify(tokenData), function (error) {
                if (error) throw error;
                start();
                if (authWindow !== null) {
                    authWindow.close();
                }
            });
        }
    });
});

ipcMain.on("set-window", function (event, x, y, width, height) {
    mainWindow.setSize(width, height);
    mainWindow.setPosition(x, y);
});

ipcMain.on("exit", function (event) {
    mainWindow.close();
});

ipcMain.on("request-timeline", function (event) {
    sendTimeLineDataLocal();
});

ipcMain.on("request-search", function (event, word) {
    params = {
        q: word,
        lang: "ja"
    }
    twitter.api.search(params, twitter.accessToken, twitter.accessTokenSecret, function (error, data, response) {
        if (error) {
            throw error;
        } else {
            mainWindow.webContents.send("set-search-data", JSON.stringify(data));
        }
    });
});