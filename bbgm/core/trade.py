import math
import random
import sqlite3

from bbgm import common


class Trade:
    """All non-GUI parts of a trade.

    Currently, it only works for trading between the user's team and a CPU
    team.
    """

    # In all of these variables, the first element represents the user's team
    # and the second element represents the CPU team.
    offer = [{}, {}]
    payroll_after_trade = [0, 0]
    total = [0, 0]  # Total contract amount for players in trade
    value = [0, 0]
    over_cap = [False, False]
    ratios = [0, 0]
    team_names = ['', '']

    def __init__(self, team_id):
        """Inits Trade with team ID.

        Args:
            team_id: Team the player is trading with.
        """
        self.team_id = team_id

    def update(self):
        """Update all the class attributes.

        This should be called by the view after any change is made and before
        the UI updates. It isn't called automatically because there is already
        some UI function that's tracking updates, and it's just easier to call
        this from there.
        """
        for team_id in [common.PLAYER_TEAM_ID, self.team_id]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                j = 1
            else:
                i = 1
                j = 0
            team_name, payroll = common.DB_CON.execute('SELECT ta.region || " " || ta.name, sum(pa.contract_amount) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration >= ? AND ta.season = ?', (team_id, common.SEASON, common.SEASON,)).fetchone()
            self.team_names[i] = team_name

            self.total[i] = 0
            self.value[i] = 0.0
            for player_id, team_id, player_name, age, rating, potential, contract_amount in self.offer[i].values():
                self.total[i] += contract_amount
                self.value[i] += 10 ** (potential / 10.0 + rating / 20.0 - age / 10.0 - contract_amount / 100000.0)
#            if self.value[i] > 0:
#                self.value[i] = math.log10(self.value[i])

            self.total[j] = 0
#            self.value[j] = 0
            for player_id, team_id, team_name, age, rating, potential, contract_amount in self.offer[j].values():
                self.total[j] += contract_amount
#                self.value[j] += 10 ** (potential / 10.0 + rating / 20.0 - age / 10.0 - contract_amount / 10000.0)  # Set in 2 places!!
#            if self.value[j] > 0:
#                self.value[j] = math.log(self.value[j])
            self.payroll_after_trade[i] = self.total[j] + payroll

            if self.payroll_after_trade[i] > common.SALARY_CAP:
                self.over_cap[i] = True
            if self.total[i] > 0:
                self.ratios[i] = int((100.0 * self.total[j]) / self.total[i])
            elif self.total[j] > 0:
                self.ratios[i] = float('inf')
            else:
                self.ratios[i] = 1

    def clear_offer(self):
        """Clear the current offer, but leave the teams alone."""
        self.offer = [{}, {}]

    def new_team(self, team_id):
        """Switch to a new trading partner."""
        self.team_id = team_id
        self.offer[1] = {}  # Empty player list

    def add_player(self, i, player_id, team_id, player_name, age, rating, potential, contract_amount):
        """Adds a player to the deal.

        Args:
            i: 0 for the user's team, 1 for the CPU team.
            player_id: player_id of the player to add.
            ...
        """
        self.offer[i][player_id] = [player_id, team_id, player_name, age, rating, potential, contract_amount]

    def remove_player(self, i, player_id):
        """Removes a player from the deal.

        Args:
            i: 0 for the user's team, 1 for the CPU team.
            player_id: player_id of the player to remove.
        """
        del self.offer[i][player_id]

    def propose(self):
        """Propose the trade to the other team. Is it accepted?

        Returns:
            A list containing two elements: 1. a boolean indicating if the
            trade was accepted (True) or not (False); 2. a string containing
            the response from the CPU team.
        """
        if self.value[0] > self.value[1] * 0.9:
            return [True, 'Nice doing business with you!']
        else:
            return [False, 'What, are you crazy?']

    def process(self):
        """Process the proposed trade.

        This is called after the trade is accepted, to assign players to their
        new teams.
        """
        # Trade players
        for team_id in [common.PLAYER_TEAM_ID, self.team_id]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                new_team_id = self.team_id
            else:
                i = 1
                new_team_id = common.PLAYER_TEAM_ID
            for player_id, team_id, name, age, rating, potential, contract_amount in self.offer[i].values():
                common.DB_CON.execute('UPDATE player_attributes SET team_id = ? WHERE player_id = ?', (new_team_id, player_id))

        # Auto-sort CPU team roster
        common.roster_auto_sort(self.team_id)
