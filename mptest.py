# Make this have a responsive GUI, then work it into game_sim.py

# http://mattgwwalker.wordpress.com/2011/02/08/progress-bars-in-pythons-pygtk/

# http://lazypython.blogspot.com/2008/11/pygtk-and-multiprocessing.html

import gtk
from multiprocessing import Pool
import random

def crap(i):
    for i in xrange(300000):
        random.gauss(0, 1)

def hello(widget, data=None):
    pool = Pool(processes=4)
    pool.map(crap, range(16))

window = gtk.Window(gtk.WINDOW_TOPLEVEL)

window.connect("delete_event", lambda x: False)
window.connect("destroy", gtk.main_quit)

button = gtk.Button("Hello World")
button.connect("clicked", hello, None)
window.add(button)
button.show()

window.show()

gtk.main()

