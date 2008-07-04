import sys
import gtk
import pango
import mx.DateTime
import random
import sqlite3

import common
import player

class DraftDialog:
    def on_draft_dialog_close(self, widget, data=None):
        if self.done_draft:
            self.draft_dialog.destroy()
        return True

    def on_button_draft_player_clicked(self, button, data=None):
        if self.round == 1:
            self.round = 2
        elif self.round == 2:
            # Replace Draft Player button with stock Close button
            self.button_draft_player.destroy()
            self.button_close = self.draft_dialog.add_button(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
            self.button_close.connect('clicked', self.on_button_close_clicked)

            # Set to True to allow dialog to be closed
            self.done_draft = True

    def on_button_close_clicked(self, button, data=None):
        if self.done_draft:
            self.draft_dialog.destroy()
        return True

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def generate_players(self):
        profiles = ['Point', 'Wing', 'Big', 'Big', '']
        gp = player.GeneratePlayer()
        sql = ''
        row = common.DB_CON.execute('SELECT MAX(player_id) + 1 FROM player_attributes').fetchone()
        player_id = row[0]
        team_id = -2 # -2 is the team_id for players generated for the draft
        for p in range(80):
            base_rating = random.randrange(25, 45)
            potential = int(random.gauss(55,10))
            i = random.randrange(len(profiles))
            profile = profiles[i]

            aging_years = random.randrange(4)

            gp.new(player_id, team_id, 19, profile, base_rating, potential)
            gp.develop(aging_years)

            sql += gp.sql_insert()

            player_id += 1
        common.DB_CON.executescript(sql)

        # Update roster positions (so next/prev buttons work in player dialog)
        roster_position = 1
        for row in common.DB_CON.execute('SELECT player_ratings.player_id FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = -2 ORDER BY player_ratings.potential DESC'):
            common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position, row[0]))
            roster_position += 1

    def build_available(self):
        column_info = [['Pos', 'Name', 'Age', 'Overall', 'Potential'],
                       [1,     2,      3,     4,         5],
                       [True,  True,   True,  True,      True],
                       [False, False,  False, False,     False]]
        common.treeview_build(self.treeview_draft_available, column_info)

        column_types = [int, str, str, int, int, int]
        query = "SELECT player_attributes.player_id, player_attributes.position, player_attributes.name, ROUND((julianday('%s-06-01') - julianday(born_date))/365.25), (player_ratings.height + player_ratings.strength + player_ratings.speed + player_ratings.jumping + player_ratings.endurance + player_ratings.shooting_inside + player_ratings.shooting_layups + player_ratings.shooting_free_throws + player_ratings.shooting_two_pointers + player_ratings.shooting_three_pointers + player_ratings.blocks + player_ratings.steals + player_ratings.dribbling + player_ratings.passing + player_ratings.rebounding)/15 FROM player_ratings WHERE player_attributes.player_id = player_id), player_ratings.potential FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = -2 ORDER BY (player_ratings.height + player_ratings.strength + player_ratings.speed + player_ratings.jumping + player_ratings.endurance + player_ratings.shooting_inside + player_ratings.shooting_layups + player_ratings.shooting_free_throws + player_ratings.shooting_two_pointers + player_ratings.shooting_three_pointers + player_ratings.blocks + player_ratings.steals + player_ratings.dribbling + player_ratings.passing + player_ratings.rebounding)/15 + 2*player_ratings.potential DESC" % common.SEASON
        common.treeview_update(self.treeview_draft_available, column_types, query)

    def set_draft_order(self):
        self.draft_results = []
        for round_ in range(1, 3):
            pick = 1
            for row in common.DB_CON.execute('SELECT team_id, abbreviation FROM team_attributes WHERE season = ? ORDER BY won/(won + lost) ASC', (common.SEASON,)):
                abbreviation = row[0]
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

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        self.draft_dialog = self.builder.get_object('draft_dialog')
        self.treeview_draft_available = self.builder.get_object('treeview_draft_available')
        self.treeview_draft_results = self.builder.get_object('treeview_draft_results')

        self.builder.connect_signals(self)

        #self.button_draft_player = self.draft_dialog.add_button('_Draft Player', 0)
        #button_draft_player.connect('clicked', self.on_button_draft_player_clicked)
        # Make the Draft Player button
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
        self.button_draft_player.show_all()

        # The first time draft_player is pressed, it increments self.round
        # The second time, it sets self.done_draft to True
        self.round = 1
        self.done_draft = False # Dialog can't be closed until this is True

        # Generate 80 players
        self.generate_players()

        # Add them all to the available treeview
        self.build_available()

        # Set draft order
        self.set_draft_order()

        # Add placeholder rows to the results treeview
        self.build_results()

        # Do the draft
        for i in range(len(self.draft_order)):
            team_id = self.draft_order[i][1]
#            player_id, team_id, round_, pick, abbreviation, name
            
            # if team_id != common.PLAYER_TEAM_ID:
                # Select player based on overall + 2*potential with some gaussian randomness
            # else:
                # Capture player selection in on_button_draft_player_clicked()
            # Delete player row from available treeview
            # Add player to results treeview (row will already be there, just update it)
            # Update player's team_id and draft_* in player_attributes
            # Replace Draft Player button with stock Close button
#            self.button_draft_player.destroy()
#            self.button_close = self.draft_dialog.add_button(gtk.STOCK_CLOSE, gtk.RESPONSE_CLOSE)
#            self.button_close.connect('clicked', self.on_button_close_clicked)
#            # Set to True to allow dialog to be closed
#            self.done_draft = True

        self.draft_dialog.show()

