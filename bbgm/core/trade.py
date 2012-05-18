import cPickle as pickle

from bbgm.util import roster_auto_sort

def new(team_id=0, player_id=None):
    """Start a new trade with a team.

    One of team_id or player_id can be set. If both are set, then team_id is
    ignored. If neither are set, a team_id of 0 is used.

    Args: 
        team_id: An optional integer representing the team ID of the team the
            user wants to trade with.
        player_id: An optional integer representing the ID of a player to be
            automatically added to the trade. Then, a trade will be initiated
            with that player's team, regardless of what team_id is set to.

    Returns:
        False if the new trade is started successfully. Otherwise, it returns a
        string containing an error message to be sent to the user.
    """
    # Check permissions as in contract_negotiation.new

    # Convert player_id to team_id

    # Make sure team_id is set

    # Start a new trade with team_id and, if set, player_id
    pass

class Trade:
    """All non-GUI parts of a trade.

    Currently, it only works for trading between the user's team and a CPU
    team.
    """
    def __init__(self, team_id=None):
        """Creates a new trade or loads an active trade.

        Args:
            team_id: Team the player is trading with. This argument is optional.
                If set, then a row for this trade is INSERTed into the database.
                If not set, then the currently active trade is loaded from the
                database.
            
            td: Trade data dict, typically loaded from the database in
                Trade.load.
        """
        if team_id is not None:
            # In all of these variables, the first element represents the user's
            # team and the second element represents the CPU team.
            self.td['team_id'] = [g.user_team_id, team_id]
            self.td['offer'] = [{}, {}]
            self.td['payroll_after_trade'] = [0, 0]
            self.td['total'] = [0, 0]  # Total contract amount for players in trade
            self.td['value'] = [0, 0]
            self.td['over_cap'] = [False, False]
            self.td['over_roster_limit'] = [False, False]
            self.td['ratios'] = [0, 0]
            self.td['team_names'] = ['', '']
            g.db.execute('INSERT INTO trade (data) VALUES '')
        else:
            g.db.execute('SELECT data FROM trade LIMIT 1')
            data, = g.db.fetchone()
            self.td=pickle.loads(data.encode('ascii')))

    def save(self):
        """Saves the active trade to the database."""
        g.db.execute('UPDATE trade SET data = %s', (pickle.dumps(self.td),))

    def update(self):
        """Update all the trade attributes.

        This should be called by the view after any change is made and before
        the UI updates. It isn't called automatically because there is already
        some UI function that's tracking updates, and it's just easier to call
        this from there.
        """
        for team_id in [common.PLAYER_TEAM_ID, self.td['team_id'][1]]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                j = 1
            else:
                i = 1
                j = 0
            team_name, payroll = common.DB_CON.execute('SELECT ta.region || " " || ta.name, SUM(pa.contract_amount) + (SELECT TOTAL(contract_amount) FROM released_players_salaries WHERE released_players_salaries.team_id = ta.team_id) FROM team_attributes as ta, player_attributes as pa WHERE pa.team_id = ta.team_id AND ta.team_id = ? AND pa.contract_expiration >= ? AND ta.season = ?', (team_id, common.SEASON, common.SEASON,)).fetchone()
            self.team_names[i] = team_name
            num_players_on_roster, = common.DB_CON.execute('SELECT COUNT(*) FROM player_attributes WHERE team_id = ?', (team_id,)).fetchone()

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
            self.payroll_after_trade[i] = payroll - self.total[i] + self.total[j]

            if self.payroll_after_trade[i] > common.SALARY_CAP:
                self.over_cap[i] = True
            else:
                self.over_cap[i] = False
            if num_players_on_roster - len(self.offer[i]) + len(self.offer[j]) > 15:
                self.over_roster_limit[i] = True
            else:
                self.over_roster_limit[i] = False
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
        self.td['team_id'][1] = team_id
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
        for team_id in [common.PLAYER_TEAM_ID, self.td['team_id'][1]]:
            if team_id == common.PLAYER_TEAM_ID:
                i = 0
                new_team_id = self.td['team_id'][1]
            else:
                i = 1
                new_team_id = common.PLAYER_TEAM_ID
            for player_id, team_id, name, age, rating, potential, contract_amount in self.offer[i].values():
                common.DB_CON.execute('UPDATE player_attributes SET team_id = ? WHERE player_id = ?', (new_team_id, player_id))

        # Auto-sort CPU team roster
        roster_auto_sort(self.td['team_id'][1])
