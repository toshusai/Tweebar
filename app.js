// Const value.
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');
const ipc = require("ipc");
const fsHelper = require("./lib/helper-fs.js");

const mainPath = "./app/main.html";
const authPath = "./app/auth.html";
const tokenPath = "./json/token.json";
const keyPath = "./json/key.json";
const timelinePath = "./json/home_timeline.json";

var mainWindow = null;
var timer = 0;
var apiInterval = 180;

// Twitter.
var twitter = {
    api: null,
    accessToken: "",
    accessTokenSecret: "",
    requestToken: "",
    requestTokenSecret: ""
}

// loadURL mainWindow.
var loadUrlMain = function (dist) {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, dist),
        protocol: 'file:',
        slashes: true
    }))
}

var initMainWindow = function (frame_ = true, transparent_ = false) {
    var oldWindow = mainWindow;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        useContentSize: true,
        frame: frame_,
        show: true,
        transparent: transparent_
    })
    mainWindow.setAlwaysOnTop(true);

    if (oldWindow !== null) {
        oldWindow.close();
    }
}

app.on('ready', () => {
    initMainWindow();

    var twitterAPI = require('node-twitter-api');
    var keys = JSON.parse(fsHelper.read(keyPath));
    twitter.api = new twitterAPI({
        consumerKey: keys.consumerKey,
        consumerSecret: keys.consumerSecret,
        callback: "tweebar"

    });

    if (fsHelper.check(tokenPath)) {
        var token = fsHelper.read(tokenPath);
        twitter.accessToken = JSON.parse(token).accessToken;
        twitter.accessTokenSecret = JSON.parse(token).accessTokenSecret;
        initMainWindow(false, true);
        loadUrlMain(mainPath);
        setTimeout(() => {
            //getTimeline();
        }, 2000);
    } else {
        loadUrlMain(authPath);
        twitter.api.getRequestToken(function (error, requestToken_, requestTokenSecret_, results) {
            if (error) {
                console.log("Error getting OAuth request token : " + error);
            } else {
                twitter.requestToken = requestToken_;
                twitter.requestTokenSecret = requestTokenSecret_;
                var requestTokenUrl = "https://api.twitter.com/oauth/authorize?oauth_token=" + twitter.requestToken;
                mainWindow.webContents.send("loadUrl", requestTokenUrl);
            }
        });
    }
})

app.on('window-all-closed', function () {
    app.quit();
});


setInterval(function () {
    timer++;
    console.log(timer);
    if (timer > apiInterval) {
        getTimeline();
        timer = 0;
    }
}, 1000);

var getAccessToken = function (oauthVerifier) {
    twitter.api.getAccessToken(twitter.requestToken, twitter.requestTokenSecret, oauthVerifier, function (error, accessToken_, accessTokenSecret_, results) {
        if (error) {
            console.log(error);
        } else {
            var tokenData = {
                accessToken: accessToken_,
                accessTokenSecret: accessTokenSecret_
            }
            fsHelper.write(tokenPath, JSON.stringify(tokenData));
            initMainWindow(false, true);
            loadUrlMain(mainPath);
        }
    });
}

var getTimeline = function () {
    var option = {
        count: 200,
        include_entities: false
    }
    if(fsHelper.check(timelinePath)){
        var data = JSON.parse(fsHelper.read(timelinePath));
        option = {
            count: 200,
            include_entities: false,
            since_id: data[data.length - 1].id
        }
    }
    twitter.api.getTimeline("home_timeline", option, 
        twitter.accessToken,
        twitter.accessTokenSecret,
        function (error, data, response) {
            if (error) {
                console.log(error);
            } else {
                var strData = JSON.stringify(data);
                fsHelper.write(timelinePath, strData);
                mainWindow.webContents.send("setTimeline", strData);
            }
        }
    );
}

ipcMain.on("getAccessToken", function (event, oauthVerifier) {
    getAccessToken(oauthVerifier);
});

ipcMain.on("set-window-height", function (event, height, availHeight) {
    var screenSize = electron.screen.getPrimaryDisplay().size;
    mainWindow.setSize(screenSize.width, height);
    mainWindow.setPosition(0, availHeight - height);
});

ipcMain.on("exit", function(event){
    mainWindow.close();
});