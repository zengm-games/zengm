import gtk
import sqlite3

import common

class SeasonEndWindow:
    def on_season_end_window_close(self, widget, data=None):
        self.season_end_window.hide()
        return True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['season_end_window'])

        self.season_end_window = self.builder.get_object('season_end_window')
        label_season_end_1 = self.builder.get_object('label_season_end_1')
        label_season_end_2 = self.builder.get_object('label_season_end_2')
        label_season_end_3 = self.builder.get_object('label_season_end_3')
        label_season_end_4 = self.builder.get_object('label_season_end_4')

        self.builder.connect_signals(self)

        self.season_end_window.set_transient_for(self.mw.main_window)
        
        self.season_end_window.set_title('%d Season Awards' % common.SEASON)

        best_record_0 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 0 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()
        best_record_1 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 1 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()        

        smoy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.minutes), AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? AND ps.minutes < 25 GROUP BY ps.player_id ORDER BY SUM( (0.75 * ps.points) + ps.assists + ps.offensive_rebounds + ps.defensive_rebounds) DESC' , (common.SEASON,)).fetchone()

        mvp =  common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG( (0.75 * ps.points) + ps.assists + ps.offensive_rebounds + ps.defensive_rebounds ) DESC', (common.SEASON,)).fetchone()

        roy =  common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND pa.draft_year = (ps.season - 1) AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG( (0.75 * ps.points) + ps.assists + ps.offensive_rebounds + ps.defensive_rebounds ) DESC', (common.SEASON,)).fetchone()

        dpoy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.blocks), AVG(ps.steals) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?  GROUP BY ps.player_id ORDER BY AVG( ps.defensive_rebounds + (3*ps.blocks) + (3*ps.steals)) DESC ', (common.SEASON,)).fetchone()

        ipoy = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, pa.born_location, AVG(ps.points), AVG(ps.offensive_rebounds + ps.defensive_rebounds), AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND pa.born_location is not "Usa" AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG( (0.75 * ps.points) + ps.assists + ps.offensive_rebounds + ps.defensive_rebounds ) DESC', (common.SEASON,)).fetchone()

        firstteam =  common.DB_CON.execute('SELECT pa.name, ta.abbreviation FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG( (0.75 * ps.points) + ps.assists + ps.offensive_rebounds + ps.defensive_rebounds ) DESC', (common.SEASON,)).fetchmany(15)

        defteam = common.DB_CON.execute('SELECT pa.name, ta.abbreviation FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ?  GROUP BY ps.player_id ORDER BY AVG( ps.defensive_rebounds + (3*ps.blocks) + (3*ps.steals)) DESC ', (common.SEASON,)).fetchmany(15)

        most_points = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.points) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG(ps.points) DESC', (common.SEASON,)).fetchone()

        highest_points = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, MAX(ps.points) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY MAX(ps.points) DESC', (common.SEASON,)).fetchone()

        most_rebounds = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.offensive_rebounds + ps.defensive_rebounds) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG(ps.offensive_rebounds + ps.defensive_rebounds) DESC', (common.SEASON,)).fetchone()

        highest_rebounds = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, MAX(ps.offensive_rebounds + ps.defensive_rebounds) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY MAX(ps.offensive_rebounds + ps.defensive_rebounds) DESC', (common.SEASON,)).fetchone()

        most_assists = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG(ps.assists) DESC', (common.SEASON,)).fetchone()

        highest_assists = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, MAX(ps.assists) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY MAX(ps.assists) DESC', (common.SEASON,)).fetchone()

        most_steals = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.steals) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG(ps.steals) DESC', (common.SEASON,)).fetchone()

        highest_steals = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, MAX(ps.steals) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY MAX(ps.steals) DESC', (common.SEASON,)).fetchone()

        most_blocks = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, AVG(ps.blocks) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY AVG(ps.blocks) DESC', (common.SEASON,)).fetchone()

        highest_blocks = common.DB_CON.execute('SELECT pa.name, ta.abbreviation, MAX(ps.blocks) FROM player_attributes as pa, player_stats as ps, team_attributes as ta WHERE pa.player_id = ps.player_id AND ta.team_id = pa.team_id AND ta.season = ps.season AND ps.season = ? GROUP BY ps.player_id ORDER BY MAX(ps.blocks) DESC', (common.SEASON,)).fetchone()

        label_season_end_1.set_markup('<b>Best Record</b>\nEast: %s (%d-%d)\nWest: %s (%d-%d)\n\n<b>Most Valuable Player</b>\n%s (%s)\n%.1f pts, %.1f rebs, %.1f asts\n\n<b>Defensive Player of the Year</b>\n%s (%s)\n%.1f rebs, %.1f blks, %.1f stls\n\n<b>Sixth Man of the Year</b>\n%s (%s)\n%.1f min, %.1f pts, %.1f rebs, %.1f asts\n\n<b>Rookie of the Year</b>\n%s (%s)\n%.1f pts,%.1f rebs,%.1f asts\n\n<b>Best International Player</b>\n%s (%s - %s)\n%.1f pts,%.1f rebs,%.1f asts' % tuple(best_record_0 + best_record_1 + mvp + dpoy + smoy + roy + ipoy))
    
        label_season_end_2.set_markup('<b>All League Team</b>\n<u>First Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Second Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Third Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)' % tuple(firstteam[0] + firstteam[1] + firstteam[2] + firstteam[3] + firstteam[4] + firstteam[5] + firstteam[6] + firstteam[7] + firstteam[8] + firstteam[9] + firstteam[10] + firstteam[11] + firstteam[12] + firstteam[13] + firstteam[14]))

        label_season_end_3.set_markup('<b>All Defensive Team</b>\n<u>First Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Second Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Third Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)' % tuple(defteam[0] + defteam[1] + defteam[2] + defteam[3] + defteam[4] + defteam[5] + defteam[6] + defteam[7] + defteam[8] + defteam[9] + defteam[10] + defteam[11] + defteam[12] + defteam[13] + defteam[14]))

        label_season_end_4.set_markup('<b>Season Records</b>\n<u>Points</u>\nAvg: %s (%s) - %.1f pts\nMost: %s (%s) - %.1f pts\n\n<u>Rebounds</u>\nAvg: %s (%s) - %.1f rebs\nMost: %s (%s) - %1.f rebs\n\n<u>Assists</u>\nAvg: %s (%s) - %.1f asts\nMost: %s (%s) - %1.f asts\n\n<u>Steals</u>\nAvg: %s (%s) - %.1f stls\nMost: %s (%s) - %1.f stls\n\n<u>Blocks</u>\nAvg: %s (%s) - %.1f blks\nMost: %s (%s) - %1.f blks' % tuple(most_points + highest_points + most_rebounds + highest_rebounds + most_assists + highest_assists + most_steals + highest_steals + most_blocks + highest_blocks))
