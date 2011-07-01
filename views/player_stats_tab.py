import gtk
import sqlite3

import common

class PlayerStatsTab:
    updated = False
    built = False
    combobox_season_active = 0
    combobox_team_active = common.PLAYER_TEAM_ID+1

    def on_combobox_season_changed(self, combobox, data=None):
        old = self.combobox_season_active
        self.combobox_season_active = combobox.get_active()
        if self.combobox_season_active != old:
            self.update()

    def on_combobox_team_changed(self, combobox, data=None):
        old = self.combobox_team_active
        self.combobox_team_active = combobox.get_active()
        if self.combobox_team_active != old:
            self.update()

    def on_treeview_player_stats_row_activated(self, treeview, path, view_column, data=None):
        self.mw.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build(self):
        print 'build player stats'
        column_info = [['Name', 'Team', 'GP',  'GS',  'Min', 'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG'],
                       [2,      3,      4,     5,     6,     7,     8,     9,     10,    11,    12,    13,    14,    15,    16,     17,     18,    19,    20,   21,    22,    23,   24],
                       [True,   True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True],
                       [False,  False,  False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True]]
        common.treeview_build(self.treeview_player_stats, column_info)

        column_types = [int, int, str, str, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        self.liststore_player_stats = gtk.ListStore(*column_types)
        self.treeview_player_stats.set_model(self.liststore_player_stats)

        self.mw.notebook.insert_page(self.vbox6, gtk.Label('Player Stats'), self.mw.pages['player_stats'])

        self.built = True

    def update(self):
        print 'update player stats'
        season = self.mw.make_season_combobox(self.combobox_season, self.combobox_season_active)
        team_id = self.mw.make_team_combobox(self.combobox_team, self.combobox_team_active, season, True)

        if team_id == 666:
            all_teams = 1
        else:
            all_teams = 0

#        column_types = [int, int, str, str, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
#        query = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), SUM(player_stats.minutes>0), SUM(player_stats.starter), AVG(player_stats.minutes), AVG(player_stats.field_goals_made), AVG(player_stats.field_goals_attempted), AVG(100*player_stats.field_goals_made/player_stats.field_goals_attempted), AVG(player_stats.three_pointers_made), AVG(player_stats.three_pointers_attempted), AVG(100*player_stats.three_pointers_made/player_stats.three_pointers_attempted), AVG(player_stats.free_throws_made), AVG(player_stats.free_throws_attempted), AVG(100*player_stats.free_throws_made/player_stats.free_throws_attempted), AVG(player_stats.offensive_rebounds), AVG(player_stats.defensive_rebounds), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists), AVG(player_stats.turnovers), AVG(player_stats.steals), AVG(player_stats.blocks), AVG(player_stats.personal_fouls), AVG(player_stats.points) FROM player_attributes, player_stats WHERE player_attributes.player_id = player_stats.player_id AND player_stats.season = ? AND player_stats.is_playoffs = 0 AND (player_attributes.team_id = ? OR ?) GROUP BY player_attributes.player_id'
#        common.treeview_update(self.treeview_player_stats, column_types, query, (season, team_id, all_teams))
        query_ids = 'SELECT player_id FROM player_attributes WHERE team_id = ? OR ?'
        params_ids = [team_id, all_teams]
        query_row = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, team_attributes.abbreviation, SUM(player_stats.minutes>0), SUM(player_stats.starter), AVG(player_stats.minutes), AVG(player_stats.field_goals_made), AVG(player_stats.field_goals_attempted), AVG(100*player_stats.field_goals_made/player_stats.field_goals_attempted), AVG(player_stats.three_pointers_made), AVG(player_stats.three_pointers_attempted), AVG(100*player_stats.three_pointers_made/player_stats.three_pointers_attempted), AVG(player_stats.free_throws_made), AVG(player_stats.free_throws_attempted), AVG(100*player_stats.free_throws_made/player_stats.free_throws_attempted), AVG(player_stats.offensive_rebounds), AVG(player_stats.defensive_rebounds), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists), AVG(player_stats.turnovers), AVG(player_stats.steals), AVG(player_stats.blocks), AVG(player_stats.personal_fouls), AVG(player_stats.points) FROM player_attributes, player_stats, team_attributes WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_stats.player_id AND player_stats.season = ? AND player_stats.is_playoffs = 0 AND team_attributes.team_id = player_attributes.team_id AND team_attributes.season = player_stats.season GROUP BY player_attributes.player_id'
        params_row = [-1, season]
        query_row_alt = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, team_attributes.abbreviation, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM player_attributes, team_attributes WHERE player_attributes.player_id = ? AND team_attributes.team_id = player_attributes.team_id AND team_attributes.season = ?'
        params_row_alt = [-1, season]

        common.treeview_update_new(self.treeview_player_stats, query_ids, params_ids, query_row, params_row, query_row_alt, params_row_alt)

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file('ui/player_stats_tab.glade')

        self.vbox6 = self.builder.get_object('vbox6')
        self.treeview_player_stats = self.builder.get_object('treeview_player_stats')
        self.combobox_season = self.builder.get_object('combobox_season')
        self.combobox_team = self.builder.get_object('combobox_team')


        self.builder.connect_signals(self)

#        self.build()

