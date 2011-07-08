import gtk
import mx.DateTime
import random
import sqlite3

from bbgm import common
from bbgm.views import trade_window


class PlayerWindow:
    pages = {'stats': 0, 'game_log': 1}
    built = dict(stats=False, game_log=False)
    updated = dict(stats=False, game_log=False)

    def update_player(self, player_id):
        print 'update player window'
        # If player_id is -1, then keep same player
        if player_id != -1:
            self.player_id = player_id

        # Roster position
        query = 'SELECT roster_position FROM player_ratings WHERE player_id = ?'
        row = common.DB_CON.execute(query, (self.player_id,)).fetchone()
        self.roster_position = row[0]
        query = 'SELECT COUNT(*), team_id FROM player_attributes WHERE team_id = (SELECT team_id FROM player_attributes WHERE player_id = ?)'
        row = common.DB_CON.execute(query, (self.player_id,)).fetchone()
        self.max_roster_position = row[0]
        self.team_id = row[1]

        # Negotiate/Trade button
        if self.team_id == common.PLAYER_TEAM_ID:
            self.button_trade.set_sensitive(False)
        else:
            self.button_trade.set_sensitive(True)

        # Info
        row = common.DB_CON.execute('SELECT name, position, (SELECT region || " " || name FROM team_attributes WHERE team_id = player_attributes.team_id), height, weight, born_date, born_location, college, draft_year, draft_round, draft_pick, (SELECT region || " " || name FROM team_attributes WHERE team_id = player_attributes.draft_team_id), contract_amount, contract_expiration FROM player_attributes WHERE player_id = ?', (self.player_id,)).fetchone()
        self.player_window.set_title('%s - Player Info' % row[0]);
        [y, m, d] = row[5].split('-', 2)
        height = '%d\'%d"' % (row[3] // 12, row[3] % 12);
        born = mx.DateTime.Date(int(y), int(m), int(d))
        age = mx.DateTime.Age(mx.DateTime.Date(common.SEASON, 1, 1), born).years
        experience = 77  # This should be calculated by how many seasons are recorded, because a player could be injured all year or be out of the leauge
        contract_amount = '$%.2fM' % (row[12] / 1000.0)
        self.label_player_window_info.set_markup('<span size="x-large" weight="bold">%s</span>\n<span weight="bold">%s - %s</span>\nHeight: %s\nWeight: %s lbs\nAge: %s\nExperience: %s\nBorn: %s - %s\nCollege: %s\nDraft: %s - Round %s (Pick %s) by the %s\nContract: %s per year through %d' % (row[0], row[1], row[2], height, row[4], age, experience, born.strftime("%B %e, %Y"), row[6], row[7], row[8], row[9], row[10], row[11], contract_amount, row[13]))

        # Ratings
        common.DB_CON.row_factory = sqlite3.Row
        query = 'SELECT overall, height, strength, speed, jumping, endurance, shooting_inside, shooting_layups, shooting_free_throws, shooting_two_pointers, shooting_three_pointers, blocks, steals, dribbling, passing, rebounding, potential FROM player_ratings WHERE player_id = ?'
        row = common.DB_CON.execute(query, (self.player_id,)).fetchone()
        common.DB_CON.row_factory = None
        self.label_rating = {}
        for rating in ('height', 'strength', 'speed', 'jumping', 'endurance', 'shooting_inside', 'shooting_layups', 'shooting_free_throws', 'shooting_two_pointers', 'shooting_three_pointers', 'blocks', 'steals', 'dribbling', 'passing', 'rebounding'):
            self.label_rating[rating] = self.builder.get_object('label_rating_%s' % rating)
            self.label_rating[rating].set_text('%d' % row[rating])
        self.label_player_window_ratings.set_markup('<span size="x-large" weight="bold">Overall Rating: %s</span>\nPotential: %s' % (row['overall'], row['potential']));

        # Get rid of the old player's stats
        m = self.treeview_player_window_stats.get_model()
        if m != None:
            m.clear()
        m = self.treeview_player_window_game_log.get_model()
        if m != None:
            m.clear()

        # Stats
        if not self.built['stats']:
            self.build_player_window_stats()
        if self.notebook1.get_current_page() == self.pages['stats']:
            self.update_player_window_stats()
        else:
            self.updated['stats'] = False
        # Game Log
        if not self.built['game_log']:
            self.build_player_window_game_log()
        if self.notebook1.get_current_page() == self.pages['game_log']:
            self.update_player_window_game_log()
        else:
            self.updated['game_log'] = False

        if player_id != -1:  # Don't raise the dialog if it's in the background
            self.player_window.show()  # Show the dialog
            self.player_window.window.show()  # Raise the dialog if it's in the background

    def build_player_window_stats(self):
        column_types = [int, str, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        column_info = [['Year', 'Team', 'GP',  'GS',  'Min', 'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG'],
                       [0,      1,      2,     3,     4,     5,     6,     7,     8,     9,     10,    11,    12,    13,    14,     15,     16,    17,    18,   19,    20,    21,   22],
                       [True,   True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True],
                       [False,  False,  False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True]]
        common.treeview_build_new(self.treeview_player_window_stats, column_types, column_info)

        self.built['stats'] = True

    def update_player_window_stats(self):
        print 'update player window stats'
        query_ids = 'SELECT season FROM player_stats WHERE player_id = ? GROUP BY season ORDER BY season ASC'
        params_ids = [self.player_id]
        query_row = 'SELECT player_stats.season, (SELECT abbreviation FROM team_attributes WHERE team_id = player_stats.team_id), SUM(player_stats.minutes>0), SUM(player_stats.starter), AVG(player_stats.minutes), AVG(player_stats.field_goals_made), AVG(player_stats.field_goals_attempted), AVG(100*player_stats.field_goals_made/player_stats.field_goals_attempted), AVG(player_stats.three_pointers_made), AVG(player_stats.three_pointers_attempted), AVG(100*player_stats.three_pointers_made/player_stats.three_pointers_attempted), AVG(player_stats.free_throws_made), AVG(player_stats.free_throws_attempted), AVG(100*player_stats.free_throws_made/player_stats.free_throws_attempted), AVG(player_stats.offensive_rebounds), AVG(player_stats.defensive_rebounds), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists), AVG(player_stats.turnovers), AVG(player_stats.steals), AVG(player_stats.blocks), AVG(player_stats.personal_fouls), AVG(player_stats.points) FROM player_attributes, player_stats WHERE player_stats.season = ? AND player_attributes.player_id = ? AND player_attributes.player_id = player_stats.player_id AND player_stats.is_playoffs = 0'
        params_row = [-1, self.player_id]

        common.treeview_update_new(self.treeview_player_window_stats, query_ids, params_ids, query_row, params_row)

        self.updated['stats'] = True

    def build_player_window_game_log(self):
        column_types = [int, str, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        column_info = [['Team', 'GS',  'Min', 'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts'],
                       [1,      2,     3,     4,     5,     6,     7,     8,     9,     10,    11,    12,    13,     14,     15,    16,    17,   18,    19,    20,   21],
                       [True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True],
                       [False,  False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True]]
        common.treeview_build_new(self.treeview_player_window_game_log, column_types, column_info)
        self.built['game_log'] = True

    def update_player_window_game_log(self):
        print 'update player window game log'
        query_ids = 'SELECT game_id FROM player_stats WHERE player_id = ? AND season = ?'
        params_ids = [self.player_id, common.SEASON]
        query_row = 'SELECT player_stats.game_id, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), player_stats.starter, player_stats.minutes, player_stats.field_goals_made, player_stats.field_goals_attempted, 100*player_stats.field_goals_made/player_stats.field_goals_attempted, player_stats.three_pointers_made, player_stats.three_pointers_attempted, 100*player_stats.three_pointers_made/player_stats.three_pointers_attempted, player_stats.free_throws_made, player_stats.free_throws_attempted, 100*player_stats.free_throws_made/player_stats.free_throws_attempted, player_stats.offensive_rebounds, player_stats.defensive_rebounds, player_stats.offensive_rebounds + player_stats.defensive_rebounds, player_stats.assists, player_stats.turnovers, player_stats.steals, player_stats.blocks, player_stats.personal_fouls, player_stats.points FROM player_attributes, player_stats WHERE player_stats.game_id = ? AND player_stats.player_id = ? AND player_attributes.player_id = player_stats.player_id'
        params_row = [-1, self.player_id]

        common.treeview_update_new(self.treeview_player_window_game_log, query_ids, params_ids, query_row, params_row)

        self.updated['game_log'] = True

    def on_player_window_close(self, widget, data=None):
        self.player_window.hide()
        return True

    def on_button_previous_clicked(self, button, data=None):
        new_position = self.roster_position - 1
        if new_position < 1:
            new_position = self.max_roster_position
        query = 'SELECT player_ratings.player_id FROM player_attributes, player_ratings WHERE player_attributes.team_id = ? AND player_ratings.roster_position = ? AND player_attributes.player_id = player_ratings.player_id'
        row = common.DB_CON.execute(query, (self.team_id, new_position)).fetchone()
        self.update_player(row[0])

    def on_button_next_clicked(self, button, data=None):
        new_position = self.roster_position + 1
        if new_position > self.max_roster_position:
            new_position = 1
        query = 'SELECT player_ratings.player_id FROM player_attributes, player_ratings WHERE player_attributes.team_id = ? AND player_ratings.roster_position = ? AND player_attributes.player_id = player_ratings.player_id'
        row = common.DB_CON.execute(query, (self.team_id, new_position)).fetchone()
        self.update_player(row[0])

    def on_button_trade_clicked(self, button, data=None):
        '''
        Open a window set to trade for this player, unless he is already on your team
        '''
        if self.team_id != common.PLAYER_TEAM_ID:
            tw = trade_window.TradeWindow(self.mw, self.team_id, self.player_id)
            response = tw.trade_window.run()
            tw.trade_window.destroy()

    def on_button_close_clicked(self, button, data=None):
        self.player_window.hide()

    def on_notebook1_switch_page(self, widget, page, page_num, data=None):
        print 'player window on_notebook_switch_page', page_num
        if (page_num == self.pages['stats']):
            if not self.updated['stats']:
                self.update_player_window_stats()
        elif (page_num == self.pages['game_log']):
            if not self.updated['game_log']:
                self.update_player_window_game_log()

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['player_window'])

        self.player_window = self.builder.get_object('player_window')
        self.notebook1 = self.builder.get_object('notebook1')
        self.label_player_window_info = self.builder.get_object('label_player_window_info')
        self.label_player_window_ratings = self.builder.get_object('label_player_window_ratings')
        self.treeview_player_window_stats = self.builder.get_object('treeview_player_window_stats')
        self.treeview_player_window_game_log = self.builder.get_object('treeview_player_window_game_log')
        self.button_trade = self.builder.get_object('button_trade')

        self.builder.connect_signals(self)
