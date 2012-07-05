import web

urls = (
    '/(css/.*)', 'static',
    '/(ico/.*)', 'static',
    '/(img/.*)', 'static',
    '/(js/.*)', 'static',
    '/(templates/.*)', 'static',
    '/test', 'test',
    '/.*', 'index'
)
app = web.application(urls, globals())


class static:
    def GET(self, filename):
        if filename.endswith('.css'):
            web.header('Content-type', 'text/css')
        elif filename.endswith('.js'):
            web.header('Content-type', 'text/javascript')

        f = open(filename)
        return f.read()


class index:
    def GET(self):
        f = open('index.html')
        return f.read()


class test:
    def GET(self):
        f = open('test.html')
        return f.read()


if __name__ == "__main__":
    app.run()
