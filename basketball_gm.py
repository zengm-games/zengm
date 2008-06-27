# This file implements the main window GUI

import sys
import gtk
import pango
import bz2
import mx.DateTime
import os
import random
import sqlite3
import shutil
import time

import common
import game_sim
import player_window

class main_window:
    def on_main_window_delete_event(self, widget, data=None):
        self.quit();
        return True

    # Menu Items
    def on_menuitem_new_activate(self, widget, data=None):
        '''
        First check if there are unsaved changes before starting a new game
        '''
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
            new_game_dialog = self.builder.get_object('new_game_dialog')
            new_game_dialog.set_transient_for(self.main_window)
            combobox_new_game_teams = self.builder.get_object('combobox_new_game_teams')
            combobox_new_game_teams.set_active(3)
            result = new_game_dialog.run()
            new_game_dialog.hide()
            team_id = combobox_new_game_teams.get_active()
            if result == gtk.RESPONSE_OK and team_id >= 0:
                self.new_game(team_id)

    def on_menuitem_open_activate(self, widget=None, data=None):
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
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

            if result:
                self.open_game(result)

    def on_menuitem_save_activate(self, widget, data=None):
        self.save_game()

    def on_menuitem_save_as_activate(self, widget=None, data=None):
        '''
        Return True if the game is saved, False otherwise
        '''
        buttons = (gtk.STOCK_CANCEL,gtk.RESPONSE_CANCEL,gtk.STOCK_SAVE,gtk.RESPONSE_OK)
        chooser = gtk.FileChooserDialog("Choose a location to save the game", self.main_window, gtk.FILE_CHOOSER_ACTION_SAVE, buttons)
        chooser.set_do_overwrite_confirmation(True)
        chooser.set_default_response(gtk.RESPONSE_OK)
        chooser.set_current_folder('saves')
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            # commit, close, copy to new location, open
            filename = chooser.get_filename()

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
        chooser.destroy()
        return returnval

    def on_menuitem_quit_activate(self, widget, data=None):
        self.quit()
        return True

    def on_menuitem_one_day_activate(self, widget, data=None):
        num_games = len(common.TEAMS)/2
        self.play_games(num_games)
        return True

    def on_menuitem_one_week_activate(self, widget, data=None):
        for i in range(100):
            t1 = time.time()
            self.play_games(82*len(common.TEAMS)/2)
            t2 = time.time()
            print t2-t1

    def on_menuitem_until_playoffs_activate(self, widget, data=None):
        row = common.DB_CON.execute('SELECT COUNT(*)/2 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        num_games = 82*len(common.TEAMS)/2 - row[0] # Number of games in a whole season - number of games already played this season
        self.play_games(num_games)
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
        elif (page_num == self.pages['roster']):
            if not self.built['roster']:
                self.build_roster()
            if not self.updated['roster']:
                self.update_roster()
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

    def on_treeview_roster_row_deleted(self, treemodel, path, data=None):
        '''
        When players are dragged and dropped in the roster screen, row-inserted
        and row-deleted are signaled, respectively.  This function is called on
        row-deleted to save the roster changes to the database.
        '''
        i = 1
        for row in treemodel:
            common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (i, row[0]))
            i += 1
        self.unsaved_changes = True
        return True

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Called from any player row in a treeview to open the player info window
        '''
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        player_id = treemodel.get_value(treeiter, 0)
        pw = player_window.player_window(player_id)
        return True

    def on_edited_average_playing_time(self, cell, path, new_text, model=None):
        '''
        Updates the average playing time in the roster page
        WHY IS THIS CALLED TWICE IF ROWS HAVE BEEN SWITCHED????
        '''
        average_playing_time = int(new_text)
        player_id = model[path][0]
        common.DB_CON.execute('UPDATE player_ratings SET average_playing_time = ? WHERE player_id = ?', (average_playing_time, player_id))
        self.unsaved_changes = True
        #print 'UPDATE', player_id, 'to', new_text
        #model[path][4] = int(new_text)
        #self.update_roster_info()
        self.update_roster()

    def on_treeview_games_list_cursor_changed(self, treeview, data=None):
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        game_id = treemodel.get_value(treeiter, 0)
        buffer = self.textview_box_score.get_buffer()
        buffer.set_text(self.box_score(game_id))
        return True

    # Pages
    def build_standings(self):
        column_info = [['Team', 'Won', 'Lost', 'Pct'],
                       [0,      1,     2,      3],
                       [False,  False, False, False],
                       [False,  False, False, True]]
        common.treeview_build(self.treeview_standings, column_info)
        self.built['standings'] = True

    def update_standings(self):
        season = self.make_season_combobox(self.combobox_standings, self.combobox_standings_active)

        column_types = [str, int, int, float]
        query = 'SELECT region || " "  || name, won, lost, 100*won/(won + lost) FROM team_attributes WHERE season = ? ORDER BY won/(won + lost) DESC'
        common.treeview_update(self.treeview_standings, column_types, query, (season,))
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
        query = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), 66, (SELECT (height + strength + speed + jumping + endurance + shooting_inside + shooting_layups + shooting_free_throws + shooting_two_pointers + shooting_three_pointers + blocks + steals + dribbling + passing + rebounding)/15 FROM player_ratings WHERE player_attributes.player_id = player_id), player_ratings.height, player_ratings.strength, player_ratings.speed, player_ratings.jumping, player_ratings.endurance, player_ratings.shooting_inside, player_ratings.shooting_layups, player_ratings.shooting_free_throws, player_ratings.shooting_two_pointers, player_ratings.shooting_three_pointers, player_ratings.blocks, player_ratings.steals, player_ratings.dribbling, player_ratings.passing, player_ratings.rebounding FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id'
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

    def build_roster(self):
        column_info = [['Name', 'Position', 'Rating', 'Average Playing Time'],
                       [1,      2,          3,        4],
                       [False,  False,      False,    False],
                       [False,  False,      False,    False]]
        renderer = gtk.CellRendererText()
        self.renderer_roster_editable = gtk.CellRendererText()
        self.renderer_roster_editable.set_property('editable', True)
        column = gtk.TreeViewColumn('Name', renderer, text=1)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Position', renderer, text=2)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Rating', renderer, text=3)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Average Playing Time', self.renderer_roster_editable, text=4)
        self.treeview_roster.append_column(column)

        # This treeview is used to list the positions to the left of the players
        column_info = [['',],
                       [0],
                       [False],
                       [False]]
        common.treeview_build(self.treeview_roster_info, column_info)
        self.built['roster'] = True

    def update_roster(self):
        # Roster info
        self.update_roster_info()

        # Roster list
        column_types = [int, str, str, int, int]
        query = 'SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, (player_ratings.height + player_ratings.strength + player_ratings.speed + player_ratings.jumping + player_ratings.endurance + player_ratings.shooting_inside + player_ratings.shooting_layups + player_ratings.shooting_free_throws + player_ratings.shooting_two_pointers + player_ratings.shooting_three_pointers + player_ratings.blocks + player_ratings.steals + player_ratings.dribbling + player_ratings.passing + player_ratings.rebounding)/15, player_ratings.average_playing_time FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'
        query_bindings = (common.PLAYER_TEAM_ID,)
        common.treeview_update(self.treeview_roster, column_types, query, query_bindings)
        model = self.treeview_roster.get_model()
        model.connect('row-deleted', self.on_treeview_roster_row_deleted);
        self.renderer_roster_editable.connect('edited', self.on_edited_average_playing_time, model)

        # Positions
        liststore = gtk.ListStore(str)
        self.treeview_roster_info.set_model(liststore)
        spots = ('PG', 'SG', 'SF', 'PF', 'C', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Inactive', 'Inactive', 'Inactive')
        for spot in spots:
            liststore.append([spot])
        self.updated['roster'] = True

    def update_roster_info(self):
        row = common.DB_CON.execute('SELECT 15 - COUNT(*), 240 - SUM(player_ratings.average_playing_time) FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ?', (common.PLAYER_TEAM_ID,)).fetchone()
        empty_roster_spots = row[0]
        extra_playing_time = row[1]
        if extra_playing_time == 0:
            playing_time_text = 'no unallocated playing time'
        elif extra_playing_time > 0:
            playing_time_text = '%d minutes of unallocated playing time' % extra_playing_time
        else:
            playing_time_text = '%d too many minutes of allocated playing time' % -extra_playing_time
        self.label_roster_info.set_markup('To edit your roster order, drag and drop players.\nTo edit a player\'s playing time, click the player\'s row, then click the player\'s current minutes and enter a new value.\n\nYou currently have <b>%d empty roster spots</b> and <b>%s</b>' % (empty_roster_spots, playing_time_text))

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
            self.update_standings()
        elif self.notebook.get_current_page() == self.pages['player_stats']:
            self.update_player_stats()
        elif self.notebook.get_current_page() == self.pages['team_stats']:
            self.update_team_stats()
        elif self.notebook.get_current_page() == self.pages['roster']:
            self.update_roster()
        elif self.notebook.get_current_page() == self.pages['game_log']:
            self.update_games_list()

    def update_all_pages(self):
        self.update_current_page()
        for key in self.updated.iterkeys():
            self.updated[key] = False

    def new_game(self, team_id):
        '''
        Starts a new game.  Call this only after checking for saves, etc.
        '''
        shutil.copyfile('database.sqlite', common.DB_TEMP_FILENAME)
        common.DB_FILENAME = common.DB_TEMP_FILENAME
        self.connect(team_id)

    def open_game(self, filename):
        common.DB_CON.close();
        common.DB_FILENAME = filename

        f = open(common.DB_FILENAME)
        data_bz2 = f.read()
        f.close()

        data = bz2.decompress(data_bz2)

        f = open(common.DB_TEMP_FILENAME, 'w')
        f.write(data)
        f.close()

        self.connect()

    def connect(self, team_id = -1):
        '''
        Connect to the database and get the team ID and season #
        If team_id is passed as a parameter, then this is being called from new_game and the team_id should be set in game_attributes
        '''
        common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
        common.DB_CON.isolation_level = 'IMMEDIATE'
        if team_id >= 0:
            common.DB_CON.execute('UPDATE game_attributes SET team_id = ?', (team_id,))
        common.PLAYER_TEAM_ID, common.SEASON = common.DB_CON.execute('SELECT team_id, season FROM game_attributes').fetchone()
        self.update_all_pages()
        self.unsaved_changes = False

    def save_game(self):
        if common.DB_FILENAME == common.DB_TEMP_FILENAME:
            return self.on_menuitem_save_as_activate()
        else:
            self.save_game_as(common.DB_FILENAME)
            return True

    def save_game_as(self, filename):
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

    def play_games(self, num_games):
        '''
        Plays the number of games set in num_games and updates pages
        After that, checks to see if the season is over (so make sure num_games makes sense!)
        '''
        game = game_sim.Game()
        for i in range(num_games):
            self.statusbar.push(self.statusbar_context_id, 'Playing game %d of %d...' % (i, num_games))
            while gtk.events_pending():
                gtk.main_iteration(False) # This stops everything from freezing
            t1 = random.randint(0, len(common.TEAMS)-1)
            while True:
                t2 = random.randint(0, len(common.TEAMS)-1)
                if t1 != t2:
                    break
            game.play(common.TEAMS[t1], common.TEAMS[t2])
            game.write_stats()
            self.statusbar.pop(self.statusbar_context_id)

        # Make sure we are looking at this year's standings, stats, and games after playing some games
        self.combobox_standings_active = 0
        self.combobox_player_stats_season_active = 0
        self.combobox_team_stats_season_active = 0
        self.combobox_game_log_season_active = 0
        self.combobox_game_log_team_active = common.PLAYER_TEAM_ID

        # Check to see if the season is over
        row = common.DB_CON.execute('SELECT COUNT(*)/2 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        games_played = row[0]
        games_in_season = 82*len(common.TEAMS)/2
        if games_played == games_in_season:
            # DISPLAY SEASON AWARDS DIALOG HERE
            common.DB_CON.execute('UPDATE game_attributes SET season = season + 1')
            common.SEASON += 1
            #common.DB_CON.execute('UPDATE team_attributes SET won = 0, lost = 0') # Reset won/lost cache
            # Create new rows in team_attributes
            for row in common.DB_CON.execute('SELECT team_id, region, name, abbreviation FROM team_attributes WHERE season = ?', (common.SEASON-1,)):
                common.DB_CON.execute('INSERT INTO team_attributes (team_id, region, name, abbreviation, season) VALUES (?, ?, ?, ?, ?)', (row[0], row[1], row[2], row[3], common.SEASON))

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

    def quit(self):
        proceed = False
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                proceed = True
        if not self.unsaved_changes or proceed:
            common.DB_CON.close()
            os.remove('temp.sqlite')
            gtk.main_quit()

    def box_score(self, game_id):
        return 'BOX SCORE GOES HERE'
#        # Record who the starters are
#        format = '%-23s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s\n'
#        box = ''
#        for t in range(2):
#            team_name_long = self.team[t].region + ' ' + self.team[t].name
#            dashes = ''
#            for i in range(len(team_name_long)):
#                dashes += '-'
#            box += team_name_long + '\n' + dashes + '\n'
#            box += format % ('Name', 'Pos', 'Min', 'FG', '3Pt', 'FT', 'Off', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts')
#            for p in range(self.team[t].num_players):
#                rebounds = self.team[t].player[p].stat['offensive_rebounds'] + self.team[t].player[p].stat['defensive_rebounds']
#                box += format % (self.team[t].player[p].attribute['name'], self.team[t].player[p].attribute['position'], int(round(self.team[t].player[p].stat['minutes'])), '%s-%s' % (self.team[t].player[p].stat['field_goals_made'], self.team[t].player[p].stat['field_goals_attempted']), '%s-%s' % (self.team[t].player[p].stat['three_pointers_made'], self.team[t].player[p].stat['three_pointers_attempted']), '%s-%s' % (self.team[t].player[p].stat['free_throws_made'], self.team[t].player[p].stat['free_throws_attempted']), self.team[t].player[p].stat['offensive_rebounds'], rebounds, self.team[t].player[p].stat['assists'], self.team[t].player[p].stat['turnovers'], self.team[t].player[p].stat['steals'], self.team[t].player[p].stat['blocks'], self.team[t].player[p].stat['personal_fouls'], self.team[t].player[p].stat['points'])
#            rebounds = self.team[t].stat['offensive_rebounds'] + self.team[t].stat['defensive_rebounds']
#            box += format % ('Total', '', int(round(self.team[t].stat['minutes'])), '%s-%s' % (self.team[t].stat['field_goals_made'], self.team[t].stat['field_goals_attempted']), '%s-%s' % (self.team[t].stat['three_pointers_made'], self.team[t].stat['three_pointers_attempted']), '%s-%s' % (self.team[t].stat['free_throws_made'], self.team[t].stat['free_throws_attempted']), self.team[t].stat['offensive_rebounds'], rebounds, self.team[t].stat['assists'], self.team[t].stat['turnovers'], self.team[t].stat['steals'], self.team[t].stat['blocks'], self.team[t].stat['personal_fouls'], self.team[t].stat['points'])
#            if (t==0):
#                box += '\n'

    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        
        self.main_window = self.builder.get_object('main_window')
        self.notebook = self.builder.get_object('notebook')
        self.statusbar = self.builder.get_object('statusbar')
        self.statusbar_context_id = self.statusbar.get_context_id('Main Window Statusbar')
        self.treeview_standings = self.builder.get_object('treeview_standings')
        self.combobox_standings = self.builder.get_object('combobox_standings')
        self.treeview_player_ratings = self.builder.get_object('treeview_player_ratings')
        self.treeview_player_stats = self.builder.get_object('treeview_player_stats')
        self.combobox_player_stats_season = self.builder.get_object('combobox_player_stats_season')
        self.treeview_team_stats = self.builder.get_object('treeview_team_stats')
        self.combobox_team_stats_season = self.builder.get_object('combobox_team_stats_season')
        self.label_roster_info = self.builder.get_object('label_roster_info')
        self.treeview_roster = self.builder.get_object('treeview_roster')
        self.treeview_roster_info = self.builder.get_object('treeview_roster_info')
        self.treeview_games_list = self.builder.get_object('treeview_games_list')
        self.combobox_game_log_season = self.builder.get_object('combobox_game_log_season')
        self.combobox_game_log_team = self.builder.get_object('combobox_game_log_team')
        self.textview_box_score = self.builder.get_object('textview_box_score')
        self.textview_box_score.modify_font(pango.FontDescription("Monospace 8"))

        self.pages = dict(standings=0, finances=1, player_ratings=2, player_stats=3, team_stats=4, roster=5, game_log=6, playoffs=7)
        # Set to True when treeview columns (or whatever) are set up
        self.built = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, roster=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to True if data on this pane is current
        self.updated = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, roster=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to true when a change is made
        self.unsaved_changes = False

        # Initialize combobox positions
        self.combobox_standings_active = 0
        self.combobox_player_stats_season_active = 0
        self.combobox_team_stats_season_active = 0
        self.combobox_game_log_season_active = 0
        self.combobox_game_log_team_active = common.PLAYER_TEAM_ID

        self.build_standings() # Updated in new_game

        self.new_game(3)

        self.builder.connect_signals(self)

        self.main_window.show()

if __name__ == '__main__':
    mw = main_window()
    gtk.main()

