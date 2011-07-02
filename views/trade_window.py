import gtk
import math
import sqlite3

import common
import random
from core.trade import Trade

class TradeWindow:
    def __init__(self, main_window, team_id=-1, player_id=-1):
        self.mw = main_window

        print team_id, player_id

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(common.GTKBUILDER_PATH, ['liststore1', 'trade_window'])

        self.trade_window = self.builder.get_object('trade_window')
        self.combobox_trade_teams = self.builder.get_object('combobox_trade_teams')
        self.treeview_trade = []
        self.treeview_trade.append(self.builder.get_object('treeview_trade_0'))
        self.treeview_trade.append(self.builder.get_object('treeview_trade_1'))
        self.label_team_name = self.builder.get_object('label_team_name')
        self.label_trade_summary = self.builder.get_object('label_trade_summary')
        self.label_trade = []
        self.label_trade.append(self.builder.get_object('label_trade_0'))
        self.label_trade.append(self.builder.get_object('label_trade_1'))
        self.label_trade_cap_warning = self.builder.get_object('label_trade_cap_warning')
        self.button_trade_propose = self.builder.get_object('button_trade_propose')

        self.builder.connect_signals(self)

        # Fill the combobox with teams
        if team_id < 0:
            team_id = 0
        self.trade = Trade(team_id)
        model = self.combobox_trade_teams.get_model()
        self.combobox_trade_teams.set_model(None)
        model.clear()
        for row in common.DB_CON.execute('SELECT region || " " || name, team_id FROM team_attributes WHERE season = ? ORDER BY team_id ASC', (common.SEASON,)):
            model.append(['%s' % row[0]])
            if row[1] == common.PLAYER_TEAM_ID:
                self.label_team_name.set_text(row[0])
        self.combobox_trade_teams.set_model(model)
        self.combobox_trade_teams.set_active(self.trade.team_id)

        # Show the team rosters
        self.renderer_0 = gtk.CellRendererToggle()
        self.renderer_0.set_property('activatable', True)
        self.renderer_1 = gtk.CellRendererToggle()
        self.renderer_1.set_property('activatable', True)
        self.build_roster(self.treeview_trade[0], self.renderer_0)
        self.build_roster(self.treeview_trade[1], self.renderer_1)
        self.update_roster(self.treeview_trade[0], common.PLAYER_TEAM_ID)
        self.update_roster(self.treeview_trade[1], self.trade.team_id)
        self.renderer_0.connect('toggled', self.on_player_toggled, self.treeview_trade[0].get_model())
        self.renderer_1_toggled_handle_id = self.renderer_1.connect('toggled', self.on_player_toggled, self.treeview_trade[1].get_model())

        # Select a player if a player ID has been passed to this function
        # There's probably a more elegant way of doing this
        self.update_trade_summary_done = False
        if player_id != -1:
            model = self.treeview_trade[1].get_model()
            path = 0
            for row in model:
                if player_id == row[0]:
                    self.on_player_toggled([], path, model, data=None)
                    self.update_trade_summary_done = True
                path += 1

        if not self.update_trade_summary_done:
            self.update_trade_summary()

        self.trade_window.set_transient_for(self.mw.main_window)

    def on_trade_window_response(self, dialog, response, *args):
        """Don't close the dialog on any button except close."""
        if response >= 0:
            self.trade_window.emit_stop_by_name('response')

    def on_treeview_player_row_activated(self, treeview, path, view_column, data=None):
        '''
        Map to the same function in main_window.py
        '''
        self.mw.on_treeview_player_row_activated(treeview, path, view_column, data)

    def on_button_trade_propose_clicked(self, button, data=None):
        if self.value[0] - 0.5 > self.value[1]:
            # Trade players
            for team_id in [common.PLAYER_TEAM_ID, self.trade.team_id]:
                if team_id == common.PLAYER_TEAM_ID:
                    i = 0
                    new_team_id = self.trade.team_id
                else:
                    i = 1
                    new_team_id = common.PLAYER_TEAM_ID
                for player_id, team_id, name, age, rating, potential, contract_amount in self.trade.offer[i].values():
                    common.DB_CON.execute('UPDATE player_attributes SET team_id = ? WHERE player_id = ?', (new_team_id, player_id))
            # Auto-sort computer team
            common.roster_auto_sort(self.trade.team_id)

            # Show dialog
            dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_INFO, gtk.BUTTONS_CLOSE, 'Your trade proposal was accepted.')
            dialog.run()
            dialog.destroy()
            self.trade_window.destroy()
        else:
            dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_INFO, gtk.BUTTONS_CLOSE, 'Your trade proposal was rejected.')
            dialog.run()
            dialog.destroy()

    def on_button_trade_clear_clicked(self, button, data=None):
        """Reset the offer, but keep the same teams open."""
        self.trade.clear_offer()
        for i in range(2):
            model = self.treeview_trade[i].get_model()
            for row in model:
                row[2] = False
        self.update_trade_summary()

    def on_combobox_trade_teams_changed(self, combobox, data=None):
        new_team_id = combobox.get_active()

        if new_team_id == common.PLAYER_TEAM_ID: # Can't trade with yourself
            combobox.set_active(self.trade.team_id)
        else: # Update/reset everything if a new team is picked
            self.trade.new_team(new_team_id)

            # Reset and update treeview
            for column in self.treeview_trade[1].get_columns():
                self.treeview_trade[1].remove_column(column)
            self.build_roster(self.treeview_trade[1], self.renderer_1)
            self.update_roster(self.treeview_trade[1], self.trade.team_id)
            self.renderer_1.disconnect(self.renderer_1_toggled_handle_id)
            self.renderer_1_toggled_handle_id = self.renderer_1.connect('toggled', self.on_player_toggled, self.treeview_trade[1].get_model())

            self.update_trade_summary()

    def on_player_toggled(self, cell, path, model, data=None):
        model[path][2] = not model[path][2] # Update checkbox

        player_id = model[path][0]
        team_id = model[path][1]
        name = model[path][3]
        age = model[path][5]
        rating = model[path][6]
        potential = model[path][7]
        if team_id == common.PLAYER_TEAM_ID:
            i = 0
        else:
            i = 1

        if model[path][2]:
            # Check: add player to offer
            contract_amount, = common.DB_CON.execute('SELECT contract_amount FROM player_attributes WHERE player_id = ?', (player_id,)).fetchone()

            self.trade.offer[i][player_id] = [player_id, team_id, name, age, rating, potential, contract_amount]
        else:
            # Uncheck: delete player from offer
            del self.trade.offer[i][player_id]

        self.update_trade_summary()

    def build_roster(self, treeview, renderer_toggle):
        column = gtk.TreeViewColumn('Trade', renderer_toggle)
        column.add_attribute(renderer_toggle, 'active', 2)
        column.set_sort_column_id(2)
        treeview.append_column(column)

        column_info = [['Name', 'Pos', 'Age', 'Rating', 'Potential', 'Contract'],
                       [3,      4,     5,     6,        7,           8],
                       [True,   True,  True,  True,     True,        True],
                       [False,  False, False, False,    False,       False]]
        common.treeview_build(treeview, column_info)

    def update_roster(self, treeview, team_id):
        column_types = [int, int, 'gboolean', str, str, int, int, int, str]
        query = 'SELECT player_attributes.player_id, player_attributes.team_id, 0, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC' % common.SEASON
        query_bindings = (team_id,)
        common.treeview_update(treeview, column_types, query, query_bindings)

    def update_trade_summary(self):
        self.label_trade_summary.set_markup('<b>Trade Summary</b>\n\nSalary Cap: $%.2fM\n' % (common.SALARY_CAP/1000.0))

        payroll_after_trade = [0, 0]
        total = [0, 0]
        self.value = [0, 0]
        over_cap = [False, False]
        ratios = [0, 0]
        names = []
        for team_id in [common.PLAYER_TEAM_ID, self.trade.team_id]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                j = 1
            else:
                i = 1
                j = 0
            name, payroll = common.DB_CON.execute('SELECT ta.region || " " || ta.name, sum(pa.contract_amount) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration >= ? AND ta.season = ?', (team_id, common.SEASON, common.SEASON,)).fetchone()
            names.append(name)
            text = '<b>%s</b>\n\nTrade:\n' % name

            total[i] = 0
            self.value[i] = 0
            for player_id, team_id, name, age, rating, potential, contract_amount in self.trade.offer[i].values():
                text += '%s ($%.2fM)\n' % (name, contract_amount/1000.0)
                total[i] += contract_amount
                self.value[i] += 10**(potential/10.0 + rating/20.0 - age/10.0 - contract_amount/10000.0) # Set in 2 places!!
            if self.value[i] > 0:
                self.value[i] = math.log(self.value[i])
            text += '$%.2fM total\n\n' % (total[i]/1000.0)
            #text += 'Value: %.4f\n\n' % (self.value[i])
            text += 'Recieve:\n'

            total[j] = 0
            self.value[j] = 0
            for player_id, team_id, name, age, rating, potential, contract_amount in self.trade.offer[j].values():
                text += '%s ($%.2fM)\n' % (name, contract_amount/1000.0)
                total[j] += contract_amount
                self.value[j] += 10**(potential/10.0 + rating/20.0 - age/10.0 - contract_amount/10000.0) # Set in 2 places!!
            if self.value[j] > 0:
                self.value[j] = math.log(self.value[j])
            text += '$%.2fM total\n\n' % (total[j]/1000.0)
            #text += 'Value: %.4f\n\n' % (self.value[j])
            payroll_after_trade[i] = total[j]+payroll
            text += 'Payroll After Trade: $%.2fM' % (payroll_after_trade[i]/1000.0)

            self.label_trade[i].set_markup(text);

            if payroll_after_trade[i] > common.SALARY_CAP:
                over_cap[i] = True
            if total[i] > 0:
                ratios[i] = int((100.0*total[j])/total[i])
            elif total[j] > 0:
                ratios[i] = float('inf')
            else:
                ratios[i] = 1

        # Update "Propose Trade" button and the salary cap warning
        if (ratios[0] > 125 and over_cap[0] == True) or (ratios[1] > 125 and over_cap[1] == True):
            self.button_trade_propose.set_sensitive(False)
            # Which team is at fault?
            if ratios[0] > 125:
                name = names[0]
                ratio = ratios[0]
            else:
                name = names[1]
                ratio = ratios[1]
            self.label_trade_cap_warning.set_markup('\n<b>The %s are over the salary cap, so the players it receives must have a combined salary less than 125%% of the players it trades.  Currently, that value is %s%%.</b>' % (name, ratio))
        elif sum(total) == 0:
            # No trades with no players
            self.label_trade_cap_warning.set_text('')
            self.button_trade_propose.set_sensitive(False)
        else:
            self.label_trade_cap_warning.set_text('')
            self.button_trade_propose.set_sensitive(True)

