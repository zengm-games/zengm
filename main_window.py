# This file implements the main window GUI

import bz2
import cPickle as pickle
import gtk
import os
import pango
import random
import sqlite3
import shutil
import sys
import time

import common
import draft_dialog
import game_sim
import roster_window
import player
import player_window
import schedule

class MainWindow:
    def on_main_window_delete_event(self, widget, data=None):
        self.quit();
        return True

    # Menu Items
    def on_menuitem_new_activate(self, widget=None, data=None):
        '''
        First check if there are unsaved changes before starting a new game
        '''
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
            result, team_id = self.new_game_dialog()
            if result == gtk.RESPONSE_OK and team_id >= 0:
                self.new_game(team_id)
                self.unsaved_changes = True

    def on_menuitem_open_activate(self, widget=None, data=None):
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
            result = self.open_game_dialog()
            if result:
                self.open_game(result)

    def on_menuitem_save_activate(self, widget, data=None):
        self.save_game()

    def on_menuitem_save_as_activate(self, widget, data=None):
        self.save_game_dialog()

    def on_menuitem_quit_activate(self, widget, data=None):
        self.quit()
        return True

    def on_menuitem_roster_activate(self, widget, data=None):
        if not hasattr(self, 'rw'):
            self.rw = roster_window.RosterWindow(self)
        else:
            self.rw.roster_window.show() # Show the window
            self.rw.roster_window.window.show() # Raise the window if it's in the background
        return True

    def on_menuitem_one_day_activate(self, widget, data=None):
        if self.phase >= 1 and self.phase <= 3:
            self.play_games(1)
        return True

    def on_menuitem_until_playoffs_activate(self, widget, data=None):
        row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        num_days = 82 - row[0] # Number of games in a whole season - number of games already played this season
        self.play_games(num_days)
        return True

    def on_menuitem_through_playoffs_activate(self, widget, data=None):
        self.new_phase(4)
        return True

    def on_menuitem_until_draft_activate(self, widget, data=None):
        self.new_phase(5)
        return True

    def on_menuitem_until_free_agency_activate(self, widget, data=None):
        self.new_phase(7)
        return True

    def on_menuitem_until_preseason_activate(self, widget, data=None):
        self.new_phase(0)
        return True

    def on_menuitem_until_regular_season_activate(self, widget, data=None):
        self.new_phase(1)
        return True

    def on_menuitem_about_activate(self, widget, data=None):
        self.aboutdialog = self.builder.get_object('aboutdialog')
        self.aboutdialog.show()
        return True

    # The aboutdialog signal functions are copied from PyGTK FAQ entry 10.13
    def on_aboutdialog_response(self, widget, response, data=None):
        # system-defined GtkDialog responses are always negative, in which    
        # case we want to hide it
        if response < 0:
            self.aboutdialog.hide()
            self.aboutdialog.emit_stop_by_name('response')

    def on_aboutdialog_close(self, widget, data=None):
        self.aboutdialog.hide()
        return True

    # Tab selections
    def on_notebook_select_page(self, widget, page, page_num, data=None):
        if (page_num == self.pages['standings']):
            if not self.built['standings']:
                self.build_standings()
            if not self.updated['standings']:
                self.update_standings()
        elif (page_num == self.pages['player_ratings']):
            if not self.built['player_ratings']:
                self.build_player_ratings()
            if not self.updated['player_ratings']:
                self.update_player_ratings()
        elif (page_num == self.pages['player_stats']):
            if not self.built['player_stats']:
                self.build_player_stats()
            if not self.updated['player_stats']:
                self.update_player_stats()
        elif (page_num == self.pages['team_stats']):
            if not self.built['team_stats']:
                self.build_team_stats()
            if not self.updated['team_stats']:
                self.update_team_stats()
        elif (page_num == self.pages['game_log']):
            if not self.built['games_list']:
                self.build_games_list()
            if not self.updated['games_list']:
                self.update_games_list()

    # Events in the main notebook
    def on_combobox_standings_changed(self, combobox, data=None):
        old = self.combobox_standings_active
        self.combobox_standings_active = combobox.get_active()
        if self.combobox_standings_active != old:
            self.update_standings()

    def on_combobox_player_stats_season_changed(self, combobox, data=None):
        old = self.combobox_player_stats_season_active
        self.combobox_player_stats_season_active = combobox.get_active()
        if self.combobox_player_stats_season_active != old:
            self.update_player_stats()

    def on_combobox_team_stats_season_changed(self, combobox, data=None):
        old = self.combobox_team_stats_season_active
        self.combobox_team_stats_season_active = combobox.get_active()
        if self.combobox_team_stats_season_active != old:
            self.update_team_stats()

    def on_combobox_game_log_season_changed(self, combobox, data=None):
        old = self.combobox_game_log_season_active
        self.combobox_game_log_season_active = combobox.get_active()
        if self.combobox_game_log_season_active != old:
            self.update_games_list()

    def on_combobox_game_log_team_changed(self, combobox, data=None):
        old = self.combobox_game_log_team_active
        self.combobox_game_log_team_active = combobox.get_active()
        if self.combobox_game_log_team_active != old:
            self.update_games_list()

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Called from any player row in a treeview to open the player info window
        '''
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        player_id = treemodel.get_value(treeiter, 0)
        if not hasattr(self, 'pw'):
            self.pw = player_window.PlayerWindow()
        self.pw.update_player(player_id)
        return True

    def on_treeview_games_list_cursor_changed(self, treeview, data=None):
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        game_id = treemodel.get_value(treeiter, 0)
        buffer = self.textview_box_score.get_buffer()
        buffer.set_text(self.box_score(game_id))
        return True

    # Pages
    def build_standings(self):
        max_divisions_in_conference, num_conferences = common.DB_CON.execute('SELECT (SELECT COUNT(*) FROM league_divisions GROUP BY conference_id ORDER BY COUNT(*) LIMIT 1), COUNT(*) FROM league_conferences').fetchone()
        try:
            self.table_standings.destroy() # Destroy table if it already exists... this will be called after starting a new game from the menu
        except:
            pass
        self.table_standings = gtk.Table(max_divisions_in_conference, num_conferences)
        self.scrolledwindow_standings = self.builder.get_object('scrolledwindow_standings')
        self.scrolledwindow_standings.add_with_viewport(self.table_standings)

        self.treeview_standings = {} # This will contain treeviews for each conference
        conference_id = -1
        for row in common.DB_CON.execute('SELECT division_id, conference_id, name FROM league_divisions'):
            if conference_id != row[1]:
                row_top = 0
                conference_id = row[1]

            self.treeview_standings[row[0]] = gtk.TreeView()
            self.table_standings.attach(self.treeview_standings[row[0]], conference_id, conference_id + 1, row_top, row_top + 1)
            column_info = [[row[2], 'Won', 'Lost', 'Pct', 'Div', 'Conf'],
                           [0,      1,     2,      3,     4,     5],
                           [False,  False, False,  False, False, False],
                           [False,  False, False,  True,  False, False]]
            common.treeview_build(self.treeview_standings[row[0]], column_info)
            self.treeview_standings[row[0]].show()

            row_top += 1

        self.table_standings.show()
        self.built['standings'] = True

    def update_standings(self):
        season = self.make_season_combobox(self.combobox_standings, self.combobox_standings_active)

        for row in common.DB_CON.execute('SELECT division_id FROM league_divisions'):
            column_types = [str, int, int, float, str, str]
            query = 'SELECT region || " "  || name, won, lost, 100*won/(won + lost), won_div || "-" || lost_div, won_conf || "-" || lost_conf FROM team_attributes WHERE season = ? AND division_id = ? ORDER BY won/(won + lost) DESC'
            common.treeview_update(self.treeview_standings[row[0]], column_types, query, (season, row[0]))
        self.updated['standings'] = True

    def build_player_ratings(self):
        column_info = [['Name', 'Team', 'Age', 'Overall', 'Height', 'Stength', 'Speed', 'Jumping', 'Endurance', 'Inside Scoring', 'Layups', 'Free Throws', 'Two Pointers', 'Three Pointers', 'Blocks', 'Steals', 'Dribbling', 'Passing', 'Rebounding'],
                       [2,      3,      4,     5,         6,        7,         8,       9,         10,          11,               12,       13,            14,             15,               16,       17,       18,          19,        20],
                       [True,   True,   True,  True,      True,     True,      True,    True,      True,        True,             True,     True,          True,           True,             True,     True,     True,        True,      True],
                       [False,  False,  False, False,     False,    False,     False,   False,     False,       False,            False,    False,         False,          False,            False,    False,    False,       False,     False]]
        common.treeview_build(self.treeview_player_ratings, column_info)
        self.built['player_ratings'] = True

    def update_player_ratings(self):
        column_types = [int, int, str, str, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int, int]
        query = "SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), ROUND((julianday('%s-06-01') - julianday(born_date))/365.25), player_ratings.overall, player_ratings.height, player_ratings.strength, player_ratings.speed, player_ratings.jumping, player_ratings.endurance, player_ratings.shooting_inside, player_ratings.shooting_layups, player_ratings.shooting_free_throws, player_ratings.shooting_two_pointers, player_ratings.shooting_three_pointers, player_ratings.blocks, player_ratings.steals, player_ratings.dribbling, player_ratings.passing, player_ratings.rebounding FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id" % common.SEASON
        common.treeview_update(self.treeview_player_ratings, column_types, query)
        self.updated['player_ratings'] = True

    def build_player_stats(self):
        column_info = [['Name', 'Team', 'GP',  'GS',  'Min', 'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG'],
                       [2,      3,      4,     5,     6,     7,     8,     9,     10,    11,    12,    13,    14,    15,    16,     17,     18,    19,    20,   21,    22,    23,   24],
                       [True,   True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True],
                       [False,  False,  False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,   True,   True,  True,  True, True,  True,  True, True]]
        common.treeview_build(self.treeview_player_stats, column_info)
        self.built['player_stats'] = True

    def update_player_stats(self):
        season = self.make_season_combobox(self.combobox_player_stats_season, self.combobox_player_stats_season_active)

        column_types = [int, int, str, str, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        query = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), COUNT(*), SUM(player_stats.starter), AVG(player_stats.minutes), AVG(player_stats.field_goals_made), AVG(player_stats.field_goals_attempted), AVG(100*player_stats.field_goals_made/player_stats.field_goals_attempted), AVG(player_stats.three_pointers_made), AVG(player_stats.three_pointers_attempted), AVG(100*player_stats.three_pointers_made/player_stats.three_pointers_attempted), AVG(player_stats.free_throws_made), AVG(player_stats.free_throws_attempted), AVG(100*player_stats.free_throws_made/player_stats.free_throws_attempted), AVG(player_stats.offensive_rebounds), AVG(player_stats.defensive_rebounds), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists), AVG(player_stats.turnovers), AVG(player_stats.steals), AVG(player_stats.blocks), AVG(player_stats.personal_fouls), AVG(player_stats.points) FROM player_attributes, player_stats WHERE player_attributes.player_id = player_stats.player_id AND player_stats.season = ? GROUP BY player_attributes.player_id'
        common.treeview_update(self.treeview_player_stats, column_types, query, (season,))
        self.updated['player_stats'] = True

    def build_team_stats(self):
        column_info = [['Team', 'G',   'W',   'L',   'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG', 'OPPG'],
                       [0,      1,     2,     3,     4,     5,     6,     7,     8,     9,     10,    11,    12,    13,     14,     15,    16,    17,   18,    19,    20,   21,    22],
                       [True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True],
                       [False,  False, False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True]]
        common.treeview_build(self.treeview_team_stats, column_info)
        self.built['team_stats'] = True

    def update_team_stats(self):
        season = self.make_season_combobox(self.combobox_team_stats_season, self.combobox_team_stats_season_active)

        column_types = [str, int, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        query = 'SELECT abbreviation, COUNT(*), SUM(team_stats.won), COUNT(*)-SUM(team_stats.won), AVG(team_stats.field_goals_made), AVG(team_stats.field_goals_attempted), AVG(100*team_stats.field_goals_made/team_stats.field_goals_attempted), AVG(team_stats.three_pointers_made), AVG(team_stats.three_pointers_attempted), AVG(100*team_stats.three_pointers_made/team_stats.three_pointers_attempted), AVG(team_stats.free_throws_made), AVG(team_stats.free_throws_attempted), AVG(100*team_stats.free_throws_made/team_stats.free_throws_attempted), AVG(team_stats.offensive_rebounds), AVG(team_stats.defensive_rebounds), AVG(team_stats.offensive_rebounds + team_stats.defensive_rebounds), AVG(team_stats.assists), AVG(team_stats.turnovers), AVG(team_stats.steals), AVG(team_stats.blocks), AVG(team_stats.personal_fouls), AVG(team_stats.points), AVG(team_stats.opponent_points) FROM team_attributes, team_stats WHERE team_attributes.team_id = team_stats.team_id AND team_attributes.season = team_stats.season AND team_stats.season = ? GROUP BY team_stats.team_id'
        common.treeview_update(self.treeview_team_stats, column_types, query, (season,))
        self.updated['team_stats'] = True

    def build_games_list(self):
        column_info = [['Opponent', 'W/L', 'Score'],
                       [1,          2,     3],
                       [True,       True,  False],
                       [False,      False, False]]
        common.treeview_build(self.treeview_games_list, column_info)
        self.built['games_list'] = True

    def update_games_list(self):
        season = self.make_season_combobox(self.combobox_game_log_season, self.combobox_game_log_season_active)
        team_id = self.make_team_combobox(self.combobox_game_log_team, self.combobox_game_log_team_active, season)

        column_types = [int, str, str, str]
        query = 'SELECT game_id, (SELECT abbreviation FROM team_attributes WHERE team_id = team_stats.opponent_team_id), (SELECT val FROM enum_w_l WHERE key = team_stats.won), points || "-" || opponent_points FROM team_stats WHERE team_id = ? AND season = ?'
        query_bindings = (team_id, season)
        common.treeview_update(self.treeview_games_list, column_types, query, query_bindings)
        self.updated['games_list'] = True

    def update_current_page(self):
        if self.notebook.get_current_page() == self.pages['standings']:
            if not self.built['standings']:
                self.build_standings()
            self.update_standings()
        elif self.notebook.get_current_page() == self.pages['player_ratings']:
            if not self.built['player_ratings']:
                self.build_player_ratings()
            self.update_player_ratings()
        elif self.notebook.get_current_page() == self.pages['player_stats']:
            if not self.built['player_stats']:
                self.build_player_stats()
            self.update_player_stats()
        elif self.notebook.get_current_page() == self.pages['team_stats']:
            if not self.built['team_stats']:
                self.build_team_stats()
            self.update_team_stats()
        elif self.notebook.get_current_page() == self.pages['game_log']:
            if not self.built['games_list']:
                self.build_games_list()
            self.update_games_list()

    def update_all_pages(self):
        '''
        Update the current page and mark all other pages to be updated when they are next viewed.
        '''
        self.update_current_page()
        for key in self.updated.iterkeys():
            self.updated[key] = False

    def new_game(self, team_id):
        '''
        Starts a new game.  Call this only after checking for saves, etc.
        '''

        # Delete old database
        if os.path.exists(common.DB_TEMP_FILENAME):
            os.remove(common.DB_TEMP_FILENAME)

        # Generate new players
        profiles = ['Point', 'Wing', 'Big', '']
        gp = player.GeneratePlayer()
        sql = ''
        player_id = 1
        for t in range(30):
            base_ratings = [40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29]
            potentials = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55]
            random.shuffle(potentials)
            for p in range(12):
                i = random.randrange(len(profiles))
                profile = profiles[i]

                aging_years = random.randrange(14)

                gp.new(player_id, t, 19, profile, base_ratings[p], potentials[p])
                gp.develop(aging_years)

                sql += gp.sql_insert()

                player_id += 1
        f = open('data/players.sql', 'w')
        f.write(sql)
        f.close()

        # Create new database
        common.DB_FILENAME = common.DB_TEMP_FILENAME
        self.connect(team_id)

        # Make schedule, start season
        self.new_phase(1)

        #Auto sort player's roster
        self.roster_auto_sort(common.PLAYER_TEAM_ID)

        # Make standings treeviews based on league_* tables
        self.build_standings()

        self.update_all_pages()

    def open_game(self, filename):
        # Close the connection if there is one open
        try:
            common.DB_CON.close();
        except:
            pass

        common.DB_FILENAME = filename

        f = open(common.DB_FILENAME)
        data_bz2 = f.read()
        f.close()

        data = bz2.decompress(data_bz2)

        f = open(common.DB_TEMP_FILENAME, 'w')
        f.write(data)
        f.close()

        self.connect()

        self.update_play_menu(self.phase)

    def connect(self, team_id = -1):
        '''
        Connect to the database
        Get the team ID, season #, and schedule
        If team_id is passed as a parameter, then this is being called from new_game and the schema should be loaded and the team_id should be set in game_attributes
        '''
        common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
        common.DB_CON.isolation_level = 'IMMEDIATE'
        if team_id >= 0:
            # Starting a new game, so load data into the database
            for fn in ['data/tables.sql', 'data/league.sql', 'data/teams.sql', 'data/players.sql']:
                f = open(fn)
                data = f.read()
                f.close()
                common.DB_CON.executescript(data)
            common.DB_CON.execute('UPDATE game_attributes SET team_id = ?', (team_id,))
        row = common.DB_CON.execute('SELECT team_id, season, phase, schedule FROM game_attributes').fetchone()
        common.PLAYER_TEAM_ID = row[0]
        common.SEASON = row[1]
        self.phase = row[2]

        if team_id == -1:
            # Opening a saved game
            # If this is a new game, update_all_pages() is called in new_game()
            self.update_all_pages()
            # Unpickle schedule
            self.schedule = pickle.loads(row[3].encode('ascii'))

    def save_game(self):
        if common.DB_FILENAME == common.DB_TEMP_FILENAME:
            return self.save_game_dialog()
        else:
            self.save_game_as(common.DB_FILENAME)
            return True

    def save_game_as(self, filename):
        '''
        Saves the game to filename
        '''
        # Schedule
        schedule = pickle.dumps(self.schedule)
        common.DB_CON.execute('UPDATE game_attributes SET schedule = ? WHERE team_id = ?', (schedule, common.PLAYER_TEAM_ID))

        common.DB_CON.commit()

        f = open(common.DB_TEMP_FILENAME)
        data = f.read()
        f.close()

        data_bz2 = bz2.compress(data)

        f = open(filename, 'w')
        f.write(data_bz2)
        f.close()

        self.unsaved_changes = False

    def save_nosave_cancel(self):
        '''
        Call this when there is unsaved stuff and the user wants to start a new
        game or open a saved game.  Returns 1 to proceed or 0 to abort.
        '''
        message = "<span size='large' weight='bold'>Save changes to your current game before closing?</span>\n\nYour changes will be lost if you don't save them."

        dlg = gtk.MessageDialog(self.main_window,
            gtk.DIALOG_MODAL |
            gtk.DIALOG_DESTROY_WITH_PARENT,
            gtk.MESSAGE_WARNING,
            gtk.BUTTONS_NONE)
        dlg.set_markup(message)
        
        dlg.add_button("Close _Without Saving", gtk.RESPONSE_NO)
        dlg.add_button(gtk.STOCK_CANCEL, gtk.RESPONSE_CANCEL)
        defaultAction = dlg.add_button(gtk.STOCK_SAVE, gtk.RESPONSE_YES)
        #make save the default action when enter is pressed
        dlg.set_default(defaultAction)
        
        dlg.set_transient_for(self.main_window)

        response = dlg.run()
        dlg.destroy()
        if response == gtk.RESPONSE_YES:
            if self.save_game():
                return 1
            else:
                return 0
        elif response == gtk.RESPONSE_NO:
            return 1
        elif response == gtk.RESPONSE_CANCEL or response == gtk.RESPONSE_DELETE_EVENT:
            return 0

    def play_games(self, num_days):
        '''
        Plays the number of games set in num_games and updates pages
        After that, checks to see if the season is over (so make sure num_games makes sense!)
        '''
        game = game_sim.Game()
        for d in range(num_days):
            self.statusbar.push(self.statusbar_context_id, 'Playing day %d of %d...' % (d, num_days))
            for i in range(len(common.TEAMS)/2):
                teams = self.schedule.pop()

                while gtk.events_pending():
                    gtk.main_iteration(False) # This stops everything from freezing
#                t1 = random.randint(0, len(common.TEAMS)-1)
#                while True:
#                    t2 = random.randint(0, len(common.TEAMS)-1)
#                    if t1 != t2:
#                        break
                game.play(*teams)
                game.write_stats()
            if self.notebook.get_current_page() != self.pages['player_ratings']:
                self.update_current_page()
            self.statusbar.pop(self.statusbar_context_id)

        # Make sure we are looking at this year's standings, stats, and games after playing some games
        self.combobox_standings_active = 0
        self.combobox_player_stats_season_active = 0
        self.combobox_team_stats_season_active = 0
        self.combobox_game_log_season_active = 0
        self.combobox_game_log_team_active = common.PLAYER_TEAM_ID

        # Check to see if the season is over
        row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        days_played = row[0]
        days_in_season = 82
        season_over = False
        if days_played == days_in_season:
            season_over = True
            # DISPLAY SEASON AWARDS DIALOG HERE
            self.new_phase(3) # Start playoffs

        if season_over or self.notebook.get_current_page() != self.pages['player_ratings']:
            self.update_all_pages()
        self.unsaved_changes = True

    def make_season_combobox(self, combobox, active):
        # Season combobox
        populated = False
        model = combobox.get_model()
        combobox.set_model(None)
        model.clear()
        for row in common.DB_CON.execute('SELECT season FROM team_stats GROUP BY season ORDER BY season DESC'):
            model.append(['%s' % row[0]])
            populated = True
        if not populated:
            row = common.DB_CON.execute('SELECT season FROM game_attributes').fetchone()
            model.append(['%s' % row[0]])
            populated = True
        combobox.set_model(model)
        combobox.set_active(active)
        season = combobox.get_active_text()
        return season

    def make_team_combobox(self, combobox, active, season):
        # Team combobox
        model = gtk.ListStore(str, int)
        renderer = gtk.CellRendererText()
        combobox.pack_start(renderer, True)
        for row in common.DB_CON.execute('SELECT abbreviation, team_id FROM team_attributes WHERE season = ? ORDER BY abbreviation ASC', (season,)):
            model.append(['%s' % row[0], row[1]])
        combobox.set_model(model)
        combobox.set_active(active)
        iter = combobox.get_active_iter()
        team_id = model.get_value(iter, 1)
        return team_id

    def roster_auto_sort(self, team_id, from_button = False):
        players = []
        query = 'SELECT player_attributes.player_id, player_ratings.overall, player_ratings.endurance FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'

        for row in common.DB_CON.execute(query, (team_id,)):
            players.append(list(row))

        # Order
        players.sort(cmp=lambda x,y: y[1]-x[1]) # Sort by rating

        # Minutes
        overall_ratings = []
        total_minutes = 0
        for player in players:
            overall_ratings.append(player[1])
            player[2] = player[2]*(45-20)/100 + 20 # Scale endurance from 20 to 45
            total_minutes += player[2]
        i = 1
        while total_minutes > 240:
            if players[-i][2] > 0:
                players[-i][2] -= 1
                total_minutes -= 1
            else:
                i += 1

        # Update
        roster_position = 1
        for player in players:
            common.DB_CON.execute('UPDATE player_ratings SET average_playing_time = ?, roster_position = ? WHERE player_id = ?', (player[2], roster_position, player[0]))
            roster_position += 1

    def quit(self):
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
            common.DB_CON.close()
            os.remove('temp.sqlite')
            gtk.main_quit()

    def new_game_dialog(self):
        new_game_dialog = self.builder.get_object('new_game_dialog')
        new_game_dialog.set_transient_for(self.main_window)
        combobox_new_game_teams = self.builder.get_object('combobox_new_game_teams')

        # We're not currently connected to the database, so create a temporary one in memory to load the team attributes
        temp_db_con = sqlite3.connect(':memory:')
        for fn in ['data/tables.sql', 'data/teams.sql']:
            f = open(fn)
            data = f.read()
            f.close()
            temp_db_con.executescript(data)

        # Add teams to combobox
        model = combobox_new_game_teams.get_model()
        combobox_new_game_teams.set_model(None)
        model.clear()
        for row in temp_db_con.execute('SELECT region || " " || name FROM team_attributes ORDER BY team_id ASC'):
            model.append(['%s' % row[0]])
        combobox_new_game_teams.set_model(model)
        combobox_new_game_teams.set_active(3)
        result = new_game_dialog.run()
        new_game_dialog.hide()
        team_id = combobox_new_game_teams.get_active()
        return result, team_id

    def open_game_dialog(self):
        open_dialog = gtk.FileChooserDialog(title='Open Game', action=gtk.FILE_CHOOSER_ACTION_OPEN, buttons=(gtk.STOCK_CANCEL, gtk.RESPONSE_CANCEL, gtk.STOCK_OPEN, gtk.RESPONSE_OK))
        open_dialog.set_current_folder('saves')
        open_dialog.set_transient_for(self.main_window)

        # Filters
        filter = gtk.FileFilter()
        filter.set_name('Basketball GM saves')
        filter.add_pattern('*.bbgm')
        open_dialog.add_filter(filter)
        filter = gtk.FileFilter()
        filter.set_name('All files')
        filter.add_pattern('*')
        open_dialog.add_filter(filter)

        result = ''
        if open_dialog.run() == gtk.RESPONSE_OK:
            result = open_dialog.get_filename()
        open_dialog.destroy()

        return result

    def save_game_dialog(self):
        '''
        Return True if the game is saved, False otherwise
        '''
        buttons = (gtk.STOCK_CANCEL,gtk.RESPONSE_CANCEL,gtk.STOCK_SAVE,gtk.RESPONSE_OK)
        save_game_dialog = gtk.FileChooserDialog("Choose a location to save the game", self.main_window, gtk.FILE_CHOOSER_ACTION_SAVE, buttons)
        save_game_dialog.set_do_overwrite_confirmation(True)
        save_game_dialog.set_default_response(gtk.RESPONSE_OK)
        save_game_dialog.set_current_folder('saves')


        # Filters
        filter = gtk.FileFilter()
        filter.set_name('Basketball GM saves')
        filter.add_pattern('*.bbgm')
        save_game_dialog.add_filter(filter)
        filter = gtk.FileFilter()
        filter.set_name('All files')
        filter.add_pattern('*')
        save_game_dialog.add_filter(filter)

        response = save_game_dialog.run()
        if response == gtk.RESPONSE_OK:
            # commit, close, copy to new location, open
            filename = save_game_dialog.get_filename()

            # check file extension
            x = filename.split('.')
            ext = x.pop()
            if ext != 'bbgm':
                filename += '.bbgm'

            self.save_game_as(filename)
            self.open_game(filename)
            returnval = True
        else:
            returnval = False
        save_game_dialog.destroy()
        return returnval

    def new_schedule(self):
        teams = []
        for row in common.DB_CON.execute('SELECT team_id, division_id, (SELECT conference_id FROM league_divisions WHERE league_divisions.division_id = team_attributes.division_id) FROM team_attributes WHERE season = ?', (common.SEASON,)):
            teams.append({'team_id': row[0], 'division_id': row[1], 'conference_id': row[2], 'home_games': 0, 'away_games': 0})

        self.schedule = [] # team_id_home, team_id_away

        for i in range(len(teams)):
            for j in range(len(teams)):
                if teams[i]['team_id'] != teams[j]['team_id']:
                    game = [teams[i]['team_id'], teams[j]['team_id']]

                    # Constraint: 1 home game vs. each team in other conference
                    if teams[i]['conference_id'] != teams[j]['conference_id']:
                        self.schedule.append(game)
                        teams[i]['home_games'] += 1
                        teams[j]['away_games'] += 1

                    # Constraint: 2 home self.schedule vs. each team in same division
                    if teams[i]['division_id'] == teams[j]['division_id']:
                        self.schedule.append(game)
                        self.schedule.append(game)
                        teams[i]['home_games'] += 2
                        teams[j]['away_games'] += 2

                    # Constraint: 1-2 home self.schedule vs. each team in same conference and different division
                    # Only do 1 now
                    if teams[i]['conference_id'] == teams[j]['conference_id'] and teams[i]['division_id'] != teams[j]['division_id']:
                        self.schedule.append(game)
                        teams[i]['home_games'] += 1
                        teams[j]['away_games'] += 1

        # Constraint: 1-2 home self.schedule vs. each team in same conference and different division
        # Constraint: We need 8 more of these games per home team!
        team_ids_by_conference = [[], []]
        division_ids = [[], []]
        for i in range(len(teams)):
            team_ids_by_conference[teams[i]['conference_id']].append(i)
            division_ids[teams[i]['conference_id']].append(teams[i]['division_id'])
        for d in range(2):
            matchups = []
            matchups.append(range(15))
            games = 0
            while games < 8:
                new_matchup = []
                n = 0
                while n <= 14: # 14 = num teams in conference - 1
                    iters = 0
                    while True:
                        try_n = random.randint(0,14)
                        # Pick try_n such that it is in a different division than n and has not been picked before
                        if division_ids[d][try_n] != division_ids[d][n] and try_n not in new_matchup:
                            good = True
                            # Check for duplicate games
                            for matchup in matchups:
                                if matchup[n] == try_n:
                                    good = False
                                    break
                            if good:
                                new_matchup.append(try_n)
                                break
                        iters += 1
                        # Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
                        # So, catch these situations and reset the new_matchup
                        if iters > 50:
                            new_matchup = []
                            n = -1
                            break
                    n += 1
                matchups.append(new_matchup)
                games += 1
            matchups.pop(0) # Remove the first row in matchups
            for matchup in matchups:
                for t in matchup:
                    i = team_ids_by_conference[d][t]
                    j = team_ids_by_conference[d][matchup[t]]
                    game = [teams[i]['team_id'], teams[j]['team_id']]
                    self.schedule.append(game)
                    teams[i]['home_games'] += 1
                    teams[j]['away_games'] += 1

        random.shuffle(self.schedule)

    def new_phase(self, phase):
        self.unsaved_changes = True

        self.phase = phase
        common.DB_CON.execute('UPDATE game_attributes SET phase = ?', (self.phase,))

        # Preseason
        if self.phase == 0:
            common.SEASON += 1
            common.DB_CON.execute('UPDATE game_attributes SET season = season + 1')

            # Create new rows in team_attributes
            for row in common.DB_CON.execute('SELECT team_id, division_id, region, name, abbreviation FROM team_attributes WHERE season = ?', (common.SEASON-1,)):
                common.DB_CON.execute('INSERT INTO team_attributes (team_id, division_id, region, name, abbreviation, season) VALUES (?, ?, ?, ?, ?, ?)', (row[0], row[1], row[2], row[3], row[4], common.SEASON))
            # Age players
            player_ids = []
            for row in common.DB_CON.execute('SELECT player_id, born_date FROM player_attributes'):
                player_ids.append(row[0])
            up = player.Player()
            for player_id in player_ids:
                up.load(player_id)
                up.develop()
                up.save()

            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Preseason'))

            self.update_all_pages()

        # Regular season - pre trading deadline
        elif self.phase == 1:
            self.new_schedule()

            # Auto sort rosters (except player's team)
            for t in range(30):
                if t != common.PLAYER_TEAM_ID:
                    self.roster_auto_sort(t)

            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Regular season'))

        # Regular season - post trading deadline
        elif self.phase == 2:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Regular Season'))

        # Playoffs
        elif self.phase == 3:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Playoffs'))

        # Offseason - pre draft
        elif self.phase == 4:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Playoffs'))

        # Draft
        elif self.phase == 5:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

            if not hasattr(self, 'dd'):
                self.dd = draft_dialog.DraftDialog(self)
            else:
                self.dd.draft_dialog.show() # Show the window
                self.dd.draft_dialog.window.show() # Raise the window if it's in the background

        # Offseason - post draft
        elif self.phase == 6:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

        # Offseason - free agency
        elif self.phase == 7:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

    def update_play_menu(self, phase):
        # Preseason
        if self.phase == 0:
            show_menus = [False, False, False, False, False, False, False, False, True]

        # Regular season - pre trading deadline
        elif self.phase == 1:
            show_menus = [True, True, True, True, False, False, False, False, False]

        # Regular season - post trading deadline
        elif self.phase == 2:
            show_menus = [True, True, True, True, False, False, False, False, False]

        # Playoffs
        elif self.phase == 3:
            show_menus = [True, True, True, False, True, False, False, False, False]

        # Offseason - pre draft
        elif self.phase == 4:
            show_menus = [False, False, False, False, False, True, False, False, False]

        # Draft
        elif self.phase == 5:
            show_menus = [False, False, False, False, False, True, False, False, False]

        # Offseason - post draft
        elif self.phase == 6:
            show_menus = [False, False, False, False, False, False, True, False, False]

        # Offseason - free agency
        elif self.phase == 7:
            show_menus = [False, False, False, False, False, False, False, True, False]

        for i in range(len(self.menuitem_play)):
            self.menuitem_play[i].set_visible(show_menus[i])

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
            box += format % ('Total', '', team_stats['minutes'], '%s-%s' % (team_stats['field_goals_made'], team_stats['field_goals_attempted']), '%s-%s' % (team_stats['three_pointers_made'], team_stats['three_pointers_attempted']), '%s-%s' % (team_stats['free_throws_made'], team_stats['free_throws_attempted']), team_stats['offensive_rebounds'], rebounds, team_stats['assists'], team_stats['turnovers'], team_stats['steals'], team_stats['blocks'], team_stats['personal_fouls'], team_stats['points'])
            if (t==0):
                box += '\n'
            t += 1

        common.DB_CON.row_factory = None

        return box

    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        
        self.main_window = self.builder.get_object('main_window')
        self.menuitem_play = []
        self.menuitem_play.append(self.builder.get_object('menuitem_one_day'))
        self.menuitem_play.append(self.builder.get_object('menuitem_one_week'))
        self.menuitem_play.append(self.builder.get_object('menuitem_one_month'))
        self.menuitem_play.append(self.builder.get_object('menuitem_until_playoffs'))
        self.menuitem_play.append(self.builder.get_object('menuitem_through_playoffs'))
        self.menuitem_play.append(self.builder.get_object('menuitem_until_draft'))
        self.menuitem_play.append(self.builder.get_object('menuitem_until_free_agency'))
        self.menuitem_play.append(self.builder.get_object('menuitem_until_preseason'))
        self.menuitem_play.append(self.builder.get_object('menuitem_until_regular_season'))
        self.notebook = self.builder.get_object('notebook')
        self.statusbar = self.builder.get_object('statusbar')
        self.statusbar_context_id = self.statusbar.get_context_id('Main Window Statusbar')
        self.scrolledwindow_standings = self.builder.get_object('scrolledwindow_standings')
        self.combobox_standings = self.builder.get_object('combobox_standings')
        self.treeview_player_ratings = self.builder.get_object('treeview_player_ratings')
        self.treeview_player_stats = self.builder.get_object('treeview_player_stats')
        self.combobox_player_stats_season = self.builder.get_object('combobox_player_stats_season')
        self.treeview_team_stats = self.builder.get_object('treeview_team_stats')
        self.combobox_team_stats_season = self.builder.get_object('combobox_team_stats_season')
        self.treeview_games_list = self.builder.get_object('treeview_games_list')
        self.combobox_game_log_season = self.builder.get_object('combobox_game_log_season')
        self.combobox_game_log_team = self.builder.get_object('combobox_game_log_team')
        self.textview_box_score = self.builder.get_object('textview_box_score')
        self.textview_box_score.modify_font(pango.FontDescription("Monospace 8"))

        self.pages = dict(standings=0, finances=1, player_ratings=2, player_stats=3, team_stats=4, game_log=5, playoffs=6)
        # Set to True when treeview columns (or whatever) are set up
        self.built = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to True if data on this pane is current
        self.updated = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to true when a change is made
        self.unsaved_changes = False

        # Initialize combobox positions
        self.combobox_standings_active = 0
        self.combobox_player_stats_season_active = 0
        self.combobox_team_stats_season_active = 0
        self.combobox_game_log_season_active = 0
        self.combobox_game_log_team_active = common.PLAYER_TEAM_ID

        self.builder.connect_signals(self)

