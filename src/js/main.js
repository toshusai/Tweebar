const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;

class Tweet {
    constructor(userName, screenName, imageUrl, text) {
        this.userName = userName;
        this.screenName = screenName;
        this.imageUrl = imageUrl;
        this.text = text;
    }
}

var app = new Vue({
    el: '#app',
    data: {
        tweets: [new Tweet("", "running...", "https://pbs.twimg.com/profile_images/970200070787276800/tqZy7jtc_bigger.jpg", "Please wait...")]
    }
})

// DOM
var scrollBar = null;
var counter = null;

var timeline = new Array();
var timelineScrollPosition = 0;
var isTimeline = true;
var searchWord = "";

var timelineRequestTimer = 180;
var searchRequestTimer = 60;

setInterval(function () {
    if (isTimeline) {
        counter.innerHTML = timelineRequestTimer--;
        if (timelineRequestTimer < 0) {
            ipcRenderer.send("request-timeline", null);
            timelineRequestTimer = 180;
        }
    } else {
        counter.innerHTML = searchRequestTimer--;
        if (searchRequestTimer < 0) {
            ipcRenderer.send("request-search", searchWord);
            searchRequestTimer = 60;
        }
    }
}, 1000);

window.onload = function () {
    maximize();
    scrollBar = document.getElementById("scroll-bar");
    counter = document.getElementById("counter");
    var menu = document.getElementById("menu-bar");
    var isMouseOver = false;

    var count = 0;
    document.body.addEventListener("mouseover", function (event) {
        menu.hidden = false;
        isMouseOver = true;
    });

    document.body.addEventListener("mouseleave", function (event) {
        if (0 < event.layerY || event.layerY > 96) {
            menu.hidden = true;
            isMouseOver = false;
        }
    });

    setInterval(function () {
        scrollBar.scrollLeft += 1;
        if (document.getElementsByClassName("tweet").length !== 0) {
            var tweetElement = document.getElementsByClassName("tweet")[0];
            var targetRect = tweetElement.getBoundingClientRect();
            if (-targetRect.left > targetRect.width) {
                tweetElement.parentNode.removeChild(tweetElement);
                scrollBar.scrollLeft -= targetRect.width;
            }
        }
    }, 20);
    ipcRenderer.send("request-timeline", null);
}

// Click event.
var backTimeline = function () {
    if (!isTimeline) {
        app.tweets = timeline;
        scrollBar.scrollLeft = timelineScrollPosition;
        isTimeline = true;
    }
}

var search = function () {
    searchWord = document.getElementById("search-input").value;
    ipcRenderer.send("request-search", searchWord);
    timelineScrollPosition = scrollBar.scrollLeft;
    isTimeline = false;
}

var minimize = function () {
    ipcRenderer.send("set-window", window.screen.width - 32, window.screen.availHeight - 32, 32, 32);
    document.getElementById("maximize-button").hidden = false;
}

var exit = function () {
    ipcRenderer.send("exit");
}

var maximize = function () {
    ipcRenderer.send("set-window", 0, window.screen.availHeight - document.body.offsetHeight, window.screen.width, document.body.offsetHeight);
    document.getElementById("maximize-button").hidden = true;
}

// Receive event.
ipcRenderer.on("set-timeline-data", function (event, data) {
    JSON.parse(data).forEach(element => {
        var tweet = new Tweet(element.user.name, element.user.screen_name, element.user.profile_image_url, element.text);
        app.tweets.push(tweet);
    });
    timeline = app.tweets;
});

ipcRenderer.on("set-search-data", function (event, data) {
    timeline = app.tweets;
    app.tweets = new Array();
    JSON.parse(data).statuses.forEach(element => {
        var tweet = new Tweet(element.user.name, element.user.screen_name, element.user.profile_image_url, element.text);
        app.tweets.push(tweet);
    });
    scrollBar.scrollLeft = 0;
});

