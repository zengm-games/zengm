# Make this have a responsive GUI, then work it into game_sim.py

# http://mattgwwalker.wordpress.com/2011/02/08/progress-bars-in-pythons-pygtk/ - do something like this... run simulations in a thread, and multiprocessing within that thread. Then the UI might stay responsive?

import gtk
from multiprocessing import Pool
import random
import gobject
import threading
import time

def crap(i):
    for i in xrange(100000):
        random.gauss(0, 1)
#        while gtk.events_pending():
#            gtk.main_iteration(False)

def hello(widget, data=None):
    print "Hello start"
    t0 = time.time()
    pool = Pool(processes=4)
    pool.map(crap, range(16))
    print "Hello end", time.time()-t0

def hello_helper(self, widget, data=None):
    print "starting new thread"
    threading.Thread(target=hello, args=(widget, data)).start()

window = gtk.Window(gtk.WINDOW_TOPLEVEL)

window.connect("delete_event", lambda x, y: False)
window.connect("destroy", gtk.main_quit)

vbox = gtk.VBox()

button = gtk.Button("Hello World")
button.connect("clicked", hello_helper, None)
vbox.add(button)

adjustment = gtk.Adjustment(0.0, 0.0, 101.0, 0.1, 1.0, 1.0)
hscale = gtk.HScale(adjustment)
vbox.add(hscale)

window.add(vbox)

window.show_all()

gtk.gdk.threads_init()
gtk.gdk.threads_enter()
gtk.main()
gtk.gdk.threads_leave()
