import sys
import gtk
import pango
import sqlite3
import locale

import common
import player
import player_window
import random

class ContractWindow:
    def on_contract_window_response(self, dialog, response, *args):
        '''
        This is so the dialog isn't closed on any button except close.
        '''
        self.contract_window.emit_stop_by_name('response')
        if response < 0:
            common.DB_CON.execute('UPDATE player_attributes SET team_id = -1 WHERE player_id = ?', (self.player_id,))
            self.contract_window.destroy()

    def on_button_contract_player_info_clicked(self, button, data=None):
        if not hasattr(self.main_window, 'pw'):
            self.main_window.pw = player_window.PlayerWindow()
        self.main_window.pw.update_player(self.player_id)

    def on_button_contract_accept_clicked(self, button, data=None):
        # Check salary cap for free agents
        if self.team_id == common.PLAYER_TEAM_ID or (common.SALARY_CAP >= self.payroll + self.player_amount or self.player_amount == 500):
            common.DB_CON.execute('UPDATE player_attributes SET team_id = ?, contract_amount = ?, contract_expiration = ? WHERE player_id = ?', (common.PLAYER_TEAM_ID, self.player_amount, common.SEASON + self.player_years, self.player_id))
            self.contract_window.destroy()
        else:
            md = gtk.MessageDialog(parent=self.contract_window, flags=0, type=gtk.MESSAGE_WARNING, buttons=gtk.BUTTONS_CLOSE, message_format='You can only sign free agents at the league minimum when you are over the salary cap.')
            md.run()
            md.destroy()

    def on_button_contract_submit_clicked(self, button, data=None):
        team_amount = self.spinbutton_contract_team_amount.get_value_as_int()/1000
        team_years = self.spinbutton_contract_team_years.get_value_as_int()

        self.steps += 1

        # Negotiation step
        if self.steps <= self.max_steps:
            if team_years < self.player_years:
                self.player_years -= 1
                self.player_amount *= 1.5
            elif team_years > self.player_years:
                self.player_years += 1
                self.player_amount *= 1.5
            if team_amount < self.player_amount and team_amount > 0.7*self.player_amount:
                self.player_amount = .75*self.player_amount + .25*team_amount
            elif team_amount < self.player_amount:
                self.player_amount *= 1.1
            if team_amount >= self.player_amount:
                self.player_amount = 1.1*team_amount
        else:
            self.player_amount = 1.05*self.player_amount

        self.update_label_contract_player_proposal()

    def update_label_contract_player_proposal(self):
        self.player_amount = 50*round(self.player_amount/50.0) # Make it a multiple of 50k
        salary = locale.format("%.*f", (0, self.player_amount*1000), True)
        self.label_contract_player_proposal.set_markup('<big><big><b>Player Proposal</b></big></big>\n\
%d years (Through %d)\n\
$%s' % (self.player_years, common.SEASON + self.player_years, salary))

    def __init__(self, main_window, player_id):
        self.main_window = main_window
        self.player_id = player_id

        self.builder = gtk.Builder()
        self.builder.add_from_file(common.GTKBUILDER_PATH) 

        self.contract_window = self.builder.get_object('contract_window')
        self.label_contract_team_info = self.builder.get_object('label_contract_team_info')
        self.label_contract_player_info = self.builder.get_object('label_contract_player_info')
        self.label_contract_player_proposal = self.builder.get_object('label_contract_player_proposal')
        self.spinbutton_contract_team_years = self.builder.get_object('spinbutton_contract_team_years')
        self.spinbutton_contract_team_amount = self.builder.get_object('spinbutton_contract_team_amount')

        self.builder.connect_signals(self)

        self.steps = 0 # Number of compromises/negotiations
        self.max_steps = random.randint(1, 5)

        name, self.team_id, overall, potential = common.DB_CON.execute('SELECT pa.name, pa.team_id, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.player_id = ?', (self.player_id,)).fetchone()
        self.label_contract_player_info.set_markup('<big><big><b>%s</b></big></big>\n\
Overall: %d\n\
Potential: %d' % (name, overall, potential))

        name, self.payroll = common.DB_CON.execute('SELECT ta.region || " " || ta.name, sum(pa.contract_amount) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration> ?', (common.PLAYER_TEAM_ID, common.SEASON,)).fetchone()
        locale.setlocale(locale.LC_NUMERIC, '')
        salary_cap = locale.format("%.*f", (0, common.SALARY_CAP*1000), True)
        payroll = locale.format("%.*f", (0, self.payroll*1000), True)
        self.label_contract_team_info.set_markup('<big><big><b>%s</b></big></big>\n\
Payroll: $%s\n\
Salary Cap: $%s' % (name, payroll, salary_cap))

        # Initial player proposal
        potential_difference = round((potential - overall) / 4.0)
        self.player_years = 5 - potential_difference # Players with high potentials want short contracts
        p = player.Player()
        p.load(self.player_id)
        self.player_amount, expiration = p.contract()
        self.update_label_contract_player_proposal()
        self.spinbutton_contract_team_amount.set_value(self.player_amount*1000)
        self.spinbutton_contract_team_years.set_value(self.player_years)

        # If signing free agents, close should be Cancel.  For resigning players it should be Release Player.
        button = gtk.Button()
        image = gtk.Image()
        image.set_from_stock(gtk.STOCK_CANCEL, gtk.ICON_SIZE_BUTTON)
        if self.team_id == common.PLAYER_TEAM_ID:
            label = gtk.Label('_Release Player')
        else:
            label = gtk.Label('_Cancel')
        label.set_use_underline(True)
        hbox = gtk.HBox(False, 2)
        hbox.pack_start(image)
        hbox.pack_start(label)
        alignment = gtk.Alignment(0.5, 0.5, 0, 0)
        alignment.add(hbox)
        button.add(alignment)
        self.contract_window.add_action_widget(button, -7)
        button.show_all()

