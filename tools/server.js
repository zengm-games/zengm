var express = require("express");
var path = require("path");

var app = express();

var options = {
    root: path.join(__dirname, "..")
};

function showStatic(req, res) {
    res.sendFile(req.url.substr(1), options);
}
function showStaticWithHtml(req, res) {
    res.sendFile(req.url.substr(1) + ".html", options);
}
function showIndex(req, res) {
    res.sendFile("index.html", options);
}

app.get("/export_3.3", showStaticWithHtml);
app.get("/manifest_hack", showStaticWithHtml);
app.get("/test*", showStaticWithHtml);
app.get("/test_case*", showStaticWithHtml);

app.get("/css/*", showStatic);
app.get("/data/*", showStatic);
app.get("/docs/*", showStatic);
app.get("/fonts/*", showStatic);
app.get("/gen/*", showStatic);
app.get("/ico/*", showStatic);
app.get("/img/*", showStatic);
app.get("/js/*", showStatic);
app.get("/templates/*", showStatic);

app.get("/*", showIndex);

var server = app.listen(3000, function () {
    var address = server.address();

    console.log("View Basketball GM at http://%s:%s", address.address, address.port);
});
