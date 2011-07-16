import ctypes
import gtk
import random
import sqlite3

from bbgm import common
from bbgm.core import player
from bbgm.util import resources
from bbgm.views import player_window


class ContractWindow:
    def on_contract_window_response(self, dialog, response, *args):
        '''
        This is so the dialog isn't closed on any button except close.
        '''
        if response < 0:
            # Player should already be a free agent, so...
            pass
        else:
            self.contract_window.emit_stop_by_name('response')

    def on_spinbutton_contract_team_amount_input(self, spinbutton, gpointer, data=None):
        text = spinbutton.get_text()
        if text.startswith('$'):
            text = text[1:-1]  # Get rid of the $ and the M
        double = ctypes.c_double.from_address(hash(gpointer))
        double.value = float(text)
        return True

    def on_spinbutton_contract_team_amount_output(self, spinbutton, data=None):
        text = '$%.2fM' % spinbutton.get_value()
        spinbutton.set_text(text)
        return True

    def on_button_contract_player_info_clicked(self, button, data=None):
        if not hasattr(self.mw, 'pw'):
            self.mw.pw = player_window.PlayerWindow(self.mw)
        self.mw.pw.update_player(self.player_id)

    def on_button_contract_accept_clicked(self, button, data=None):
        # Check salary cap for free agents
        if self.allow_over_salary_cap or (common.SALARY_CAP >= self.payroll + self.player_amount or self.player_amount == 500):
            # Adjust to account for in-season signings
            if self.mw.phase <= 2:
                player_years = self.player_years - 1
            else:
                player_years = self.player_years
            common.DB_CON.execute('UPDATE player_attributes SET team_id = ?, contract_amount = ?, contract_expiration = ? WHERE player_id = ?', (common.PLAYER_TEAM_ID, self.player_amount, common.SEASON + player_years, self.player_id))
            self.contract_window.destroy()
        else:
            md = gtk.MessageDialog(parent=self.contract_window, flags=0, type=gtk.MESSAGE_WARNING, buttons=gtk.BUTTONS_CLOSE, message_format='This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary.')
            md.run()
            md.destroy()

    def on_button_contract_submit_clicked(self, button, data=None):
        team_amount = self.spinbutton_contract_team_amount.get_value() * 1000
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
            if team_amount < self.player_amount and team_amount > 0.7 * self.player_amount:
                self.player_amount = .75 * self.player_amount + .25 * team_amount
            elif team_amount < self.player_amount:
                self.player_amount *= 1.1
            if team_amount > self.player_amount:
                self.player_amount = team_amount
        else:
            self.player_amount = 1.05 * self.player_amount

        if self.player_amount > 20000:
            self.player_amount = 20000
        if self.player_years > 5:
            self.player_years = 5

        self.update_label_contract_player_proposal()

    def update_label_contract_player_proposal(self):
        self.player_amount = 50 * round(self.player_amount / 50.0)  # Make it a multiple of 50k
        salary = '$%.2fM' % (self.player_amount / 1000.0)
        self.label_contract_player_proposal.set_markup('<big><big><b>Player Proposal</b></big></big>\n\
%d years (Through %d)\n\
%s' % (self.player_years, common.SEASON + self.player_years, salary))

    def __init__(self, main_window, player_id, allow_over_salary_cap = False):
        self.mw = main_window
        self.player_id = player_id
        self.allow_over_salary_cap = allow_over_salary_cap  # To allow for a team to resign its own players

        self.builder = gtk.Builder()
        self.builder.add_objects_from_file(resources.get_asset('ui', 'basketball-gm.glade'), ['adjustment1', 'adjustment2', 'contract_window'])

        self.contract_window = self.builder.get_object('contract_window')
        self.label_contract_team_info = self.builder.get_object('label_contract_team_info')
        self.label_contract_player_info = self.builder.get_object('label_contract_player_info')
        self.label_contract_player_proposal = self.builder.get_object('label_contract_player_proposal')
        self.spinbutton_contract_team_years = self.builder.get_object('spinbutton_contract_team_years')
        self.spinbutton_contract_team_amount = self.builder.get_object('spinbutton_contract_team_amount')

        self.builder.connect_signals(self)

        self.steps = 0  # Number of compromises/negotiations
        self.max_steps = random.randint(1, 5)

        name, self.team_id, overall, potential = common.DB_CON.execute('SELECT pa.name, pa.team_id, pr.overall, pr.potential FROM player_attributes as pa, player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.player_id = ?', (self.player_id,)).fetchone()
        self.label_contract_player_info.set_markup('<big><big><b>%s</b></big></big>\n\
Overall: %d\n\
Potential: %d' % (name, overall, potential))

        name, self.payroll = common.DB_CON.execute('SELECT ta.region || " " || ta.name, SUM(pa.contract_amount) + (SELECT TOTAL(contract_amount) FROM released_players_salaries WHERE released_players_salaries.team_id = ta.team_id) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration >= ? AND ta.season = ?', (common.PLAYER_TEAM_ID, common.SEASON, common.SEASON)).fetchone()
        salary_cap = '$%.2fM' % (common.SALARY_CAP / 1000.0)
        payroll = '$%.2fM' % (self.payroll / 1000.0)
        self.label_contract_team_info.set_markup('<big><big><b>%s</b></big></big>\n\
Payroll: %s\n\
Salary Cap: %s' % (name, payroll, salary_cap))

        # Initial player proposal
        self.player_amount, expiration = common.DB_CON.execute('SELECT contract_amount, contract_expiration FROM player_attributes WHERE player_id = ?', (self.player_id,)).fetchone()
        self.player_years = expiration - common.SEASON
        # Adjust to account for in-season signings
        if self.mw.phase <= 2:
            self.player_years += 1
        self.update_label_contract_player_proposal()
        self.spinbutton_contract_team_amount.set_value(self.player_amount / 1000.0)
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
        self.contract_window.add_action_widget(button, gtk.RESPONSE_CLOSE)
        button.show_all()
