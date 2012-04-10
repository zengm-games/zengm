import random

from flask import session, g

import bbgm
from bbgm.core import player

def generate_players():
    profiles = ['Point', 'Wing', 'Big', 'Big', '']
    gp = player.GeneratePlayer()
    sql = ''
    g.db.execute('SELECT MAX(player_id) + 1 FROM %s_player_attributes', (g.league_id,))
    player_id, = g.db.fetchone()
    team_id = -2  # -2 is the team_id for players generated for the draft
    for p in xrange(70):
        base_rating = random.randrange(0, 20)
        potential = int(random.gauss(45, 20))
        if potential < base_rating:
            potential = base_rating
        if potential > 90:
            potential = 90

        i = random.randrange(len(profiles))
        profile = profiles[i]

        aging_years = random.randrange(4)
        draft_year = g.season

        gp.new(player_id, team_id, 19, profile, base_rating, potential, draft_year)
        gp.develop(aging_years)

        sql += gp.sql_insert(g.league_id)

        player_id += 1
    print sql
    bbgm.bulk_execute(sql)

    # Update roster positions (so next/prev buttons work in player dialog)
    roster_position = 1
    g.db.execute('SELECT pr.player_id FROM %s_player_attributes as pa, %s_player_ratings as pr WHERE pa.player_id = pr.player_id AND pa.team_id = -2 ORDER BY pr.overall + 2*pr.potential DESC', (g.league_id, g.league_id))
    for player_id, in g.db.fetchall():
        g.db.execute('UPDATE %s_player_ratings SET roster_position = %s WHERE player_id = %s', (g.league_id, roster_position, player_id))
        roster_position += 1

def set_draft_order():
    """Sets draft order based on winning percentage (no lottery)."""
    for draft_round in xrange(1, 3):
        pick = 1
        g.db.execute('SELECT team_id, abbreviation FROM %s_team_attributes WHERE season =  %s ORDER BY 1.0*won/(won + lost) ASC', (g.league_id, g.season))
        for team_id, abbreviation in g.db.fetchall():
            g.db.execute('INSERT INTO %s_draft_results (season, draft_round, pick, team_id, abbreviation, player_id, player_name) VALUES (%s, %s, %s, %s, %s, %s, %s)', (g.league_id, g.season, draft_round, pick, team_id, abbreviation, 0, ''))
            pick += 1

def do_draft():
    # Do the draft
    for row in self.liststore_draft_results:
        while Gtk.events_pending():
            Gtk.main_iteration()  # This stops everything from freezing

        team_id = row[1]
        self.round = row[2]

        if team_id != g.user_team_id:
            self.pick = abs(int(random.gauss(0, 3)))
            time.sleep(0.1)
        else:
            # The player has to pick
            self.button_draft_player.set_sensitive(True)
            self.picked = False
            while not self.picked:
                while Gtk.events_pending():
                    Gtk.main_iteration()  # This stops everything from freezing
                time.sleep(0.01)
            self.button_draft_player.set_sensitive(False)
        self.pick_player(row, self.pick)

    # Replace Draft Player button with stock Close button
    self.button_draft_player.destroy()
    self.button_close = self.draft_dialog.add_button(Gtk.STOCK_CLOSE, Gtk.ResponseType.CLOSE)
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
    row2 = common.DB_CON.execute('SELECT MAX(player_ratings.roster_position) + 1 FROM player_attributes, '
                                 'player_ratings WHERE player_attributes.player_id = player_ratings.player_id AND '
                                 'player_attributes.team_id = ?', (row[1],)).fetchone()
    roster_position = row2[0]
    common.DB_CON.execute('UPDATE player_attributes SET team_id = ?, draft_year = ?, draft_round = ?, '
                          'draft_pick = ?, draft_team_id = ? WHERE player_id = ?', (row[1], common.SEASON, row[2],
                          row[3], row[1], row[0]))
    common.DB_CON.execute('UPDATE player_ratings SET roster_position = ? WHERE player_id = ?', (roster_position,
                          row[0]))
    self.liststore_draft_available.remove(self.liststore_draft_available.get_iter(pick))

    # Contract
    i = row[3] - 1 + 30 * (row[2] - 1)
    contract_amount = self.rookie_salaries[i]
    years = 4 - row[2]  # 2 years for 2nd round, 3 years for 1st round
    contract_expiration = common.SEASON + years
    common.DB_CON.execute('UPDATE player_attributes SET contract_amount = ?, contract_expiration = ? WHERE '
                          'player_id = ?', (contract_amount, contract_expiration, row[0]))
