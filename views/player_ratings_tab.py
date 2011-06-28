import gtk
import sqlite3

import common

class PlayerRatingsTab:
    updated = False
    built = False

    def sss(self, treeview, path, view_column, data=None):
        print 'HIII'
        self.mw.on_treeview_player_row_activated(self, treeview, path, view_column, data)

    def build(self):
        print 'build player ratings'
        column_info = [['Name', 'Team', 'Age', 'Overall', 'Height', 'Stength', 'Speed', 'Jumping', 'Endurance', 'Inside Scoring', 'Layups', 'Free Throws', 'Two Pointers', 'Three Pointers', 'Blocks', 'Steals', 'Dribbling', 'Passing', 'Rebounding'],
                       [2,      3,      4,     5,         6,        7,         8,       9,         10,          11,               12,       13,            14,             15,               16,       17,       18,          19,        20],
                       [True,   True,   True,  True,      True,     True,      True,    True,      True,        True,             True,     True,          True,           True,             True,     True,     True,        True,      True],
                       [False,  False,  False, False,     False,    False,     False,   False,     False,       False,            False,    False,         False,          False,            False,    False,    False,       False,     False]]
        common.treeview_build(self.treeview_player_ratings, column_info)

        self.mw.notebook.insert_page(self.scrolledwindow8, gtk.Label('Player Ratings2'), self.mw.pages['player_ratings'])

        self.built = True

    def update(self):
        print 'update player ratings'
        column_types = [int, int, str, str, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int]
        query = "SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), ROUND((julianday('%s-06-01') - julianday(born_date))/365.25), player_ratings.overall, player_ratings.height, player_ratings.strength, player_ratings.speed, player_ratings.jumping, player_ratings.endurance, player_ratings.shooting_inside, player_ratings.shooting_layups, player_ratings.shooting_free_throws, player_ratings.shooting_two_pointers, player_ratings.shooting_three_pointers, player_ratings.blocks, player_ratings.steals, player_ratings.dribbling, player_ratings.passing, player_ratings.rebounding FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id >= -1" % common.SEASON # team_id >= -1: Don't select draft or retired players
        common.treeview_update(self.treeview_player_ratings, column_types, query)
        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file('ui/player_ratings_tab.glade')

        self.scrolledwindow8 = self.builder.get_object('scrolledwindow8')
        self.treeview_player_ratings = self.builder.get_object('treeview_player_ratings')

        self.builder.connect_signals(self)

#        self.build()
#        self.update()

