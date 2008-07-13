import sys
import gtk
import pango
import random
import sqlite3

import common

class RetiredPlayersWindow:
    def on_retired_players_window_close(self, widget, data=None):
        self.retired_players_window.hide()
        return True

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 

        self.retired_players_window = self.builder.get_object('retired_players_window')
        self.treeview_retired_players = self.builder.get_object('treeview_retired_players')

        self.builder.connect_signals(self)

        # Players meeting one of these cutoffs might retire:
        min_potential = 40
        max_age = 34

        # Build treeview
        column_info = [['Name', 'Team', 'Age', 'Overall'],
                        [1,      2,      3,     4],
                        [True,   True,   True,  True],
                        [False,  False,  False, True]]
        common.treeview_build(self.treeview_retired_players, column_info)

        # Update treeview
        liststore = gtk.ListStore(int, str, str, int, int)
        self.treeview_retired_players.set_model(liststore)

        query = "SELECT player_ratings.player_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), ROUND((julianday('%d-06-01') - julianday(born_date))/365.25), player_ratings.overall, player_ratings.potential FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND (player_ratings.potential < ? OR ROUND((julianday('%d-06-01') - julianday(born_date))/365.25) > ?) ORDER BY player_ratings.overall DESC" % (common.SEASON, common.SEASON)
        for row in common.DB_CON.execute(query, (min_potential, max_age)):
            player_id, name, team, age, overall, potential = row
            if team == None:
                team = 'FA'
            overall = int(overall)
            age_excess = 0
            if age > 34:
                age_excess = (age - 34) / 20.0 # 0.05 for each year beyond 34
            potential_excess = (40 - potential) / 50.0 # 0.02 for each potential rating below 40 (this can be negative)
            r = (age_excess + potential_excess) + random.gauss(0, 1)
            print player_id, name, team, age, overall, potential
            print age_excess, potential_excess, r
            if r > 0:
                common.DB_CON.execute('UPDATE player_attributes SET team_id = -3 WHERE player_id = ?', (player_id,))
                liststore.append([player_id, name, team, age, overall])

        self.retired_players_window.show()

