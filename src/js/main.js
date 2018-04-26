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


const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;

// Receive
window.onload = function () {
    var tweets = document.getElementsByClassName("tweet");
    ipcRenderer.send("set-window-height", tweets[0].offsetHeight, window.screen.availHeight);
    var bar = document.getElementById("app");
    var close = document.getElementById("close");
    var isMouseOver = false;

    bar.addEventListener("mouseover", function () {
        close.id = "close-on";
        isMouseOver = true;
    });
    bar.addEventListener("mouseout", function () {
        close.id = "close";
        isMouseOver = false;
    });

    close.addEventListener("mousedown", function () {
        ipcRenderer.send("exit");
    });


    setInterval(function () {
        if (!isMouseOver) {
            bar.scrollLeft += 1;
            var tweetElement = document.getElementsByClassName("tweet")[0];
            var targetRect = tweetElement.getBoundingClientRect();
            if (-targetRect.left > targetRect.width) {
                tweetElement.parentNode.removeChild(tweetElement);
                bar.scrollLeft -= targetRect.width;
            }
        }
    }, 20);
}

ipcRenderer.on("setTimeline", function (event, data) {
    var tweets = Array();
    JSON.parse(data).forEach(element => {
        var tweet = new Tweet(element.user.name, element.user.screen_name, element.user.profile_image_url, element.text);
        app.tweets.push(tweet);
    });
});