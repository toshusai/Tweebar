const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;

var webView = null;
window.onload = function () {
    webView = document.getElementById("web-view");
    webView.addEventListener("did-finish-load", function () {
        console.log(webView.getURL());
        var webViewUrl = webView.getURL();
        if (webViewUrl === "https://api.twitter.com/oauth/authorize") {
            document.getElementById("loading").hidden = false;
        }
        if (webViewUrl.indexOf("https://api.twitter.com/oauth/tweebar") != -1) {
            var params = webViewUrl.split("?")[1];
            params.split("&").forEach(element => {
                var param = element.split("=");
                if (param[0] === "oauth_token") {
                    console.log(param[1]);
                } else if (param[0] === "oauth_verifier") {
                    ipcRenderer.send("getAccessToken", param[1]);
                }
            });
        }
    });
}

// Receive event.
ipcRenderer.on("loadUrl", function (event, url) {
    var webView = document.getElementById("web-view");
    webView.src = url
});