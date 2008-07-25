import sys
import gtk
import pango
import sqlite3

import common

class SeasonEndWindow:
    def on_season_end_window_close(self, widget, data=None):
        self.season_end_window.hide()
        return True

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 

        self.season_end_window = self.builder.get_object('season_end_window')
        label_season_end_1 = self.builder.get_object('label_season_end_1')

        self.builder.connect_signals(self)

        self.season_end_window.set_title('%d Season Awards' % common.SEASON)

        best_record_0 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 0 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()
        best_record_1 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 1 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()
        #mvp = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?', (common.SEASON,)).fetchone()
        #dpoy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.blocks), AVG(ps.steals) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?', (common.SEASON,)).fetchone()
        #smoy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?', (common.SEASON,)).fetchone()
        #roy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?', (common.SEASON,)).fetchone()

        #label_season_end_1.set_markup('<b>Best Record</b>\nEastern Conference:\n%s (%d-%d)\nWestern Conference:\n%s (%d-%d)\n\n<b>Most Valuable Player</b>\n%s (%s)\n%.1f pts, %.1f rebs, %.1f asts\n\n<b>Defensive Player of the Year</b>\n%s (%s)\n%.1f rebs, %.1f blks, %.1f stls\n\n<b>Sixth Man of the Year</b>\n%s (%s)\n%.1f pts, %.1f rebs, %.1f asts\n\n<b>Rookie of the Year</b>\n%s (%s)\n%.1f pts, %.1f rebs, %.1f asts' % tuple(best_record_0 + best_record_1 + mvp + dpoy + smoy + roy))

        label_season_end_1.set_markup('<b>Best Record</b>\nEastern Conference:\n%s (%d-%d)\nWestern Conference:\n%s (%d-%d)\n\n<b>Most Valuable Player</b>\nPlaceholder (???)\n? pts, ? rebs, ? asts\n\n<b>Defensive Player of the Year</b>\nPlaceholder (???)\n? rebs, ? blks, ? stls\n\n<b>Sixth Man of the Year</b>\nPlaceholder (???)\n? pts, ? rebs, ? asts\n\n<b>Rookie of the Year</b>\nPlaceholder (???)\n? pts, ? rebs, ? asts' % tuple(best_record_0 + best_record_1))

