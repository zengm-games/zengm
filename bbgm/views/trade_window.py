import gtk
import math
import random
import sqlite3

from bbgm import common
from bbgm.core.trade import Trade
from bbgm.util import resources


class TradeWindow:
    def __init__(self, main_window, team_id=-1, player_id=-1):
        self.mw = main_window

        if team_id < 0:
            team_id = 0
        self.trade = Trade(team_id)

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.ui'), ['liststore1', 'trade_window'])

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

        # Fill the combobox with teams
        model = self.combobox_trade_teams.get_model()
        self.combobox_trade_teams.set_model(None)
        model.clear()
        for row in common.DB_CON.execute('SELECT region || " " || name, team_id FROM team_attributes WHERE season = ?  AND team_id != ? ORDER BY team_id ASC', (common.SEASON, common.PLAYER_TEAM_ID)):
            model.append(['%s' % row[0]])
            if row[1] == common.PLAYER_TEAM_ID:
                self.label_team_name.set_text(row[0])
        self.combobox_trade_teams.set_model(model)
        self.combobox_trade_teams.set_active(self.trade.team_id)

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
        accept, comment = self.trade.propose()
        if accept:
            self.trade.process()

            # Show dialog
            dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_INFO, gtk.BUTTONS_CLOSE, 'Your trade proposal was accepted.\n\n"%s"' % (comment,))
            dialog.run()
            dialog.destroy()
            self.trade_window.destroy()

            # Update tabs in the main window
            self.mw.finances.updated = False
            self.mw.player_stats.updated = False
            self.mw.player_ratings.updated = False
            self.mw.update_current_page()
        else:
            dialog = gtk.MessageDialog(None, 0, gtk.MESSAGE_INFO, gtk.BUTTONS_CLOSE, 'Your trade proposal was rejected.\n\n"%s"' % (comment,))
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

        self.trade.new_team(new_team_id)

        # Reset and update treeview
        self.update_roster(self.treeview_trade[1], self.trade.team_id)
        self.renderer_1.disconnect(self.renderer_1_toggled_handle_id)
        self.renderer_1_toggled_handle_id = self.renderer_1.connect('toggled', self.on_player_toggled, self.treeview_trade[1].get_model())

        self.update_trade_summary()

    def on_player_toggled(self, cell, path, model, data=None):
        model[path][2] = not model[path][2]  # Update checkbox

        player_id = model[path][0]
        team_id = model[path][1]
        player_name = model[path][3]
        age = model[path][5]
        rating = model[path][6]
        potential = model[path][7]

        if team_id == common.PLAYER_TEAM_ID:
            i = 0
        else:
            i = 1

        if model[path][2]:  # Check: add player to offer
            contract_amount, = common.DB_CON.execute('SELECT contract_amount FROM player_attributes WHERE player_id = ?', (player_id,)).fetchone()
            self.trade.add_player(i, player_id, team_id, player_name, age, rating, potential, contract_amount)
        else:  # Uncheck: delete player from offer
            self.trade.remove_player(i, player_id)

        self.update_trade_summary()

    def build_roster(self, treeview, renderer_toggle):
        column = gtk.TreeViewColumn('Trade', renderer_toggle)
        column.add_attribute(renderer_toggle, 'active', 2)
        column.set_sort_column_id(2)
        treeview.append_column(column)

        column_types = [int, int, 'gboolean', str, str, int, int, int, str, float, float, float, float]
        column_info = [['Name', 'Pos', 'Age', 'Ovr', 'Pot', 'Contract', 'Min', 'Pts', 'Reb', 'Ast'],
                       [3,      4,     5,     6,     7,     8,          9,     10,    11,    12],
                       [True,   True,  True,  True,  True,  True,       True,  True,  True,  True],
                       [False,  False, False, False, False, False,      True,  True,  True,  True]]
        tooltips = ['', 'Position', '', 'Overall Rating', 'Potential Rating', '', 'Minutes', 'Points', 'Rebounds', 'Assists']
        common.treeview_build_new(treeview, column_types, column_info, tooltips)

    def update_roster(self, treeview, team_id):
        query_ids = 'SELECT player_attributes.player_id FROM player_attributes, player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND player_attributes.team_id = ? ORDER BY player_ratings.roster_position ASC'
        params_ids = [team_id]
        query_row = 'SELECT player_attributes.player_id, player_attributes.team_id, 0, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration, AVG(player_stats.minutes), AVG(player_stats.points), AVG(player_stats.offensive_rebounds + player_stats.defensive_rebounds), AVG(player_stats.assists) FROM player_attributes, player_ratings, player_stats WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_ratings.player_id AND player_stats.player_id = player_ratings.player_id AND player_stats.season = ?' % common.SEASON
        params_row = [-1, common.SEASON]
        query_row_alt = 'SELECT player_attributes.player_id, player_attributes.team_id, 0, player_attributes.name, player_attributes.position, ROUND((julianday("%d-06-01") - julianday(player_attributes.born_date))/365.25), player_ratings.overall, player_ratings.potential, "$" || round(contract_amount/1000.0, 2) || "M thru " || contract_expiration, 0, 0, 0, 0 FROM player_attributes, player_ratings WHERE player_attributes.player_id = ? AND player_attributes.player_id = player_ratings.player_id' % common.SEASON
        params_row_alt = [-1]

        common.treeview_update_new(treeview, query_ids, params_ids, query_row, params_row, query_row_alt, params_row_alt)

    def update_trade_summary(self):
        self.label_trade_summary.set_markup('<b>Trade Summary</b>\n\nSalary Cap: $%.2fM\n' % (common.SALARY_CAP / 1000.0))

        self.trade.update()  # Update all the data which is then displayed below

        for team_id in [common.PLAYER_TEAM_ID, self.trade.team_id]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                j = 1
            else:
                i = 1
                j = 0
            text = '<b>%s</b>\n\nTrade:\n' % self.trade.team_names[i]

            for player_id, team_id, player_name, age, rating, potential, contract_amount in self.trade.offer[i].values():
                text += '%s ($%.2fM)\n' % (player_name, contract_amount / 1000.0)
            text += '$%.2fM total\n\n' % (self.trade.total[i] / 1000.0)
            if common.DEBUG:
                text += 'Value: %s\n\n' % ('{:,.0f}'.format(self.trade.value[i]))
            text += 'Recieve:\n'

            for player_id, team_id, player_name, age, rating, potential, contract_amount in self.trade.offer[j].values():
                text += '%s ($%.2fM)\n' % (player_name, contract_amount / 1000.0)
            text += '$%.2fM total\n\n' % (self.trade.total[j] / 1000.0)
            if common.DEBUG:
                text += 'Value: %s\n\n' % ('{:,.0f}'.format(self.trade.value[j]))
            text += 'Payroll After Trade: $%.2fM' % (self.trade.payroll_after_trade[i] / 1000.0)

            self.label_trade[i].set_markup(text)

        # Update "Propose Trade" button and the warnings (over salary cap or over roster limit)
        if self.trade.over_roster_limit[0] == True or self.trade.over_roster_limit[1] == True:
            self.button_trade_propose.set_sensitive(False)
            # Which team is at fault?
            if self.trade.over_roster_limit[0] == True:
                team_name = self.trade.team_names[0]
            else:
                team_name = self.trade.team_names[1]
            self.label_trade_cap_warning.set_markup('\n<b>This trade would put the %s over the maximum roster size limit of 15 players.</b>' % (team_name,))
        elif (self.trade.ratios[0] > 125 and self.trade.over_cap[0] == True) or (self.trade.ratios[1] > 125 and self.trade.over_cap[1] == True):
            self.button_trade_propose.set_sensitive(False)
            # Which team is at fault?
            if self.trade.ratios[0] > 125:
                team_name = self.trade.team_names[0]
                ratio = self.trade.ratios[0]
            else:
                team_name = self.trade.team_names[1]
                ratio = self.trade.ratios[1]
            self.label_trade_cap_warning.set_markup('\n<b>The %s are over the salary cap, so the players it receives must have a combined salary less than 125%% of the players it trades.  Currently, that value is %s%%.</b>' % (team_name, ratio))
        elif sum(self.trade.total) == 0:
            # No trades with no players
            self.label_trade_cap_warning.set_text('')
            self.button_trade_propose.set_sensitive(False)
        else:
            self.label_trade_cap_warning.set_text('')
            self.button_trade_propose.set_sensitive(True)
