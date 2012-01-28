from gi.repository import Gtk

from bbgm import common
from bbgm.util import resources


class SeasonEndWindow:
    def on_season_end_window_close(self, widget, data=None):
        self.season_end_window.hide()
        return True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = Gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['season_end_window'])

        self.season_end_window = self.builder.get_object('season_end_window')
        label_season_end_1 = self.builder.get_object('label_season_end_1')
        label_season_end_2 = self.builder.get_object('label_season_end_2')
        label_season_end_3 = self.builder.get_object('label_season_end_3')
        label_season_end_4 = self.builder.get_object('label_season_end_4')

        self.builder.connect_signals(self)

        self.season_end_window.set_transient_for(self.mw.main_window)

        self.season_end_window.set_title('%d Season Awards' % common.SEASON)

        # Cache averages
        common.DB_CON.execute('CREATE TEMPORARY TABLE awards_avg (name TEXT, abbreviation TEXT, draft_year INTEGER, born_location TEXT, games INTEGER, starter INTEGER, minutes FLOAT, points FLOAT, rebounds FLOAT, assists FLOAT, blocks FLOAT, steals FLOAT)')
        for player_id, in common.DB_CON.execute('SELECT player_id FROM player_attributes WHERE team_id >= 0'):
            common.DB_CON.execute('INSERT INTO awards_avg (name, abbreviation, draft_year, born_location, games, starter, minutes, points, rebounds, assists, blocks, steals) VALUES ((SELECT pa.name FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT ta.abbreviation FROM player_attributes as pa, team_attributes as ta WHERE ta.team_id = pa.team_id AND ta.season = ? AND pa.player_id = ?), (SELECT pa.draft_year FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT pa.born_location FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT COUNT(*) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT SUM(starter) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.minutes) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.points) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.offensive_rebounds + ps.defensive_rebounds) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.assists) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.blocks) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT AVG(ps.steals) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id))', (player_id, common.SEASON, player_id, player_id, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id))

        # Cache maxima
        common.DB_CON.execute('CREATE TEMPORARY TABLE awards_max (name TEXT, abbreviation TEXT, draft_year INTEGER, born_location TEXT, games INTEGER, starter INTEGER, minutes FLOAT, points FLOAT, rebounds FLOAT, assists FLOAT, blocks FLOAT, steals FLOAT)')
        for player_id, in common.DB_CON.execute('SELECT player_id FROM player_attributes WHERE team_id >= 0'):
            common.DB_CON.execute('INSERT INTO awards_max (name, abbreviation, draft_year, born_location, games, starter, minutes, points, rebounds, assists, blocks, steals) VALUES ((SELECT pa.name FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT ta.abbreviation FROM player_attributes as pa, team_attributes as ta WHERE ta.team_id = pa.team_id AND ta.season = ? AND pa.player_id = ?), (SELECT pa.draft_year FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT pa.born_location FROM player_attributes as pa WHERE pa.player_id = ?), (SELECT COUNT(*) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT SUM(starter) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.minutes) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.points) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.offensive_rebounds + ps.defensive_rebounds) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.assists) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.blocks) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id), (SELECT MAX(ps.steals) FROM player_attributes as pa, player_stats as ps WHERE pa.player_id = ps.player_id AND ps.season = ? AND pa.player_id = ? GROUP BY ps.player_id))', (player_id, common.SEASON, player_id, player_id, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id, common.SEASON, player_id))

        best_record_0 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 0 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()
        best_record_1 = common.DB_CON.execute('SELECT region || " " || name, won, lost FROM team_attributes WHERE season = ? AND (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) = 1 ORDER BY won/(won + lost) DESC', (common.SEASON,)).fetchone()

        smoy = common.DB_CON.execute('SELECT name, abbreviation, minutes, points, rebounds, assists FROM awards_avg WHERE starter < 42 ORDER BY (0.75 * points) + assists + rebounds DESC').fetchone()
        mvp = common.DB_CON.execute('SELECT name, abbreviation, points, rebounds, assists FROM awards_avg ORDER BY (0.75 * points) + assists + rebounds DESC').fetchone()
        roy = common.DB_CON.execute('SELECT name, abbreviation, points, rebounds, assists FROM awards_avg WHERE draft_year = ? - 1 ORDER BY (0.75 * points) + assists + rebounds DESC', (common.SEASON,)).fetchone()
        dpoy = common.DB_CON.execute('SELECT name, abbreviation, rebounds, blocks, steals FROM awards_avg ORDER BY rebounds + 5 * blocks + 5 * steals DESC').fetchone()
        ipoy = common.DB_CON.execute('SELECT name, abbreviation, born_location, points, rebounds, assists FROM awards_avg WHERE born_location is not "USA" ORDER BY (0.75 * points) + assists + rebounds DESC').fetchone()
        firstteam = common.DB_CON.execute('SELECT name, abbreviation FROM awards_avg ORDER BY (0.75 * points) + assists + rebounds DESC').fetchmany(15)
        defteam = common.DB_CON.execute('SELECT name, abbreviation FROM awards_avg ORDER BY rebounds + 5 * blocks + 5 * steals DESC').fetchmany(15)
        most_points = common.DB_CON.execute('SELECT name, abbreviation, points FROM awards_avg ORDER BY points DESC').fetchone()
        highest_points = common.DB_CON.execute('SELECT name, abbreviation, points FROM awards_max ORDER BY points DESC').fetchone()
        most_rebounds = common.DB_CON.execute('SELECT name, abbreviation, rebounds FROM awards_avg ORDER BY rebounds DESC').fetchone()
        highest_rebounds = common.DB_CON.execute('SELECT name, abbreviation, rebounds FROM awards_max ORDER BY rebounds DESC').fetchone()
        most_assists = common.DB_CON.execute('SELECT name, abbreviation, assists FROM awards_avg ORDER BY assists DESC').fetchone()
        highest_assists = common.DB_CON.execute('SELECT name, abbreviation, assists FROM awards_max ORDER BY assists DESC').fetchone()
        most_steals = common.DB_CON.execute('SELECT name, abbreviation, steals FROM awards_avg ORDER BY steals DESC').fetchone()
        highest_steals = common.DB_CON.execute('SELECT name, abbreviation, steals FROM awards_max ORDER BY steals DESC').fetchone()
        most_blocks = common.DB_CON.execute('SELECT name, abbreviation, blocks FROM awards_avg ORDER BY blocks DESC').fetchone()
        highest_blocks = common.DB_CON.execute('SELECT name, abbreviation, blocks FROM awards_max ORDER BY blocks DESC').fetchone()

        common.DB_CON.execute('DROP TABLE awards_avg')
        common.DB_CON.execute('DROP TABLE awards_max')

        label_season_end_1.set_markup('<b>Best Record</b>\nEast: %s (%d-%d)\nWest: %s (%d-%d)\n\n<b>Most Valuable Player</b>\n%s (%s)\n%.1f pts, %.1f rebs, %.1f asts\n\n<b>Defensive Player of the Year</b>\n%s (%s)\n%.1f rebs, %.1f blks, %.1f stls\n\n<b>Sixth Man of the Year</b>\n%s (%s)\n%.1f min, %.1f pts, %.1f rebs, %.1f asts\n\n<b>Rookie of the Year</b>\n%s (%s)\n%.1f pts,%.1f rebs,%.1f asts\n\n<b>Best International Player</b>\n%s (%s - %s)\n%.1f pts,%.1f rebs,%.1f asts' % tuple(best_record_0 + best_record_1 + mvp + dpoy + smoy + roy + ipoy))

        label_season_end_2.set_markup('<b>All League Team</b>\n<u>First Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Second Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Third Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)' % tuple(firstteam[0] + firstteam[1] + firstteam[2] + firstteam[3] + firstteam[4] + firstteam[5] + firstteam[6] + firstteam[7] + firstteam[8] + firstteam[9] + firstteam[10] + firstteam[11] + firstteam[12] + firstteam[13] + firstteam[14]))

        label_season_end_3.set_markup('<b>All Defensive Team</b>\n<u>First Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Second Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n\n<u>Third Team</u>\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)\n%s (%s)' % tuple(defteam[0] + defteam[1] + defteam[2] + defteam[3] + defteam[4] + defteam[5] + defteam[6] + defteam[7] + defteam[8] + defteam[9] + defteam[10] + defteam[11] + defteam[12] + defteam[13] + defteam[14]))

        label_season_end_4.set_markup('<b>Season Records</b>\n<u>Points</u>\nAvg: %s (%s) - %.1f pts\nMost: %s (%s) - %.1f pts\n\n<u>Rebounds</u>\nAvg: %s (%s) - %.1f rebs\nMost: %s (%s) - %1.f rebs\n\n<u>Assists</u>\nAvg: %s (%s) - %.1f asts\nMost: %s (%s) - %1.f asts\n\n<u>Steals</u>\nAvg: %s (%s) - %.1f stls\nMost: %s (%s) - %1.f stls\n\n<u>Blocks</u>\nAvg: %s (%s) - %.1f blks\nMost: %s (%s) - %1.f blks' % tuple(most_points + highest_points + most_rebounds + highest_rebounds + most_assists + highest_assists + most_steals + highest_steals + most_blocks + highest_blocks))
