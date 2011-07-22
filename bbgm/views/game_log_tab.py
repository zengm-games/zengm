import gtk
import pango
import sqlite3

from bbgm import common
from bbgm.util import resources


class GameLogTab:
    updated = False
    built = False
    combobox_season_active = 0
    combobox_team_active = common.PLAYER_TEAM_ID

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

    def on_treeview_games_list_cursor_changed(self, treeview, data=None):
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        game_id = treemodel.get_value(treeiter, 0)
        buff = self.textview_box_score.get_buffer()
        buff.set_text(self.box_score(game_id))
        return True

    def box_score(self, game_id):
        format = '%-23s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s\n'
        box = ''
        t = 0
        common.DB_CON.row_factory = sqlite3.Row

        for row in common.DB_CON.execute('SELECT team_id FROM team_stats WHERE game_id = ?', (game_id,)):
            team_id = row[0]
            row2 = common.DB_CON.execute('SELECT region || " " || name FROM team_attributes WHERE team_id = ?', (team_id,)).fetchone()
            team_name_long = row2[0]
            dashes = ''
            for i in range(len(team_name_long)):
                dashes += '-'
            box += team_name_long + '\n' + dashes + '\n'

            box += format % ('Name', 'Pos', 'Min', 'FG', '3Pt', 'FT', 'Off', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts')

            for player_stats in common.DB_CON.execute('SELECT player_attributes.name, player_attributes.position, player_stats.minutes, player_stats.field_goals_made, player_stats.field_goals_attempted, player_stats.three_pointers_made, player_stats.three_pointers_attempted, player_stats.free_throws_made, player_stats.free_throws_attempted, player_stats.offensive_rebounds, player_stats.defensive_rebounds, player_stats.assists, player_stats.turnovers, player_stats.steals, player_stats.blocks, player_stats.personal_fouls, player_stats.points FROM player_attributes, player_stats WHERE player_attributes.player_id = player_stats.player_id AND player_stats.game_id = ? AND player_attributes.team_id = ? ORDER BY player_stats.starter DESC, player_stats.minutes DESC', (game_id, team_id)):
                rebounds = player_stats['offensive_rebounds'] + player_stats['defensive_rebounds']
                box += format % (player_stats['name'], player_stats['position'], player_stats['minutes'], '%s-%s' % (player_stats['field_goals_made'], player_stats['field_goals_attempted']), '%s-%s' % (player_stats['three_pointers_made'], player_stats['three_pointers_attempted']), '%s-%s' % (player_stats['free_throws_made'], player_stats['free_throws_attempted']), player_stats['offensive_rebounds'], rebounds, player_stats['assists'], player_stats['turnovers'], player_stats['steals'], player_stats['blocks'], player_stats['personal_fouls'], player_stats['points'])
            team_stats = common.DB_CON.execute('SELECT *  FROM team_stats WHERE game_id = ? AND team_id = ?', (game_id, team_id)).fetchone()
            rebounds = team_stats['offensive_rebounds'] + team_stats['defensive_rebounds']
            box += format % ('Total', '', 240, '%s-%s' % (team_stats['field_goals_made'], team_stats['field_goals_attempted']), '%s-%s' % (team_stats['three_pointers_made'], team_stats['three_pointers_attempted']), '%s-%s' % (team_stats['free_throws_made'], team_stats['free_throws_attempted']), team_stats['offensive_rebounds'], rebounds, team_stats['assists'], team_stats['turnovers'], team_stats['steals'], team_stats['blocks'], team_stats['personal_fouls'], team_stats['points'])
            if (t==0):
                box += '\n'
            t += 1

        common.DB_CON.row_factory = None

        return box

    def build(self):
        if common.DEBUG:
            print 'build game_log_tab'

        column_types = [int, str, str, str]
        column_info = [['Opponent', 'W/L', 'Score'],
                       [1,          2,     3],
                       [True,       True,  False],
                       [False,      False, False]]
        common.treeview_build_new(self.treeview_games_list, column_types, column_info)

        self.mw.notebook.insert_page(self.vbox5, gtk.Label('Game Log'), self.mw.pages['game_log'])

        self.built = True

    def update(self):
        if common.DEBUG:
            print 'update game_log_tab'

        season = self.mw.make_season_combobox(self.combobox_season, self.combobox_season_active)
        team_id = self.mw.make_team_combobox(self.combobox_team, self.combobox_team_active, season, False)

        query_ids = 'SELECT game_id FROM team_stats WHERE team_id = ? AND season = ?'
        params_ids = [team_id, season]
        query_row = 'SELECT game_id, (SELECT abbreviation FROM team_attributes WHERE team_id = team_stats.opponent_team_id), (SELECT val FROM enum_w_l WHERE key = team_stats.won), points || "-" || opponent_points FROM team_stats WHERE game_id = ? AND team_id = ?'
        params_row = [-1, team_id]

        common.treeview_update_new(self.treeview_games_list, query_ids, params_ids, query_row, params_row)

        self.updated = True

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(resources.get_asset('ui', 'game_log_tab.ui'))

        self.vbox5 = self.builder.get_object('vbox5')
        self.treeview_games_list = self.builder.get_object('treeview_games_list')
        self.combobox_season = self.builder.get_object('combobox_season')
        self.combobox_team = self.builder.get_object('combobox_team')
        self.textview_box_score = self.builder.get_object('textview_box_score')
        self.textview_box_score.modify_font(pango.FontDescription("Monospace 8"))
        self.builder.connect_signals(self)

#        self.build()
