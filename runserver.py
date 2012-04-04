import bbgm
bbgm.app.run()

#from gevent.wsgi import WSGIServer
#from bbgm import app
#http_server = WSGIServer(('', 5000), app)
#http_server.serve_forever()

#from tornado.wsgi import WSGIContainer
#from tornado.httpserver import HTTPServer
#from tornado.ioloop import IOLoop
#from bbgm import app
#http_server = HTTPServer(WSGIContainer(app))
#http_server.listen(5000)
#IOLoop.instance().start()

