# This file implements the main window GUI

import sys
import gtk
import pango
import mx.DateTime
import random
import sqlite3
import shutil

import common
import game_sim
import player_window

class main_window:
    def on_window_destroy(self, widget, data=None):
        gtk.main_quit()

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
            filter.add_pattern('*.sqlite')
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
            print filename
            self.save_game_as(filename)
            self.open_game(filename)
            returnval = True
        else:
            returnval = False
        chooser.destroy()
        return returnval

    def on_menuitem_quit_activate(self, widget, data=None):
        gtk.main_quit()

    def on_menuitem_one_day_activate(self, widget, data=None):
        num_games = len(common.TEAMS)/2
        self.play_games(num_games)
        return True

    def on_menuitem_season_activate(self, widget, data=None):
        row = common.DB_CON.execute('SELECT COUNT(*)/2 FROM team_stats WHERE season = 2007').fetchone()
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

    def on_treeview_games_list_cursor_changed(self, treeview, data=None):
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        game_id = treemodel.get_value(treeiter, 0)
        f = open('box_scores/%d.txt' % game_id, 'r')
        box_score = f.read()
        f.close()
        buffer = self.textview_box_score.get_buffer()
        buffer.set_text(box_score)
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
        column_types = [str, int, int, float]
        query = 'SELECT region || " "  || name, won, lost, 100*won/(won + lost) FROM team_attributes ORDER BY won/(won + lost) DESC'
        common.treeview_update(self.treeview_standings, column_types, query)
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
        column_types = [int, int, str, str, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        query = 'SELECT player_attributes.player_id, player_attributes.team_id, player_attributes.name, (SELECT abbreviation FROM team_attributes WHERE team_id = player_attributes.team_id), COUNT(*), SUM(player_stats.starter), AVG(player_stats.minutes), AVG(player_stats.field_goals_made), AVG(player_stats.field_goals_attempted), AVG(100*player_stats.field_goals_made/player_stats.field_goals_attempted), AVG(player_stats.three_pointers_made), AVG(player_stats.three_pointers_attempted), AVG(100*player_stats.three_pointers_made/player_stats.three_pointers_attempted), AVG(player_stats.free_throws_made), AVG(player_stats.free_throws_attempted), AVG(100*player_stats.free_throws_made/player_stats.free_throws_attempted), AVG(player_stats.offensive_rebounds), AVG(player_stats.defensive_rebounds), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists), AVG(player_stats.turnovers), AVG(player_stats.steals), AVG(player_stats.blocks), AVG(player_stats.personal_fouls), AVG(player_stats.points) FROM player_attributes, player_stats WHERE player_attributes.player_id = player_stats.player_id GROUP BY player_attributes.player_id'
        common.treeview_update(self.treeview_player_stats, column_types, query)
        self.updated['player_stats'] = True

    def build_team_stats(self):
        column_info = [['Team', 'G',   'W',   'L',   'FGM', 'FGA', 'FG%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'Oreb', 'Dreb', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'PPG', 'OPPG'],
                       [0,      1,     2,     3,     4,     5,     6,     7,     8,     9,     10,    11,    12,    13,     14,     15,    16,    17,   18,    19,    20,   21,    22],
                       [True,   True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True],
                       [False,  False, False, False, True,  True,  True,  True,  True,  True,  True,  True,  True,  True,  True,    True,  True,  True, True,  True,  True, True,  True]]
        common.treeview_build(self.treeview_team_stats, column_info)
        self.built['team_stats'] = True

    def update_team_stats(self):
        column_types = [str, int, int, int, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float, float]
        query = 'SELECT abbreviation, COUNT(*), SUM(team_stats.won), COUNT(*)-SUM(team_stats.won), AVG(team_stats.field_goals_made), AVG(team_stats.field_goals_attempted), AVG(100*team_stats.field_goals_made/team_stats.field_goals_attempted), AVG(team_stats.three_pointers_made), AVG(team_stats.three_pointers_attempted), AVG(100*team_stats.three_pointers_made/team_stats.three_pointers_attempted), AVG(team_stats.free_throws_made), AVG(team_stats.free_throws_attempted), AVG(100*team_stats.free_throws_made/team_stats.free_throws_attempted), AVG(team_stats.offensive_rebounds), AVG(team_stats.defensive_rebounds), AVG(team_stats.offensive_rebounds + team_stats.defensive_rebounds), AVG(team_stats.assists), AVG(team_stats.turnovers), AVG(team_stats.steals), AVG(team_stats.blocks), AVG(team_stats.personal_fouls), AVG(team_stats.points), AVG(team_stats.opponent_points) FROM team_attributes, team_stats WHERE team_attributes.team_id = team_stats.team_id GROUP BY team_stats.team_id'
        common.treeview_update(self.treeview_team_stats, column_types, query)
        self.updated['team_stats'] = True

    def build_roster(self):
        column_info = [['Name', 'Position', 'Rating', 'Minutes'],
                       [1,      2,          3,        4],
                       [False,  False,      False,    False],
                       [False,  False,      False,    False]]
        common.treeview_build(self.treeview_roster, column_info)
        column_info = [['',],
                       [0],
                       [False],
                       [False]]
        common.treeview_build(self.treeview_roster_info, column_info)
        self.built['roster'] = True

    def update_roster(self):
        column_types = [int, str, str, int, int]
        query = 'SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, (player_ratings.height + player_ratings.strength + player_ratings.speed + player_ratings.jumping + player_ratings.endurance + player_ratings.shooting_inside + player_ratings.shooting_layups + player_ratings.shooting_free_throws + player_ratings.shooting_two_pointers + player_ratings.shooting_three_pointers + player_ratings.blocks + player_ratings.steals + player_ratings.dribbling + player_ratings.passing + player_ratings.rebounding)/15, player_ratings.average_playing_time FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'
        query_bindings = (common.PLAYER_TEAM_ID,)
        common.treeview_update(self.treeview_roster, column_types, query, query_bindings)
        model = self.treeview_roster.get_model()
        model.connect('row-deleted', self.on_treeview_roster_row_deleted);

        liststore = gtk.ListStore(str)
        self.treeview_roster_info.set_model(liststore)
        spots = ('PG', 'SG', 'SF', 'PF', 'C', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Inactive', 'Inactive', 'Inactive')
        for spot in spots:
            liststore.append([spot])
        self.updated['roster'] = True

    def build_games_list(self):
        column_info = [['Opponent', 'W/L', 'Score'],
                       [1,          2,     3],
                       [True,       True,  False],
                       [False,      False, False]]
        common.treeview_build(self.treeview_games_list, column_info)
        self.built['games_list'] = True

    def update_games_list(self):
        column_types = [int, str, str, str]
        query = 'SELECT game_id, (SELECT abbreviation FROM team_attributes WHERE team_id = team_stats.opponent_team_id), (SELECT val FROM enum_w_l WHERE key = team_stats.won), points || "-" || opponent_points FROM team_stats WHERE team_id = ?'
        query_bindings = (common.PLAYER_TEAM_ID,)
        common.treeview_update(self.treeview_games_list, column_types, query, query_bindings)
        self.updated['games_list'] = True

    def update_current_page(self):
        if self.notebook.get_current_page() == self.pages['standings']:
            self.update_standings()
        elif self.notebook.get_current_page() == self.pages['player_stats']:
            self.update_player_stats()
        elif self.notebook.get_current_page() == self.pages['team_stats']:
            self.update_team_stats()
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
        common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
        common.DB_CON.isolation_level = 'IMMEDIATE'
        self.update_all_pages()
        self.unsaved_changes = False

    def open_game(self, filename):
        common.DB_CON.close();
        common.DB_FILENAME = filename
        shutil.copyfile(common.DB_FILENAME, common.DB_TEMP_FILENAME)
        common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
        common.DB_CON.isolation_level = 'IMMEDIATE'
        self.update_all_pages()
        self.unsaved_changes = False

    def save_game(self):
        if common.DB_FILENAME == common.DB_TEMP_FILENAME:
            return self.on_menuitem_save_as_activate()
        else:
            common.DB_CON.commit()
            shutil.copyfile(common.DB_TEMP_FILENAME, common.DB_FILENAME)
            self.unsaved_changes = False
            return True

    def save_game_as(self, filename):
        common.DB_CON.commit()
        shutil.copyfile(common.DB_TEMP_FILENAME, filename)

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
            game.box_score()
            self.statusbar.pop(self.statusbar_context_id)
        self.update_all_pages()
        self.unsaved_changes = True

        # Check to see if the season is over
        row = common.DB_CON.execute('SELECT COUNT(*)/2 FROM team_stats WHERE season = (SELECT season FROM game_attributes)').fetchone()
        games_played = row[0]
        games_in_season = 82*len(common.TEAMS)/2
        if games_played == games_in_season:
            print "SEASON OVER!"

    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        
        self.main_window = self.builder.get_object('main_window')
        self.notebook = self.builder.get_object('notebook')
        self.statusbar = self.builder.get_object('statusbar')
        self.statusbar_context_id = self.statusbar.get_context_id('Main Window Statusbar')
        self.treeview_standings = self.builder.get_object('treeview_standings')
        self.treeview_player_ratings = self.builder.get_object('treeview_player_ratings')
        self.treeview_player_stats = self.builder.get_object('treeview_player_stats')
        self.treeview_team_stats = self.builder.get_object('treeview_team_stats')
        self.treeview_roster = self.builder.get_object('treeview_roster')
        self.treeview_roster_info = self.builder.get_object('treeview_roster_info')
        self.treeview_games_list = self.builder.get_object('treeview_games_list')
        self.textview_box_score = self.builder.get_object('textview_box_score')
        self.textview_box_score.modify_font(pango.FontDescription("Monospace 8"))

        self.pages = dict(standings=0, finances=1, player_ratings=2, player_stats=3, team_stats=4, roster=5, game_log=6, playoffs=7)
        # Set to True when treeview columns (or whatever) are set up
        self.built = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, roster=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to True if data on this pane is current
        self.updated = dict(standings=False, finances=False, player_ratings=False, player_stats=False, team_stats=False, roster=False, games_list=False, playoffs=False, player_window_stats=False, player_window_game_log=False)
        # Set to true when a change is mad
        self.unsaved_changes = False

        self.new_game(common.PLAYER_TEAM_ID)

        self.build_standings()
        self.update_standings()

        self.builder.connect_signals(self)

        self.main_window.show()

if __name__ == '__main__':
    mw = main_window()
    gtk.main()

