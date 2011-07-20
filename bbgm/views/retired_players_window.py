import gtk
import random
import sqlite3

from bbgm import common
from bbgm.util import resources


class RetiredPlayersWindow:
    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['retired_players_window'])

        self.retired_players_window = self.builder.get_object('retired_players_window')
        self.treeview_retired_players = self.builder.get_object('treeview_retired_players')

        self.builder.connect_signals(self)

        self.retired_players_window.set_transient_for(self.main_window.main_window)

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

        query = "SELECT player_ratings.player_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), %d - player_attributes.born_date, player_ratings.overall, player_ratings.potential, player_attributes.team_id FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND (player_ratings.potential < ? OR (%d - player_attributes.born_date) > ?) AND player_attributes.team_id != -3 ORDER BY player_ratings.overall DESC" % (common.SEASON, common.SEASON)
        for row in common.DB_CON.execute(query, (min_potential, max_age)):
            player_id, name, team, age, overall, potential, team_id = row
            if team == None:
                team = 'FA'
            overall = int(overall)
            age_excess = 0
            if age > 34 or team == 'FA':  # Only players older than 34 or without a contract will retire
                if age > 34:
                    age_excess = (age - 34) / 20.0  # 0.05 for each year beyond 34
                potential_excess = (40 - potential) / 50.0  # 0.02 for each potential rating below 40 (this can be negative)
                r = (age_excess + potential_excess) + random.gauss(0, 1)
                if r > 0:
                    common.DB_CON.execute('UPDATE player_attributes SET team_id = -3 WHERE player_id = ?', (player_id,))
                    liststore.append([player_id, name, team, age, overall])

        # Update "free agent years" counter and retire players who have been free agents for more than one years
        query = "SELECT player_ratings.player_id, player_attributes.name, 'FA', %d - player_attributes.born_date, player_ratings.overall, player_ratings.potential FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND years_free_agent >= 1 AND team_id = -1 ORDER BY player_ratings.overall DESC" % (common.SEASON)
        for row in common.DB_CON.execute(query):
            player_id, name, team, age, overall, potential = row
            overall = int(overall)
            common.DB_CON.execute('UPDATE player_attributes SET team_id = -3 WHERE player_id = ?', (player_id,))
            liststore.append([player_id, name, team, age, overall])
        common.DB_CON.execute('UPDATE player_attributes SET years_free_agent = years_free_agent + 1 WHERE team_id = -1')
        common.DB_CON.execute('UPDATE player_attributes SET years_free_agent = 0 WHERE team_id >= 0')
