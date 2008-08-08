import gtk
import mx.DateTime
import sqlite3

import common
import contract_window

class FreeAgentsWindow:
    def on_free_agents_window_close(self, widget, data=None):
        self.free_agents_window.hide()
        return True

    def on_button_free_agents_player_info_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_free_agents.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            self.main_window.on_treeview_player_row_activated(self.treeview_free_agents, path, None, None)

    def on_button_free_agents_sign_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_free_agents.get_selection().get_selected()
        if treeiter:
            player_id = treemodel.get_value(treeiter, 0)
            cw = contract_window.ContractWindow(self.main_window, player_id)
            response = cw.contract_window.run()
            if response != int(gtk.RESPONSE_CLOSE) and response != int(gtk.RESPONSE_DELETE_EVENT): # CLOSE = cancel/release; DELETE_EVENT = escape/X-button
                self.main_window.update_all_pages()
            cw.contract_window.destroy()

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build_free_agents(self):
        column_info = [['Name', 'Position', 'Age', 'Rating', 'Potential'],
                       [1,      2,          3,     4,        5],
                       [True,   True,       True,  True,     True],
                       [False,  False,      False, False,    False]]
        common.treeview_build(self.treeview_free_agents, column_info)

    def update_free_agents(self):
        print 'ufa'
        # free_agents list
        column_types = [int, str, str, int, int, int]
        query = "SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday('%s-06-01') - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = -1 ORDER BY player_ratings.overall DESC" % common.SEASON
        common.treeview_update(self.treeview_free_agents, column_types, query)

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        self.free_agents_window = self.builder.get_object('free_agents_window')
        self.treeview_free_agents = self.builder.get_object('treeview_free_agents')

        self.builder.connect_signals(self)

        self.build_free_agents()
        self.update_free_agents()

        self.free_agents_window.show()

