import gtk
import os
import sqlite3

from bbgm import common
from bbgm.util import resources


class TeamStatsTab:
    updated = False
    built = False
    combobox_season_active = 0

    def on_combobox_season_changed(self, combobox, data=None):
        old = self.combobox_season_active
        self.combobox_season_active = combobox.get_active()
        if self.combobox_season_active != old:
            self.update()

    def build(self):
        if common.DEBUG:
            print 'build team_stats_tab'

        column_types = [int, str, int, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        column_info = [['Team', 'GP',  'W',   'L',   'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG', 'OPPG'],
                       [1,      2,     3,     4,     5,     6,     7,     8,     9,     10,    11,    12,    13,    14,    15,      16,    17,    18,   19,    20,    21,   22,    23],
                       [True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True],
                       [False,  False, False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True]]
        common.treeview_build_new(self.treeview_team_stats, column_types, column_info)

        self.mw.notebook.insert_page(self.vbox7, gtk.Label('Team Stats'), self.mw.pages['team_stats'])

        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update team_stats_tab'

        season = self.mw.make_season_combobox(self.combobox_season, self.combobox_season_active)

        query_ids = 'SELECT team_id FROM team_attributes WHERE season = ?'
        params_ids = [season]
        query_row = 'SELECT team_attributes.team_id, team_attributes.abbreviation, COUNT(*), SUM(team_stats.won), COUNT(*)-SUM(team_stats.won), AVG(team_stats.field_goals_made), AVG(team_stats.field_goals_attempted), AVG(100*team_stats.field_goals_made/team_stats.field_goals_attempted), AVG(team_stats.three_pointers_made), AVG(team_stats.three_pointers_attempted), AVG(100*team_stats.three_pointers_made/team_stats.three_pointers_attempted), AVG(team_stats.free_throws_made), AVG(team_stats.free_throws_attempted), AVG(100*team_stats.free_throws_made/team_stats.free_throws_attempted), AVG(team_stats.offensive_rebounds), AVG(team_stats.defensive_rebounds), AVG(team_stats.offensive_rebounds + team_stats.defensive_rebounds), AVG(team_stats.assists), AVG(team_stats.turnovers), AVG(team_stats.steals), AVG(team_stats.blocks), AVG(team_stats.personal_fouls), AVG(team_stats.points), AVG(team_stats.opponent_points) FROM team_attributes, team_stats WHERE team_attributes.team_id = ? AND team_attributes.team_id = team_stats.team_id AND team_attributes.season = team_stats.season AND team_stats.season = ? AND team_stats.is_playoffs = 0'
        params_row = [-1, season]
        query_row_alt = 'SELECT team_attributes.team_id, team_attributes.abbreviation, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM team_attributes WHERE team_attributes.team_id = ? AND team_attributes.season = ?'
        params_row_alt = [-1, season]

        common.treeview_update_new(self.treeview_team_stats, query_ids, params_ids, query_row, params_row, query_row_alt, params_row_alt)

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'team_stats_tab.ui'))

        self.vbox7 = self.builder.get_object('vbox7')
        self.treeview_team_stats = self.builder.get_object('treeview_team_stats')
        self.combobox_season = self.builder.get_object('combobox_season')

        self.builder.connect_signals(self)

#        self.build()
