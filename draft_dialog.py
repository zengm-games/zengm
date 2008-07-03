import sys
import gtk
import pango
import mx.DateTime
import random
import sqlite3

import common

class DraftDialog:
    def on_draft_dialog_close(self, widget, data=None):
        if self.done_draft:
            self.draft_dialog.destroy()
        return True

    def on_button_draft_player_clicked(self, button, data=None):
        if self.round == 1:
            self.round = 2
        elif self.round == 2:
            # Replace Draft Player button with stock Close button
            self.button_draft_player.destroy()
            self.button_close = self.draft_dialog.add_button(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
            self.button_close.connect('clicked', self.on_button_close_clicked)

            # Set to True to allow dialog to be closed
            self.done_draft = True

    def on_button_close_clicked(self, button, data=None):
        if self.done_draft:
            self.draft_dialog.destroy()
        return True

    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        self.draft_dialog = self.builder.get_object('draft_dialog')
        self.treeview_draft_available = self.builder.get_object('treeview_draft_available')
        self.treeview_draft_results = self.builder.get_object('treeview_draft_results')

        self.builder.connect_signals(self)

        self.button_draft_player = self.draft_dialog.add_button('_Draft Player', 0)
        self.button_draft_player.connect('clicked', self.on_button_draft_player_clicked)

        self.round = 1
        self.done_draft = False # Dialog can't be closed until this is True

        # Generate 80 players
        # Add them all to the available treeview
        # For team in teams (ordered by worst record):
            # if team_id != common.PLAYER_TEAM_ID:
                # Select player based on overall + 2*potential with some gaussian randomness
            # else:
                # Capture player selection in on_button_draft_player_clicked()
            # Delete player row from available treeview
            # Add player to results treeview (row will already be there, just update it)
            # Update player's team_id and draft_* in player_attributes
            # Replace Draft Player button with stock Close button
#            self.button_draft_player.destroy()
#            self.button_close = self.draft_dialog.add_button(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
#            self.button_close.connect('clicked', self.on_button_close_clicked)
#            # Set to True to allow dialog to be closed
#            self.done_draft = True

        self.draft_dialog.show()

