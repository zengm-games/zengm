import gtk
import os
import sqlite3

from bbgm import common
from bbgm.util import resources


class PlayerRatingsTab:
    updated = False
    built = False
    combobox_team_active = common.PLAYER_TEAM_ID + 1

    def on_combobox_team_changed(self, combobox, data=None):
        old = self.combobox_team_active
        self.combobox_team_active = combobox.get_active()
        if self.combobox_team_active != old:
            self.update()

    def on_treeview_player_ratings_row_activated(self, treeview, path, view_column, data=None):
        self.mw.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build(self):
        if common.DEBUG:
            print 'build player_ratings_tab'

        column_types = [int, int, str, str, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int]
        column_info = [['Name', 'Team', 'Age', 'Ovr', 'Pot', 'Hgt', 'Str', 'Spd', 'Jmp', 'End', 'Ins', 'Dnk', 'FT', '2pt', '3pt', 'Blk', 'Stl', 'Drb', 'Pss', 'Reb'],
                       [2,      3,      4,     5,         6,        7,         8,       9,         10,          11,               12,       13,            14,             15,               16,       17,       18,          19,        20,        21],
                       [True,   True,   True,  True,      True,     True,      True,    True,      True,        True,             True,     True,          True,           True,             True,     True,     True,        True,      True,      True],
                       [False,  False,  False, False,     False,    False,     False,   False,     False,       False,            False,    False,         False,          False,            False,    False,    False,       False,     False,     False]]
        tooltips = ['', '', '', 'Overall', 'Potential', 'Height', 'Stength', 'Speed', 'Jumping', 'Endurance', 'Inside Scoring', 'Dunks/Layups', 'Free Throw Shooting', 'Two-Point Shooting', 'Three-Point Shooting', 'Blocks', 'Steals', 'Dribbling', 'Passing', 'Rebounding']
        common.treeview_build_new(self.treeview_player_ratings, column_types, column_info, tooltips)

        self.mw.notebook.insert_page(self.vbox, gtk.Label('Player Ratings'), self.mw.pages['player_ratings'])

        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update player_ratings_tab'

        team_id = self.mw.make_team_combobox(self.combobox_team, self.combobox_team_active, common.SEASON, True)

        if team_id == 666:
            all_teams = 1
        else:
            all_teams = 0

        query_ids = 'SELECT player_id FROM player_attributes WHERE team_id = ? OR ?'
        params_ids = [team_id, all_teams]
        query_row = "SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), ROUND((julianday('%s-06-01') - julianday(born_date))/365.25), player_ratings.overall, player_ratings.potential, player_ratings.height, player_ratings.strength, player_ratings.speed, player_ratings.jumping, player_ratings.endurance, player_ratings.shooting_inside, player_ratings.shooting_layups, player_ratings.shooting_free_throws, player_ratings.shooting_two_pointers, player_ratings.shooting_three_pointers, player_ratings.blocks, player_ratings.steals, player_ratings.dribbling, player_ratings.passing, player_ratings.rebounding FROM player_attributes, player_ratings WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_ratings.player_id" % common.SEASON
        params_row = [-1]

        common.treeview_update_new(self.treeview_player_ratings, query_ids, params_ids, query_row, params_row)

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'player_ratings_tab.ui'))

        self.vbox = self.builder.get_object('vbox')
        self.treeview_player_ratings = self.builder.get_object('treeview_player_ratings')
        self.combobox_team = self.builder.get_object('combobox_team')

        self.builder.connect_signals(self)

#        self.build()
