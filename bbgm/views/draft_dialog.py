# -*- coding: utf-8 -*-
import gtk
import random
import time

from bbgm import common
from bbgm.core import player
from bbgm.util import resources


class DraftDialog:
    def on_draft_dialog_close(self, widget, data=None):
        if self.done_draft:
            self.main_window.update_all_pages()
            self.draft_dialog.hide()
        return True

    def on_button_start_draft_clicked(self, button, data=None):
        # Replace Start Draft button with Draft Player button
        self.button_start_draft.destroy()
        self.button_draft_player = gtk.Button()
        image = gtk.Image()
        image.set_from_stock(gtk.STOCK_YES, gtk.ICON_SIZE_BUTTON)
        label = gtk.Label('_Draft Player')
        label.set_use_underline(True)
        hbox = gtk.HBox(False, 2)
        hbox.pack_start(image)
        hbox.pack_start(label)
        alignment = gtk.Alignment(0.5, 0.5, 0, 0)
        alignment.add(hbox)
        self.button_draft_player.add(alignment)
        self.draft_dialog.add_action_widget(self.button_draft_player, 0)
        self.button_draft_player.connect('clicked', self.on_button_draft_player_clicked)
        self.button_draft_player.set_sensitive(False)  # User can't click it until their turn
        self.button_draft_player.show_all()

        self.do_draft()

    def on_button_draft_player_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_draft_available.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            self.pick = path[0]
            self.picked = True

    def on_button_close_clicked(self, button, data=None):
        if self.done_draft:
            self.draft_dialog.destroy()
        return True

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        treemodel, treeiter = treeview.get_selection().get_selected()
        if treemodel.get_value(treeiter, 0) >= 0:  # Make sure it's not a placeholder row
            self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def generate_players(self):
        profiles = ['Point', 'Wing', 'Big', 'Big', '']
        gp = player.GeneratePlayer()
        sql = ''
        row = common.DB_CON.execute('SELECT MAX(player_id) + 1 FROM player_attributes').fetchone()
        player_id = row[0]
        team_id = -2  # -2 is the team_id for players generated for the draft
        for p in range(70):
            base_rating = random.randrange(0, 20)
            potential = int(random.gauss(45, 20))
            if potential < base_rating:
                potential = base_rating
            if potential > 90:
                potential = 90

            i = random.randrange(len(profiles))
            profile = profiles[i]

            aging_years = random.randrange(4)
            draft_year = common.SEASON

            gp.new(player_id, team_id, 19, profile, base_rating, potential, draft_year)
            gp.develop(aging_years)

            sql += gp.sql_insert()

            player_id += 1
        common.DB_CON.executescript(sql)

        # Update roster positions (so next/prev buttons work in player dialog)
        roster_position = 1

        query = ('SELECT player_ratings.player_id FROM player_attributes, player_ratings WHERE '
                 'player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = -2 ORDER BY '
                 'player_ratings.potential DESC')
        for row in common.DB_CON.execute(query):
            common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position,
                                  row[0]))
            roster_position += 1

    def build_available(self):
        column_info = [['Rank', 'Pos', 'Name', 'Age',     'Overall', 'Potential'],
                       [1,      2,      3,     4,         5,         6],
                       [True,   True,   True,  True,      True,      True],
                       [False,  False,  False, False,     False,     False]]
        common.treeview_build(self.treeview_draft_available, column_info)

        self.liststore_draft_available = gtk.ListStore(int, int, str, str, int, int, int)
        self.treeview_draft_available.set_model(self.liststore_draft_available)
        query = ('SELECT player_attributes.player_id, player_attributes.position, player_attributes.name, %d - '
                 'player_attributes.born_date, player_ratings.overall, player_ratings.potential FROM '
                 'player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND '
                 'player_attributes.team_id = -2 ORDER BY player_ratings.overall + 2*player_ratings.potential DESC'
                 % common.SEASON)
        rank = 1
        for row in common.DB_CON.execute(query):
            real_row = [row[0], rank] + list(row[1::])
            self.liststore_draft_available.append(real_row)
            rank += 1

    def set_draft_order(self):
        self.draft_results = []
        for round_ in range(1, 3):
            pick = 1
            for row in common.DB_CON.execute(('SELECT team_id, abbreviation FROM team_attributes WHERE '
                                              'season = ? ORDER BY won/(won + lost) ASC'),
                                              (common.SEASON,)):
                team_id, abbreviation = row
                name = ''
                self.draft_results.append([-1, team_id, round_, pick, abbreviation, name])
                pick += 1

    def build_results(self):
        common.add_column(self.treeview_draft_results, 'Round', 2)
        common.add_column(self.treeview_draft_results, 'Pick', 3)
        common.add_column(self.treeview_draft_results, 'Team', 4)
        common.add_column(self.treeview_draft_results, 'Player Name', 5)

        self.liststore_draft_results = gtk.ListStore(int, int, int, int, str, str)
        self.treeview_draft_results.set_model(self.liststore_draft_results)
        for row in self.draft_results:
            self.liststore_draft_results.append(row)

    def do_draft(self):
        # Do the draft
        for row in self.liststore_draft_results:
            while gtk.events_pending():
                gtk.main_iteration(False)  # This stops everything from freezing

            team_id = row[1]
            self.round = row[2]

            if team_id != common.PLAYER_TEAM_ID:
                self.pick = abs(int(random.gauss(0, 3)))
                time.sleep(0.1)
            else:
                # The player has to pick
                self.button_draft_player.set_sensitive(True)
                self.picked = False
                while not self.picked:
                    while gtk.events_pending():
                        gtk.main_iteration(False)  # This stops everything from freezing
                    time.sleep(0.01)
                self.button_draft_player.set_sensitive(False)
            self.pick_player(row, self.pick)

        # Replace Draft Player button with stock Close button
        self.button_draft_player.destroy()
        self.button_close = self.draft_dialog.add_button(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
        self.button_close.connect('clicked', self.on_button_close_clicked)

        # Set to True to allow dialog to be closed
        self.done_draft = True

        # Update the main window because we have added new players
        self.main_window.update_all_pages()
        self.main_window.new_phase(6)

    def pick_player(self, row, pick):
        '''
        Copy the selected name and player ID to the draft_results
        Delete the selected row from draft_available
        int pick is the offset from the top of draft_available
        row is the current row in draft_results
        '''
        row[5] = self.liststore_draft_available[pick][3]  # Name
        row[0] = self.liststore_draft_available[pick][0]  # Player ID

        # Update team_id and roster_position
        row2 = common.DB_CON.execute(('SELECT MAX(player_ratings.roster_position) + 1 FROM player_attributes, '
                                      'player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND '
                                      'player_attributes.team_id = ?'), (row[1],)).fetchone()
        roster_position = row2[0]
        common.DB_CON.execute(('UPDATE player_attributes SET team_id = ?, draft_year = ?, draft_round = ?, '
                               'draft_pick = ?, draft_team_id = ? WHERE player_id = ?'), (row[1], common.SEASON, row[2],
                               row[3], row[1], row[0]))
        common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position,
                              row[0]))
        del self.liststore_draft_available[pick]

        # Contract
        i = row[3] - 1 + 30 * (row[2] - 1)
        contract_amount = self.rookie_salaries[i]
        years = 4 - row[2]  # 2 years for 2nd round, 3 years for 1st round
        contract_expiration = common.SEASON + years
        common.DB_CON.execute(('UPDATE player_attributes SET contract_amount = ?, contract_expiration = ? WHERE '
                               'player_id = ?'), (contract_amount, contract_expiration, row[0]))

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['draft_dialog'])

        self.draft_dialog = self.builder.get_object('draft_dialog')
        self.treeview_draft_available = self.builder.get_object('treeview_draft_available')
        self.treeview_draft_results = self.builder.get_object('treeview_draft_results')

        self.builder.connect_signals(self)

        self.rookie_salaries = (5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700, 1600, 1500,
                                1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,
                                1000, 1000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
                                500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500)

        # Make the Start Draft button
        self.button_start_draft = gtk.Button()
        image = gtk.Image()
        image.set_from_stock(gtk.STOCK_GO_FORWARD, gtk.ICON_SIZE_BUTTON)
        label = gtk.Label('_Start Draft')
        label.set_use_underline(True)
        hbox = gtk.HBox(False, 2)
        hbox.pack_start(image)
        hbox.pack_start(label)
        alignment = gtk.Alignment(0.5, 0.5, 0, 0)
        alignment.add(hbox)
        self.button_start_draft.add(alignment)
        self.draft_dialog.add_action_widget(self.button_start_draft, 0)
        self.button_start_draft.connect('clicked', self.on_button_start_draft_clicked)
        self.button_start_draft.show_all()

        # Any time it sets self.picked to True
        self.done_draft = False  # Dialog can't be closed until this is True

        # Generate 80 players
        self.generate_players()

        # Add them all to the available treeview
        self.build_available()

        # Set draft order
        self.set_draft_order()

        # Add placeholder rows to the results treeview
        self.build_results()

        # Show the dialog
        self.draft_dialog.show()
