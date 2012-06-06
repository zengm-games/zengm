import web

urls = (
    '/(css/.*)', 'static',
    '/(ico/.*)', 'static',
    '/(img/.*)', 'static',
    '/(js/.*)', 'static',
    '/(templates/.*)', 'static',
    '/.*', 'index'
)
app = web.application(urls, globals())

class static:
    def GET(self, filename):
        f = open(filename)
        return f.read()

class index:        
    def GET(self):
        f = open('index.html')
        return f.read()

if __name__ == "__main__":
    app.run()

