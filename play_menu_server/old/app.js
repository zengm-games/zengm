var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(1337);

var league_id = 7
var season = 2012
var mysql = require('mysql');
var db = mysql.createClient({
  user: 'testuser',
  password: 'test623',
});
db.query('USE bbgm');
db.query(
  'SELECT pm_status, pm_options, pm_status_t, pm_options_t FROM ?_game_attributes WHERE season = ?', [league_id, season],
  function selectCb(err, results, fields) {
    if (err) {
      throw err;
    }
    console.log(results);
    db.end();
  }
);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  socket.on('message', function () { console.log('message arrived'); });
  socket.on('disconnect', function () { console.log('disconnected'); });
});
