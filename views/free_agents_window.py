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
        column_types = [int, str, str, int, int, int, float, float, float, float]
        column_info = [['Name', 'Position', 'Age', 'Rating', 'Potential', 'Min', 'Pts', 'Reb', 'Ast'],
                       [1,      2,          3,     4,        5,           6,     7,     8,     9],
                       [True,   True,       True,  True,     True,        True,  True,  True,  True],
                       [False,  False,      False, False,    False,       True,  True,  True,  True]]
        common.treeview_build_new(self.treeview_free_agents, column_types, column_info)

    def update_free_agents(self):
        print 'ufa'

        # Display (in order of preference) stats from this year, stats from last year, or nothing
        query_ids = 'SELECT player_attributes.player_id FROM player_attributes, player_ratings WHERE player_attributes.team_id = -1 AND player_attributes.player_id = player_ratings.player_id ORDER BY player_ratings.overall DESC'
        params_ids = []
        query_row = "SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday('%s-06-01') - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, AVG(player_stats.minutes), AVG(player_stats.points), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists) FROM player_attributes, player_ratings, player_stats WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_ratings.player_id AND player_stats.player_id = player_ratings.player_id AND player_stats.season = ?" % common.SEASON
        params_row = [-1, common.SEASON]
        params_row_alt = [-1, common.SEASON-1]
        query_row_alt_2 = "SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday('%s-06-01') - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, 0, 0, 0, 0 FROM player_attributes, player_ratings WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_ratings.player_id" % common.SEASON
        params_row_alt_2 = [-1]

        common.treeview_update_new(self.treeview_free_agents, query_ids, params_ids, query_row, params_row, query_row, params_row_alt, query_row_alt_2, params_row_alt_2)

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['free_agents_window'])

        self.free_agents_window = self.builder.get_object('free_agents_window')
        self.treeview_free_agents = self.builder.get_object('treeview_free_agents')

        self.builder.connect_signals(self)

        self.build_free_agents()
        self.update_free_agents()

        self.free_agents_window.show()

