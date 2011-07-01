import gtk
import mx.DateTime
import sqlite3

import common

class RosterWindow:
    def on_roster_window_close(self, widget, data=None):
        self.roster_window.hide()
        return True

    def on_button_roster_auto_sort_clicked(self, button, data=None):
        self.mw.roster_auto_sort(common.PLAYER_TEAM_ID)
        self.mw.unsaved_changes = True
        self.update_roster()

    def on_button_roster_up_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_roster.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            current_position = path[0]
            if current_position > 0:
                position = treemodel.get_iter((current_position-1,))
                treemodel.move_before(treeiter, position)
                self.on_treeview_roster_row_deleted(treemodel, None, None)

    def on_button_roster_down_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_roster.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            current_position = path[0]
            max_position = len(treemodel) - 1
            if current_position < max_position:
                position = treemodel.get_iter((current_position+1,))
                treemodel.move_after(treeiter, position)
                self.on_treeview_roster_row_deleted(treemodel, None, None)

    def on_button_roster_player_info_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_roster.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            self.mw.on_treeview_player_row_activated(self.treeview_roster, path, None, None)

    def on_button_roster_release_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_roster.get_selection().get_selected()
        if treeiter:
            player_id = treemodel.get_value(treeiter, 0)
            name = treemodel.get_value(treeiter, 1)
            dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_QUESTION, gtk.BUTTONS_OK_CANCEL, 'Are you sure you want to release %s?  He will become a free agent and will be able to sign with any team.' % name)
            response = dialog.run()
            dialog.destroy()
            if response == gtk.RESPONSE_OK:
                # Set to FA in database
                common.DB_CON.execute('UPDATE player_attributes SET team_id = -1 WHERE player_id = ?', (player_id,))
                # Delete from roster treeview
                treemodel.remove(treeiter)
                # Update roster info
                self.update_roster_info()
                # Update tabs in the main window
                self.mw.updated['finances'] = False
                self.mw.updated['player_stats'] = False
                self.mw.updated['player_ratings'] = False
                self.mw.update_current_page()

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
        Map to the same function in main_window.py
        '''
        self.mw.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build_roster(self):
        #column_info = [['Name', 'Position', 'Rating', 'Contract', 'PPG', 'Reb', 'Ast', 'Average Playing Time'],
        #               [1,      2,          3,        4,          5,     6,     7,     8],
        #               [False,  False,      False,    False,      False, False, False, False],
        #               [False,  False,      False,    False,      False, False, False, False]]
        renderer = gtk.CellRendererText()
        column = gtk.TreeViewColumn('Name', renderer, text=1)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Position', renderer, text=2)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Age', renderer, text=3)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Rating', renderer, text=4)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Potential', renderer, text=5)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Contract', renderer, text=6)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Min', renderer, text=7)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 7)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('PPG', renderer, text=8)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 8)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Reb', renderer, text=9)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 9)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Ast', renderer, text=10)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 10)))
        self.treeview_roster.append_column(column)

        # This treeview is used to list the positions to the left of the players
        column_info = [['',],
                       [0],
                       [False],
                       [False]]
        common.treeview_build(self.treeview_roster_info, column_info)

    def update_roster(self):
        print 'ur'
        # Roster info
        self.update_roster_info()
        n_games_played, = common.DB_CON.execute('SELECT COUNT(*) FROM team_stats WHERE season = ? AND team_id = ?', (common.SEASON, common.PLAYER_TEAM_ID)).fetchone()
        print n_games_played
        # Roster list
        # Only display stats if it's during the season AND the first game has been played. Otherwise, players won't show up in the roster
        if (self.mw.phase == 1 and n_games_played > 0) or  (self.mw.phase >= 2 and self.mw.phase <= 4): # Regular season to right before draft
            column_types = [int, str, str, int, int, int, str, float, float, float, float]
            query = 'SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration, AVG(player_stats.minutes), AVG(player_stats.points), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists) FROM player_attributes, player_ratings, player_stats WHERE player_attributes.player_id = player_ratings.player_id AND player_stats.player_id = player_ratings.player_id AND player_attributes.team_id = ? AND player_stats.season = ? GROUP BY player_stats.player_id ORDER BY player_ratings.roster_position ASC' % common.SEASON
            query_bindings = (common.PLAYER_TEAM_ID,common.SEASON)
        else: # Other phases
            column_types = [int, str, str, int, int, int, str, float, float, float, float]
            query = 'SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration, 0, 0, 0, 0 FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC' % common.SEASON
            query_bindings = (common.PLAYER_TEAM_ID,)
        common.treeview_update(self.treeview_roster, column_types, query, query_bindings)
        model = self.treeview_roster.get_model()
        model.connect('row-deleted', self.on_treeview_roster_row_deleted);

        # Positions
        liststore = gtk.ListStore(str)
        self.treeview_roster_info.set_model(liststore)
        spots = ('Starter', 'Starter', 'Starter', 'Starter', 'Starter', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Inactive', 'Inactive', 'Inactive')
        for spot in spots:
            liststore.append([spot])

    def update_roster_info(self):
        row = common.DB_CON.execute('SELECT 15 - COUNT(*) FROM player_attributes WHERE team_id = ?', (common.PLAYER_TEAM_ID,)).fetchone()
        empty_roster_spots = row[0]
        self.label_roster_info.set_markup('You currently have <b>%d empty roster spots</b>.\n' % (empty_roster_spots))

    def __init__(self, main_window):
        self.mw = main_window

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['roster_window'])

        self.roster_window = self.builder.get_object('roster_window')
        self.label_roster_info = self.builder.get_object('label_roster_info')
        self.treeview_roster = self.builder.get_object('treeview_roster')
        self.treeview_roster_info = self.builder.get_object('treeview_roster_info')

        self.builder.connect_signals(self)

        self.build_roster()
        self.update_roster()

        self.roster_window.show()

