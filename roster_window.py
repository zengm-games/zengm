import gtk
import mx.DateTime
import sqlite3

import common

class RosterWindow:
    def on_roster_window_close(self, widget, data=None):
        self.roster_window.hide()
        return True

    def on_button_roster_auto_sort_clicked(self, button, data=None):
        self.main_window.roster_auto_sort(common.PLAYER_TEAM_ID)
        self.main_window.unsaved_changes = True
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
            self.main_window.on_treeview_player_row_activated(self.treeview_roster, path, None, None)

    def on_button_roster_edit_minutes_clicked(self, button, data=None):
        treemodel, treeiter = self.treeview_roster.get_selection().get_selected()
        if treeiter:
            path = treemodel.get_path(treeiter)
            focus_column = self.treeview_roster.get_column(8) # The index here is the position wrt visible columns, so this might need to be changed some time
            self.treeview_roster.set_cursor(path, focus_column, start_editing=True)

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
                self.main_window.updated['finances'] = False
                self.main_window.updated['player_stats'] = False
                self.main_window.updated['player_ratings'] = False
                self.main_window.update_current_page()

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

    def on_edited_average_playing_time(self, cell, path, new_text, model=None):
        '''
        Updates the average playing time in the roster page
        '''
        average_playing_time = int(new_text)
        player_id = model[path][0]
        common.DB_CON.execute('UPDATE player_ratings SET average_playing_time = ? WHERE player_id = ?', (average_playing_time, player_id))
        self.unsaved_changes = True
        if average_playing_time > 48:
            model[path][9] = 48
        elif average_playing_time < 0:
            model[path][9] = 0
        else:
            model[path][9] = average_playing_time
        self.update_roster_info()
        return True

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.main_window.on_treeview_player_row_activated(treeview, path, view_column, data)

    def build_roster(self):
        #column_info = [['Name', 'Position', 'Rating', 'Contract', 'PPG', 'Reb', 'Ast', 'Average Playing Time'],
        #               [1,      2,          3,        4,          5,     6,     7,     8],
        #               [False,  False,      False,    False,      False, False, False, False],
        #               [False,  False,      False,    False,      False, False, False, False]]
        renderer = gtk.CellRendererText()
        self.renderer_roster_editable = gtk.CellRendererText()
        self.renderer_roster_editable.set_property('editable', True)
        column = gtk.TreeViewColumn('Name', renderer, text=1)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Position', renderer, text=2)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Age', renderer, text=3)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Rating', renderer, text=4)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Contract', renderer, text=5)
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('PPG', renderer, text=6)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 6)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Reb', renderer, text=6)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 7)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Ast', renderer, text=7)
        column.set_cell_data_func(renderer,
            lambda column, cell, model, iter: cell.set_property('text', '%.1f' % model.get_value(iter, 8)))
        self.treeview_roster.append_column(column)
        column = gtk.TreeViewColumn('Average Playing Time', self.renderer_roster_editable, text=9)
        self.treeview_roster.append_column(column)

        # This treeview is used to list the positions to the left of the players
        column_info = [['',],
                       [0],
                       [False],
                       [False]]
        common.treeview_build(self.treeview_roster_info, column_info)
        self.renderer_roster_editable_handle_id = 0 # This variable is used in update_roster

    def update_roster(self):
        print 'ur'
        # Roster info
        self.update_roster_info()

        # Roster list
        column_types = [int, str, str, int, int, str, float, float, float, int]
        query = 'SELECT player_attributes.player_id, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration, 0, 0, 0, player_ratings.average_playing_time FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC' % common.SEASON
        query_bindings = (common.PLAYER_TEAM_ID,)
        common.treeview_update(self.treeview_roster, column_types, query, query_bindings)
        model = self.treeview_roster.get_model()
        model.connect('row-deleted', self.on_treeview_roster_row_deleted);

        # Delete the old handler (if it exists) to prevent multiple and erroneous playing time updates
        if self.renderer_roster_editable_handle_id != 0:
            self.renderer_roster_editable.disconnect(self.renderer_roster_editable_handle_id)

        self.renderer_roster_editable_handle_id = self.renderer_roster_editable.connect('edited', self.on_edited_average_playing_time, model)

        # Positions
        liststore = gtk.ListStore(str)
        self.treeview_roster_info.set_model(liststore)
        spots = ('Starter', 'Starter', 'Starter', 'Starter', 'Starter', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Bench', 'Inactive', 'Inactive', 'Inactive')
        for spot in spots:
            liststore.append([spot])

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
        self.label_roster_info.set_markup('You currently have <b>%d empty roster spots</b> and <b>%s</b>.\n' % (empty_roster_spots, playing_time_text))

    def __init__(self, main_window):
        self.main_window = main_window

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 
        self.roster_window = self.builder.get_object('roster_window')
        self.label_roster_info = self.builder.get_object('label_roster_info')
        self.treeview_roster = self.builder.get_object('treeview_roster')
        self.treeview_roster_info = self.builder.get_object('treeview_roster_info')

        self.builder.connect_signals(self)

        self.build_roster()
        self.update_roster()

        self.roster_window.show()

