import gtk

from bbgm import common
from bbgm.util import resources
from bbgm.views import contract_window


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
            # Only check the roster size here, not the payroll, because
            # presumably a player could be negotiated down to a minimum salary
            num_players_on_roster, = common.DB_CON.execute('SELECT COUNT(*) FROM player_attributes WHERE team_id = ?',
                                                           (common.PLAYER_TEAM_ID,)).fetchone()
            if num_players_on_roster >= 15:
                dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, ('Your roster is full. '
                                           'Before you can sign a free agent, you\'ll have to buy out or release one '
                                           'of your current players.'))
                dialog.run()
                dialog.destroy()
            else:
                player_id = treemodel.get_value(treeiter, 0)
                cw = contract_window.ContractWindow(self.main_window, player_id)
                response = cw.contract_window.run()
                # CLOSE = cancel/release; DELETE_EVENT = escape/X-button
                if response != int(gtk.RESPONSE_CLOSE) and response != int(gtk.RESPONSE_DELETE_EVENT):
                    self.main_window.update_all_pages()
                cw.contract_window.destroy()

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build_free_agents(self):
        column_types = [int, str, str, int, int, int, float, float, float, float, str]
        column_info = [['Name', 'Position', 'Age', 'Ovr', 'Pot', 'Min', 'Pts', 'Reb', 'Ast', 'Asking for'],
                       [1,      2,          3,     4,     5,     6,     7,     8,     9,     10],
                       [True,   True,       True,  True,  True,  True,  True,  True,  True,  True],
                       [False,  False,      False, False, False, True,  True,  True,  True,  False]]
        tooltips = ['', '', '', 'Overall Rating', 'Potential Rating', 'Minutes', 'Points', 'Rebounds', 'Assists', '']
        common.treeview_build_new(self.treeview_free_agents, column_types, column_info, tooltips)

        liststore = self.treeview_free_agents.get_model()
        liststore.set_sort_column_id(4, gtk.SORT_DESCENDING)

    def update_free_agents(self):
        if common.DEBUG:
            print 'update free_agents_window'

        # Display (in order of preference) stats from this year, stats from last year, or nothing
        query_ids = ('SELECT player_attributes.player_id FROM player_attributes, player_ratings WHERE '
                     'player_attributes.team_id = -1 AND player_attributes.player_id = player_ratings.player_id')
        params_ids = []
        query_row = ('SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, %d - '
                     'player_attributes.born_date, player_ratings.overall, player_ratings.potential, '
                     'AVG(player_stats.minutes), AVG(player_stats.points), AVG(player_stats.offensive_rebounds + '
                     'player_stats.defensive_rebounds), AVG(player_stats.assists), "$" || '
                     'round(contract_amount/1000.0, 2) || "M thru " || contract_expiration FROM player_attributes, '
                     'player_ratings, player_stats WHERE player_attributes.player_id = ? AND '
                     'player_attributes.player_id = player_ratings.player_id AND player_stats.player_id = '
                     'player_ratings.player_id AND player_stats.season = ?' % common.SEASON)
        params_row = [-1, common.SEASON]
        params_row_alt = [-1, common.SEASON - 1]
        query_row_alt_2 = ('SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, %d '
                           '- player_attributes.born_date, player_ratings.overall, player_ratings.potential, 0, 0, 0, '
                           '0, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration FROM '
                           'player_attributes, player_ratings WHERE player_attributes.player_id = ? AND '
                           'player_attributes.player_id = player_ratings.player_id' % common.SEASON)
        params_row_alt_2 = [-1]

        common.treeview_update_new(self.treeview_free_agents, query_ids, params_ids, query_row, params_row, query_row,
                                   params_row_alt, query_row_alt_2, params_row_alt_2)

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['free_agents_window'])

        self.free_agents_window = self.builder.get_object('free_agents_window')
        self.treeview_free_agents = self.builder.get_object('treeview_free_agents')

        self.builder.connect_signals(self)

        self.build_free_agents()
        self.update_free_agents()

        self.free_agents_window.show()
