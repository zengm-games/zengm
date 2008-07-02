# This file implements the main window GUI

import sys
import gtk
import pango
import bz2
import os
import random
import sqlite3
import shutil
import time

import common
import main_window

class WelcomeDialog:
    def on_button_new_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        self.mw.main_window.show()
        result, team_id = self.mw.new_game_dialog()
        if result == gtk.RESPONSE_OK and team_id >= 0:
            self.mw.new_game(team_id)
            self.mw.unsaved_changes = True
        else:
            self.mw.main_window.hide()
            self.welcome_dialog.show()

    def on_button_open_clicked(self, button, data=None):
        self.welcome_dialog.hide()
        self.mw.main_window.show()
        result = self.mw.open_game_dialog()
        if result:
            self.mw.open_game(result)
        else:
            self.mw.main_window.hide()
            self.welcome_dialog.show()

    def on_button_quit_clicked(self, button, data=None):
        gtk.main_quit()

    def on_welcome_dialog_delete_event(self, widget, data=None):
        gtk.main_quit()

    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        
        self.welcome_dialog = self.builder.get_object('welcome_dialog')

        self.mw = main_window.MainWindow()

        self.builder.connect_signals(self)

        self.welcome_dialog.show()

if __name__ == '__main__':
    wd = WelcomeDialog()
    gtk.main()

