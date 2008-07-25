import sys
import gtk
import pango
import mx.DateTime
import sqlite3

import common

class TradeWindow:
    def on_trade_window_close(self, widget, data=None):
        self.trade_window.hide()
        return True

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        self.trade_window = self.builder.get_object('trade_window')
        self.trade_window.set_transient_for(self.main_window.main_window)

        self.builder.connect_signals(self)

        self.trade_window.show()

