const express = require("express");
const path = require("path");

const app = express();

const options = {
    root: path.join(__dirname, "..")
};

const showStatic = (req, res) => {
    res.sendFile(req.url.substr(1), options);
};
const showStaticWithHtml = (req, res) => {
    res.sendFile(req.url.substr(1) + ".html", options);
};
const showIndex = (req, res) => {
    res.sendFile("index.html", options);
};

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
app.get("/node_modules/*", showStatic);
app.get("/templates/*", showStatic);

app.get("/*", showIndex);

const server = app.listen(3000, () => {
    const address = server.address();

    console.log("View Basketball GM at http://%s:%s", address.address, address.port);
});
