# This file implements the main window GUI.  It is rather large and
# unorganized, and it should probably be refactored.

# Python modules
import bz2
import cPickle as pickle
import gtk
import os
import pango
import random
import sqlite3
import shutil
import time
import webkit

# My modules
from bbgm import common
from bbgm.core import game_sim, player, schedule

# Windows and dialogs
from bbgm.views import contract_window, draft_dialog, free_agents_window, retired_players_window, roster_window, player_window, season_end_window, team_history_window, trade_window, welcome_dialog

# Tabs
from bbgm.views import standings_tab, finances_tab, player_ratings_tab, player_stats_tab, team_stats_tab, game_log_tab, playoffs_tab

class MainWindow:
    def on_main_window_delete_event(self, widget, data=None):
        return self.quit() # If false, proceed to on_main_window_destroy. Otherwise, it was cancelled.

    def on_main_window_destroy(self, widget, data=None):
        gtk.main_quit()

    def on_placeholder(self, widget, data=None):
        md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, 'Sorry, this feature isn\'t implemented yet.')
        md.run()
        md.destroy()

    # Menu Items
    def on_menuitem_new_activate(self, widget=None, data=None):
        '''
        First check if there are unsaved changes before starting a new game
        '''
        if self.games_in_progress:
            self.stop_games = True
            md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, 'Can\'t start a new game while simulation is in progress.  Wait until the current day\'s games are over and try again.')
            md.run()
            md.destroy()
        else:
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
        if self.games_in_progress:
            self.stop_games = True
            md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, 'Can\'t open game while simulation is in progress.  Wait until the current day\'s games are over and try again.')
            md.run()
            md.destroy()
        else:
            proceed = False
            if self.unsaved_changes:
                if self.save_nosave_cancel():
                    proceed = True
            if not self.unsaved_changes or proceed:
                result = self.open_game_dialog()
                if result:
                    self.open_game(result)

    def on_menuitem_save_activate(self, widget, data=None):
        if self.games_in_progress:
            self.stop_games = True
            md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, 'Can\'t save game while simulation is in progress.  Wait until the current day\'s games are over and try again.')
            md.run()
            md.destroy()
        else:
            self.save_game()

    def on_menuitem_save_as_activate(self, widget, data=None):
        if self.games_in_progress:
            self.stop_games = True
            md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_WARNING, gtk.BUTTONS_CLOSE, 'Can\'t save game while simulation is in progress.  Wait until the current day\'s games are over and try again.')
            md.run()
            md.destroy()
        else:
            self.save_game_dialog()

    def on_menuitem_quit_activate(self, widget, data=None):
        if not self.quit():
            gtk.main_quit()
        return True

    def on_menuitem_roster_activate(self, widget, data=None):
        if not hasattr(self, 'rw'):
            self.rw = roster_window.RosterWindow(self)
        else:
            self.rw.update_roster()
            if self.rw.roster_window.flags() & gtk.VISIBLE:
                self.rw.roster_window.window.show() # Raise the window if it's in the background
            else:
                self.rw.roster_window.show() # Show the window
        return True

    def on_menuitem_team_history_activate(self, widget, data=None):
        if not hasattr(self, 'thw'):
            self.thw = team_history_window.TeamHistoryWindow(self)
        self.thw.update()
        self.thw.team_history_window.show() # Show the dialog
        self.thw.team_history_window.window.show() # Raise the dialog if it's in the background
        return True

    def on_menuitem_trade_activate(self, widget, data=None):
        tw = trade_window.TradeWindow(self)
        tw.trade.clear_offer() # Clear previous trade offer
        response = tw.trade_window.run()
        tw.trade_window.destroy()
        return True

    def on_menuitem_free_agents_activate(self, widget, data=None):
        if not hasattr(self, 'faw'):
            self.faw = free_agents_window.FreeAgentsWindow(self)
        else:
            self.faw.update_free_agents()
            if self.faw.free_agents_window.flags() & gtk.VISIBLE:
                self.faw.free_agents_window.window.show() # Raise the window if it's in the background
            else:
                self.faw.free_agents_window.show() # Show the window
        return True

    def on_menuitem_stop_activate(self, widget, data=None):
        self.stop_games = True
        return True

    def on_menuitem_one_day_activate(self, widget, data=None):
        if self.phase >= 1 and self.phase <= 3:
            self.play_games(1)
        return True

    def on_menuitem_one_week_activate(self, widget, data=None):
        if self.phase != 3:
            row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
            num_days = common.SEASON_LENGTH - row[0] # Number of days remaining
            if num_days > 7:
                num_days = 7
        else:
            num_days = 7
        self.play_games(num_days)
        return True

    def on_menuitem_one_month_activate(self, widget, data=None):
        if self.phase != 3:
            row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
            num_days = common.SEASON_LENGTH - row[0] # Number of days remaining
            if num_days > 30:
                num_days = 30
        else:
            num_days = 30
        self.play_games(num_days)
        return True

    def on_menuitem_until_playoffs_activate(self, widget, data=None):
        row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        num_days = common.SEASON_LENGTH - row[0] # Number of days remaining
        self.play_games(num_days)
        return True

    def on_menuitem_through_playoffs_activate(self, widget, data=None):
        self.play_games(100) # There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
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

    # PyGTK FAQ entry 10.13
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
    def on_notebook_switch_page(self, widget, page, page_num, data=None):
        print 'on_notebook_switch_page', page_num
        if (page_num == self.pages['standings']):
            if not self.standings.updated:
                self.standings.update()
        elif (page_num == self.pages['finances']):
            if not self.finances.updated:
                self.finances.update()
        elif (page_num == self.pages['player_ratings']):
            if not self.player_ratings.updated:
                self.player_ratings.update()
        elif (page_num == self.pages['player_stats']):
            if not self.player_stats.updated:
                self.player_stats.update()
        elif (page_num == self.pages['team_stats']):
            if not self.team_stats.updated:
                self.team_stats.update()
        elif (page_num == self.pages['game_log']):
            if not self.game_log.updated:
                self.game_log.update()
        elif (page_num == self.pages['playoffs']):
            if not self.playoffs.updated:
                self.playoffs.update()

    # Events in the main notebook
    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Called from any player row in a treeview to open the player info window
        '''
        (treemodel, treeiter) = treeview.get_selection().get_selected()
        player_id = treemodel.get_value(treeiter, 0)
        if not hasattr(self, 'pw'):
            self.pw = player_window.PlayerWindow(self)
        self.pw.update_player(player_id)
        return True

    # Pages
    def update_current_page(self):
        print 'update_current_page'
        if self.notebook.get_current_page() == self.pages['standings']:
            if not self.standings.built:
                self.standings.build()
            self.standings.update()
        elif self.notebook.get_current_page() == self.pages['finances']:
            if not self.finances.built:
                self.finances.build()
            self.finances.update()
        elif self.notebook.get_current_page() == self.pages['player_ratings']:
            if not self.player_ratings.built:
                self.player_ratings.build()
            self.player_ratings.update()
        elif self.notebook.get_current_page() == self.pages['player_stats']:
            if not self.player_stats.built:
                self.player_stats.build()
            self.player_stats.update()
        elif self.notebook.get_current_page() == self.pages['team_stats']:
            if not self.team_stats.built:
                self.team_stats.build()
            self.team_stats.update()
        elif self.notebook.get_current_page() == self.pages['game_log']:
            if not self.game_log.built:
                self.game_log.build()
            self.game_log.update()
        elif self.notebook.get_current_page() == self.pages['playoffs']:
            self.playoffs.update()

    def update_all_pages(self):
        '''
        Update the current page and mark all other pages to be updated when they are next viewed.
        '''
        for key in self.updated.iterkeys():
            self.updated[key] = False

        self.standings.updated = False
        self.finances.updated = False
        self.player_ratings.updated = False
        self.player_stats.updated = False
        self.team_stats.updated = False
        self.game_log.updated = False
        self.playoffs.updated = False
        self.update_current_page()

        if hasattr(self, 'rw') and (self.rw.roster_window.flags() & gtk.VISIBLE):
            self.rw.update_roster()

        if hasattr(self, 'thw') and (self.thw.team_history_window.flags() & gtk.VISIBLE):
            self.thw.update()

        if hasattr(self, 'faw') and (self.faw.free_agents_window.flags() & gtk.VISIBLE):
            self.faw.update_free_agents()

        if hasattr(self, 'pw') and (self.pw.player_window.flags() & gtk.VISIBLE):
           self.pw.update_player(-1)

    def new_game(self, team_id):
        '''
        Starts a new game.  Call this only after checking for saves, etc.
        '''

        self.new_game_progressbar_window = self.builder.get_object('new_game_progressbar_window')
        self.progressbar_new_game = self.builder.get_object('progressbar_new_game')
        self.new_game_progressbar_window.set_transient_for(self.main_window)
        self.progressbar_new_game.set_fraction(0.0)
        self.progressbar_new_game.set_text('Generating new players')
        while gtk.events_pending():
            gtk.main_iteration(False)
        self.new_game_progressbar_window.show()

        while gtk.events_pending():
            gtk.main_iteration(False)

        # Delete old database
        if os.path.exists(common.DB_TEMP_FILENAME):
            os.remove(common.DB_TEMP_FILENAME)

        # Generate new players
        profiles = ['Point', 'Wing', 'Big', '']
        gp = player.GeneratePlayer()
        sql = ''
        player_id = 1
        for t in range(-1, 30):
            good_neutral_bad = random.randrange(-1, 2) # Determines if this will be a good team or not

            self.progressbar_new_game.set_fraction(0.6*(t+1)/31.0)
            while gtk.events_pending():
                gtk.main_iteration(False)
#            base_ratings = [40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29]
            base_ratings = [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19]
            potentials = [70, 60, 50, 50, 55, 45, 65, 35, 50, 45, 55, 55]
            random.shuffle(potentials)
            for p in range(12):
                i = random.randrange(len(profiles))
                profile = profiles[i]

                aging_years = random.randint(0,19)

                draft_year = common.SEASON - 1 - aging_years

                gp.new(player_id, t, 19, profile, base_ratings[p], potentials[p], draft_year)
                gp.develop(aging_years)
                if p < 5:
                    gp.bonus(good_neutral_bad*random.randint(0,20))
                if t == -1: # Free agents
                    gp.bonus(-15)
                # Update contract based on development
                gp.attribute['contract_amount'], gp.attribute['contract_expiration'] = gp.contract()

                sql += gp.sql_insert()

                player_id += 1
        self.players_sql = sql

        self.progressbar_new_game.set_fraction(0.6)
        self.progressbar_new_game.set_text('Creating database')
        while gtk.events_pending():
            gtk.main_iteration(False)

        # Create new database
        common.DB_FILENAME = common.DB_TEMP_FILENAME
        self.connect(team_id)

        self.progressbar_new_game.set_fraction(1)
        self.progressbar_new_game.set_text('Done') # Not really, but close
        while gtk.events_pending():
            gtk.main_iteration(False)

        # Make schedule, start season
        self.new_phase(1)

        #Auto sort player's roster
        common.roster_auto_sort(common.PLAYER_TEAM_ID)

        # Make standings treeviews based on league_* tables
#        self.standings.build()

        self.update_all_pages()

        self.new_game_progressbar_window.hide()

    def open_game(self, filename):
        # See if it's a valid bz2 file
        try:
            f = open(filename)
            data_bz2 = f.read()
            f.close()

            data = bz2.decompress(data_bz2)
        except IOError:
            md = gtk.MessageDialog(self.main_window, gtk.DIALOG_MODAL | gtk.DIALOG_DESTROY_WITH_PARENT, gtk.MESSAGE_ERROR, gtk.BUTTONS_OK)
            md.set_markup("<span size='large' weight='bold'>Cannot load file '%s'.</span>\n\nThe file either not a BBGM save file or it is corrupted." % filename)
            md.run()
            md.destroy()

            # Show the welcome dialog if the user doesn't already have a game active
            if not hasattr(common, 'DB_CON'):
                welcome_dialog.WelcomeDialog(self)

            return False
        
        # Close the connection if there is one open.  If not, do nothing.
        try:
            common.DB_CON.close();
        except:
            pass

        # Write decompressed data from the save file to the temp SQLite DB file
        f = open(common.DB_TEMP_FILENAME, 'w')
        f.write(data)
        f.close()

        common.DB_FILENAME = filename

        self.connect()

        self.update_play_menu(self.phase)

        return True

    def connect(self, team_id = -1):
        '''
        Connect to the database
        Get the team ID, season #, and schedule
        If team_id is passed as a parameter, then this is being called from new_game and the schema should be loaded and the team_id should be set in game_attributes
        '''
        common.DB_CON = sqlite3.connect(common.DB_TEMP_FILENAME)
        common.DB_CON.execute('PRAGMA synchronous=OFF')
        common.DB_CON.isolation_level = 'IMMEDIATE'
        if team_id >= 0:
            # Starting a new game, so load data into the database and update the progressbar
            for fn in ['tables.sql', 'league.sql', 'teams.sql', 'players.sql']:
                c = common.DB_CON.cursor()
                if fn == 'tables.sql':
                    # tables.sql contains multiline queries, so this is easier
                    f = open(os.path.join(common.DATA_FOLDER, fn))
                    data = f.read()
                    f.close()
                    common.DB_CON.executescript(data)
                elif fn == 'players.sql':
                    for line in self.players_sql.split('\n'):
                        c.execute(line)
                    f.close()
                    del self.players_sql
                else:
                    # This method is faster for bulk queries though
                    f = open(os.path.join(common.DATA_FOLDER, fn))
                    for line in f.readlines():
                        c.execute(line)
                    f.close()
                common.DB_CON.commit()
                c.close()

                self.progressbar_new_game.set_fraction(self.progressbar_new_game.get_fraction()+0.1)
                while gtk.events_pending():
                    gtk.main_iteration(False)
            common.DB_CON.execute('UPDATE game_attributes SET team_id = ?', (team_id,))
        row = common.DB_CON.execute('SELECT team_id, season, phase, schedule FROM game_attributes').fetchone()
        common.PLAYER_TEAM_ID = row[0]
        common.SEASON = row[1]
        self.phase = row[2]

        # Now that the database is set, we can build the tabs
        if not self.standings.built:
            self.standings.build()
        if not self.finances.built:
            self.finances.build()
        if not self.player_ratings.built:
            self.player_ratings.build()
        if not self.player_stats.built:
            self.player_stats.build()
        print self.team_stats.built
        if not self.team_stats.built:
            self.team_stats.build()
        if not self.game_log.built:
            self.game_log.build()
        if not self.playoffs.built:
            self.playoffs.build()

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

        self.games_in_progress = True

        # Update the Play menu so the simulations can be stopped
        self.update_play_menu(-1)

        game = game_sim.Game()
        for d in range(num_days):

            # Check if it's the playoffs and do some special stuff if it is
            if self.phase == 3:
                # Make today's  playoff schedule
                active_series = False
                num_active_teams = 0
                # Round: 1, 2, 3, or 4
                current_round, = common.DB_CON.execute('SELECT MAX(series_round) FROM active_playoff_series').fetchone()

                for team_id_home, team_id_away in common.DB_CON.execute('SELECT team_id_home, team_id_away FROM active_playoff_series WHERE won_home < 4 AND won_away < 4 AND series_round = ?', (current_round,)):
                    self.schedule.append([team_id_home, team_id_away])
                    active_series = True
                    num_active_teams += 2
                if not active_series:
                    # The previous round is over

                    # Who won?
                    winners = {}
                    for series_id, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away in common.DB_CON.execute('SELECT series_id, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away FROM active_playoff_series WHERE series_round = ? ORDER BY series_id ASC', (current_round,)):    
                        if won_home == 4:
                            winners[series_id] = [team_id_home, seed_home]
                        else:
                            winners[series_id] = [team_id_away, seed_away]
                        # Record user's team as conference and league champion
                        if winners[series_id][0] == common.PLAYER_TEAM_ID and current_round == 3:
                            common.DB_CON.execute('UPDATE team_attributes SET won_conference = 1 WHERE season = ? AND team_id = ?', (common.SEASON, common.PLAYER_TEAM_ID))
                        elif winners[series_id][0] == common.PLAYER_TEAM_ID and current_round == 4:
                            common.DB_CON.execute('UPDATE team_attributes SET won_championship = 1 WHERE season = ? AND team_id = ?', (common.SEASON, common.PLAYER_TEAM_ID))

                    # Are the whole playoffs over?
                    if current_round == 4:
                        self.new_phase(4)
                        break

                    # Add a new round to the database
                    series_id = 1
                    current_round += 1
                    query = 'INSERT INTO active_playoff_series (series_id, series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (?, ?, ?, ?, ?, ?, 0, 0)'
                    for i in range(1, len(winners), 2): # Go through winners by 2
                        if winners[i][1] < winners[i+1][1]: # Which team is the home team?
                            new_series = (series_id, current_round, winners[i][0], winners[i+1][0], winners[i][1], winners[i+1][1])
                        else:
                            new_series = (series_id, current_round, winners[i+1][0], winners[i][0], winners[i+1][1], winners[i][1])
                        common.DB_CON.execute(query, new_series)
                        series_id += 1
                    self.playoffs.updated = False
                    continue
            else:
                # Sign available free agents
                self.auto_sign_free_agents()

            # If the user wants to stop the simulation, then stop the simulation
            if d == 0: # But not on the first day
                self.stop_games = False
            if self.stop_games:
                self.stop_games = False
                break

            if self.phase != 3:
                num_active_teams = len(common.TEAMS)

            self.statusbar.push(self.statusbar_context_id, 'Playing day %d of %d...' % (d, num_days))
            for i in range(num_active_teams/2):
                teams = self.schedule.pop()

                while gtk.events_pending():
                    gtk.main_iteration(False)
#                t1 = random.randint(0, len(common.TEAMS)-1)
#                while True:
#                    t2 = random.randint(0, len(common.TEAMS)-1)
#                    if t1 != t2:
#                        break
                game.play(teams[0], teams[1], self.phase == 3)
                game.write_stats()
            if self.phase == 3:
                self.playoffs.updated = False
                time.sleep(0.3) # Or else it updates too fast to see what's going on
            self.update_all_pages()
            self.statusbar.pop(self.statusbar_context_id)

        # Restore the Play menu to its previous glory
        self.update_play_menu(self.phase)

        # Make sure we are looking at this year's standings, stats, and games after playing some games
        self.standings.combobox_active = 0
        self.player_stats.combobox_season_active = 0
#        self.player_stats.combobox_team_active = common.PLAYER_TEAM_ID+1
        self.team_stats.combobox_season_active = 0
        self.game_log.combobox_season_active = 0
#        self.game_log.combobox_team_active = common.PLAYER_TEAM_ID

        season_over = False
        if self.phase == 3:
            self.playoffs.updated = False
        else:
            # Check to see if the season is over
            row = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
            days_played = row[0]
            if days_played == common.SEASON_LENGTH:
                season_over = True

                sew = season_end_window.SeasonEndWindow(self)
                sew.season_end_window.show() # Show the window
                sew.season_end_window.window.show() # Raise the window if it's in the background

                self.new_phase(3) # Start playoffs

        self.update_all_pages()
        self.unsaved_changes = True
        self.games_in_progress = False

    def make_season_combobox(self, combobox, active):
        """Make season combobox and return the active season.

        Populates a combobox with the list of seasons in the game, and keeps
        updating it each time the function is called as seasons are added.

        The season (year) of the active combobox row is returned.

        Args:
            combobox: The combobox for the seasons menu.
            active: The index of the active row of the ListStore, typically
                found by combobox.get_active() before this function is called.

        Returns:
            The season (year) of the active row in the combobox, as defined by
            the active argument.
        """
        # Season combobox
        populated = False
        model = combobox.get_model()
        for season, in common.DB_CON.execute('SELECT season FROM team_stats GROUP BY season ORDER BY season ASC'):
            found = False
            for row in model:
                if int(row[0]) == season:
                    found = True # Already in the liststore, so we don't need to add it
            if not found:
                model.prepend(['%s' % season])
            populated = True

        if not populated: # Nothing was found in the liststore or in the team_stats database
            season, = common.DB_CON.execute('SELECT season FROM game_attributes').fetchone()
            model.append(['%s' % season])
            populated = True
        combobox.set_active(active)
        season = combobox.get_active_text()
        return season

    def make_team_combobox(self, combobox, active, season, all_teams_option):
        """Make team combobox and return the active team_id.

        When given a combobox with a blank model, a new ListStore is created
        and filled with the team names and team IDs, under the assumption that
        this will remain constant. If there is already something in the model,
        then this is skipped under the assumption that the teams are all
        already correctly there.

        Then, the team_id of the active combobox row is returned.

        Args:
            combobox: The combobox for the teams menu.
            active: The index of the active row of the ListStore, typically
                found by combobox.get_active() before this function is called.
            season: The current season (can be any season, really, as the game
                doesn't currently support contraction/expansion of teams, so
                all seasons have the same teams).
            all_teams_option: Boolean. If True, an option for 'All Teams' with
                a special team_id of 666 is put at the front of the ListStore
                when it is created.

        Returns:
            The team_id of the active row in the combobox, as defined by the
            active argument.
        """
        model = combobox.get_model()
        if len(model) == 0:
            model = gtk.ListStore(str, int)
            if all_teams_option:
                model.append(['All Teams', 666]) # 666 is the magin number to find all teams
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

        # Update
        roster_position = 1
        for player in players:
            common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position, player[0]))
            roster_position += 1
            print roster_position

    def auto_sign_free_agents(self):
        '''
        AI teams sign free agents.
        '''
        p = player.Player()
        # Build free_agents containing player ids and desired contracts
        num_days_played, = common.DB_CON.execute('SELECT COUNT(*)/30 FROM team_stats WHERE season = ?', (common.SEASON,)).fetchone()
        free_agents = []
        for player_id, in common.DB_CON.execute('SELECT pa.player_id FROM player_attributes as pa, player_ratings as pr WHERE pa.team_id = -1 AND pa.player_id = pr.player_id ORDER BY pr.overall + pr.potential DESC'):
            p.load(player_id)
            amount, expiration = p.contract()
            # Decrease amount by 20% (assume negotiations) or 5% for each day into season
            if num_days_played > 0:
                amount *= .95**num_days_played
            else:
                amount *= 0.8
            if amount < 500:
                amount = 500
            else:
                amount = 50*round(amount/50.0) # Make it a multiple of 50k
            free_agents.append([player_id, amount, expiration, False])

        # Randomly order teams and let them sign free agents
        team_ids = range(30)
        random.shuffle(team_ids)
        for i in xrange(30):
            team_id = team_ids[i]
            if team_id == common.PLAYER_TEAM_ID:
                continue # Skip the user's team
            num_players, payroll = common.DB_CON.execute('SELECT count(*), sum(pa.contract_amount) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration >= ? AND ta.season = ?', (team_id, common.SEASON, common.SEASON,)).fetchone()
            while payroll < common.SALARY_CAP and num_players < 15:
                j = 0
                new_player = False
                for player_id, amount, expiration, signed in free_agents:
                    if amount + payroll <= common.SALARY_CAP and not signed:
                        common.DB_CON.execute('UPDATE player_attributes SET team_id = ?, contract_amount = ?, contract_expiration = ? WHERE player_id = ?', (team_id, amount, expiration, player_id))
                        free_agents[j][-1] = True # Mark player signed
                        new_player = True
                        num_players += 1
                        payroll += amount
                        print payroll, amount, common.SALARY_CAP
                        common.roster_auto_sort(team_id)
                    j += 1
                if not new_player:
                    break                

    def player_contract_expire(self, player_id):
        resign = random.choice([True, False])
        if resign:
            p = player.Player()
            p.load(player_id)
            amount, expiration = p.contract()
            common.DB_CON.execute('UPDATE player_attributes SET contract_amount = ?, contract_expiration = ? WHERE player_id = ?', (amount, expiration, player_id))

        else:
            common.DB_CON.execute('UPDATE player_attributes SET team_id = -1 WHERE player_id = ?', (player_id,))

    def quit(self):
        '''
        Return False to close window, True otherwise
        '''

        keep_open = True
        if self.unsaved_changes:
            if self.save_nosave_cancel():
                keep_open = False
        if not self.unsaved_changes or not keep_open:
            common.DB_CON.close()
            os.remove(common.DB_TEMP_FILENAME)
            keep_open = False

        return keep_open

    def new_game_dialog(self):
        new_game_dialog = self.builder.get_object('new_game_dialog')
        new_game_dialog.set_transient_for(self.main_window)
        combobox_new_game_teams = self.builder.get_object('combobox_new_game_teams')

        # We're not currently connected to the database, so create a temporary one in memory to load the team attributes
        temp_db_con = sqlite3.connect(':memory:')
        for fn in ['tables.sql', 'teams.sql']:
            f = open(os.path.join(common.DATA_FOLDER, fn))
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

        while gtk.events_pending():
            gtk.main_iteration(False)

        return result, team_id

    def open_game_dialog(self):
        open_dialog = gtk.FileChooserDialog(title='Open Game', action=gtk.FILE_CHOOSER_ACTION_OPEN, buttons=(gtk.STOCK_CANCEL, gtk.RESPONSE_CANCEL, gtk.STOCK_OPEN, gtk.RESPONSE_OK))
        open_dialog.set_current_folder(common.SAVES_FOLDER)
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
        save_game_dialog.set_current_folder(common.SAVES_FOLDER)

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

        old_phase = self.phase
        self.phase = phase
        common.DB_CON.execute('UPDATE game_attributes SET phase = ?', (self.phase,))

        # Preseason
        if self.phase == 0:
            common.SEASON += 1
            common.DB_CON.execute('UPDATE game_attributes SET season = season + 1')

            # Get rid of old playoffs
            common.DB_CON.execute('DELETE FROM active_playoff_series')

            # Create new rows in team_attributes
            for row in common.DB_CON.execute('SELECT team_id, division_id, region, name, abbreviation, cash FROM team_attributes WHERE season = ?', (common.SEASON-1,)):
                common.DB_CON.execute('INSERT INTO team_attributes (team_id, division_id, region, name, abbreviation, cash, season) VALUES (?, ?, ?, ?, ?, ?, ?)', (row[0], row[1], row[2], row[3], row[4], row[5], common.SEASON))
            # Age players
            player_ids = []
            for row in common.DB_CON.execute('SELECT player_id, born_date FROM player_attributes'):
                player_ids.append(row[0])
            up = player.Player()
            for player_id in player_ids:
                up.load(player_id)
                up.develop()
                up.save()

            # AI teams sign free agents
            self.auto_sign_free_agents()

            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Preseason'))

            self.update_all_pages()

        # Regular Season - pre trading deadline
        elif self.phase == 1:
            self.new_schedule()

            # Auto sort rosters (except player's team)
            for t in range(30):
                if t != common.PLAYER_TEAM_ID:
                    common.roster_auto_sort(t)

            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Regular Season'))

        # Regular Season - post trading deadline
        elif self.phase == 2:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Regular Season'))

        # Playoffs
        elif self.phase == 3:
            self.update_play_menu(self.phase)

            # Set playoff matchups
            for conference_id in range(2):
                teams = []
                seed = 1
                for team_id, in common.DB_CON.execute('SELECT ta.team_id FROM team_attributes as ta, league_divisions as ld WHERE ld.division_id = ta.division_id AND ld.conference_id = ? AND ta.season = ? ORDER BY ta.won/(ta.won + ta.lost) DESC LIMIT 8', (conference_id, common.SEASON)):
                    teams.append(team_id)
                    # Record playoff appearance for player's team
                    if team_id == common.PLAYER_TEAM_ID:
                        common.DB_CON.execute('UPDATE team_attributes SET playoffs = 1 WHERE season = ? AND team_id = ?', (common.SEASON, common.PLAYER_TEAM_ID))

                query = 'INSERT INTO active_playoff_series (series_id, series_round, team_id_home, team_id_away, seed_home, seed_away, won_home, won_away) VALUES (?, 1, ?, ?, ?, ?, 0, 0)'
                common.DB_CON.execute(query, (conference_id*4+1, teams[0], teams[7], 1, 8))
                common.DB_CON.execute(query, (conference_id*4+2, teams[3], teams[4], 4, 5))
                common.DB_CON.execute(query, (conference_id*4+3, teams[2], teams[5], 3, 6))
                common.DB_CON.execute(query, (conference_id*4+4, teams[1], teams[6], 2, 7))

            self.playoffs.updated = False
            self.notebook.set_current_page(self.pages['playoffs'])

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Playoffs'))

        # Offseason - pre draft
        elif self.phase == 4:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Playoffs'))

        # Draft
        elif self.phase == 5:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

            if old_phase != 5: # Can't check hasattr because we need a new draft every year
                self.dd = draft_dialog.DraftDialog(self)
            else:
                self.dd.draft_dialog.show() # Show the window
                self.dd.draft_dialog.window.show() # Raise the window if it's in the background
            self.finances.updated = False
            self.update_all_pages()

        # Offseason - post draft
        elif self.phase == 6:
            self.update_play_menu(self.phase)

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

        # Offseason - free agency
        elif self.phase == 7:
            self.update_play_menu(self.phase)

            # Move undrafted players to free agent pool
            common.DB_CON.execute('UPDATE player_attributes SET team_id = -1, draft_year = -1, draft_round = -1, draft_pick = -1, draft_team_id = -1 WHERE team_id = -2')

            self.main_window.set_title('%s %s - Basketball General Manager' % (common.SEASON, 'Off-season'))

            # Check for retiring players
            # Call the contructor each season because that's where the code to check for retirement is
            rpw = retired_players_window.RetiredPlayersWindow(self) # Do the retired player check
            rpw.retired_players_window.run()
            rpw.retired_players_window.destroy()

            # Resign players
            for player_id, team_id, name in common.DB_CON.execute('SELECT player_id, team_id, name FROM player_attributes WHERE contract_expiration = ?', (common.SEASON,)):
                if team_id != common.PLAYER_TEAM_ID:
                    # Automaitcally negotiate with teams
                    self.player_contract_expire(player_id)
                else:
                    # Open a contract_window
                    cw = contract_window.ContractWindow(self, player_id)
                    cw.contract_window.run()
                    cw.contract_window.destroy()
            self.finances.updated = False
            self.update_all_pages()

    def update_play_menu(self, phase):
        # Games in progress
        if phase == -1:
            show_menus = [True, False, False, False, False, False, False, False, False, False]

        # Preseason
        elif phase == 0:
            show_menus = [False, False, False, False, False, False, False, False, False, True]

        # Regular season - pre trading deadline
        elif phase == 1:
            show_menus = [False, True, True, True, True, False, False, False, False, False]

        # Regular season - post trading deadline
        elif phase == 2:
            show_menus = [False, True, True, True, True, False, False, False, False, False]

        # Playoffs
        elif phase == 3:
            show_menus = [False, True, True, True, False, True, False, False, False, False]

        # Offseason - pre draft
        elif phase == 4:
            show_menus = [False, False, False, False, False, False, True, False, False, False]

        # Draft
        elif phase == 5:
            show_menus = [False, False, False, False, False, False, True, False, False, False]

        # Offseason - post draft
        elif phase == 6:
            show_menus = [False, False, False, False, False, False, False, True, False, False]

        # Offseason - free agency
        elif phase == 7:
            show_menus = [False, False, False, False, False, False, False, False, True, False]

        for i in range(len(self.menuitem_play)):
            self.menuitem_play[i].set_sensitive(show_menus[i])


    def __init__(self):
        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['aboutdialog', 'accelgroup1', 'liststore3', 'liststore4', 'liststore5', 'liststore6', 'liststore7', 'liststore8', 'main_window', 'new_game_dialog', 'new_game_progressbar_window'])

        self.main_window = self.builder.get_object('main_window')
        self.menuitem_play = []
        self.menuitem_play.append(self.builder.get_object('menuitem_stop'))
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
        self.hbox1 = self.builder.get_object('hbox1')
        self.statusbar = self.builder.get_object('statusbar')
        self.statusbar_context_id = self.statusbar.get_context_id('Main Window Statusbar')


        self.pages = dict(standings=0, finances=1, player_ratings=2, player_stats=3, team_stats=4, game_log=5, playoffs=6)
        # Set to True when treeview columns (or whatever) are set up
        self.built = dict(player_window_stats=False, player_window_game_log=False)
        # Set to True if data on this pane is current
        self.updated = dict(player_window_stats=False, player_window_game_log=False)
        # Set to true when a change is made
        self.unsaved_changes = False
        # Set to true and games will be stopped after the current day's simulation finishes
        self.stop_games = False
        # True when games are being played
        self.games_in_progress = False

        # Load tabs
        self.standings = standings_tab.StandingsTab(self)
        self.finances = finances_tab.FinancesTab(self)
        self.player_ratings = player_ratings_tab.PlayerRatingsTab(self)
        self.player_stats = player_stats_tab.PlayerStatsTab(self)
        self.team_stats = team_stats_tab.TeamStatsTab(self)
        self.game_log = game_log_tab.GameLogTab(self)
        self.playoffs = playoffs_tab.PlayoffsTab(self)

        # Initialize combobox positions
        self.combobox_game_log_season_active = 0
        self.combobox_game_log_team_active = common.PLAYER_TEAM_ID

        self.builder.connect_signals(self)

        self.main_window.show()

