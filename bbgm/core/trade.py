import cPickle as pickle

from flask import session, g

from bbgm.util import get_payroll, roster_auto_sort

def new(team_id=None, player_id=None):
    """Start a new trade with a team.

    One of team_id or player_id can be set. If both are set, then team_id is
    ignored. If neither are set, a team_id of 0 is used.

    Args: 
        team_id: An optional integer representing the team ID of the team the
            user wants to trade with.
        player_id: An optional integer representing the ID of a player to be
            automatically added to the trade. Then, a trade will be initiated
            with that player's team, regardless of what team_id is set to.
    """
    # Convert player_id to team_id
    if player_id is None:
        player_ids_other = []
    else:
        player_ids_other = [int(player_id)]

    # Make sure team_id is set and corresponds to player_id, if set
    if team_id is None or player_id is not None:
        g.db.execute('SELECT team_id FROM player_attributes WHERE player_id = %s', (player_id,))
        team_id, = g.db.fetchone()

    # Start a new trade with team_id and, if set, player_id
    g.db.execute('UPDATE trade SET team_id = %s, player_ids_other = %s', (team_id, pickle.dumps(player_ids_other)))


def update_players(player_ids_user, player_ids_other):
    """Validates that players are allowed to be traded and then updates the
    trade in the database.

    If any of the player IDs submitted do not correspond with the two teams that
    are trading, they will be ignored.

    Args:
        player_ids_user: A list of integer player IDs from the user's team that
            are in the trade.
        player_ids_other: Same as player_ids_user but for the other team.

    Returns:
        A tuple containing the same lists as in the input, but with any invalid
        IDs removed.
    """
    player_ids = [player_ids_user, player_ids_other]

    # Ignore any invalid player IDs    
    g.db.execute('SELECT team_id FROM trade')
    team_id_other, = g.db.fetchone()
    team_ids = (g.user_team_id, team_id_other)
    for i in xrange(len(team_ids)):
        g.db.execute('SELECT player_id FROM player_attributes WHERE team_id = %s', (team_ids[i],))
        all_player_ids = [player_id for player_id, in g.db.fetchall()]
        player_ids[i] = [player_id for player_id in player_ids[i] if player_id in all_player_ids]

    # Save to database
    player_ids_user, player_ids_other = player_ids
    g.db.execute('UPDATE trade SET player_ids_user = %s, player_ids_other = %s', (pickle.dumps(player_ids_user), pickle.dumps(player_ids_other)))

    return (player_ids_user, player_ids_other)


def get_players():
    """Return two lists of integers, representing the player IDs who are added
    to the trade for the user's team and the other team, respectively.
    """
    g.db.execute('SELECT player_ids_user, player_ids_other FROM trade')
    return map(pickle.loads, g.db.fetchone())


def summary(team_id_other, player_ids_user, player_ids_other):
    """Return all the content needed to summarize the trade."""

    team_ids = [g.user_team_id, team_id_other]
    player_ids = [player_ids_user, player_ids_other]

    s = {'trade': [[], []], 'total': [0, 0], 'payroll_after_trade': [0, 0], 'team_names': ['', ''], 'warning': ''}

    # Calculate properties of the trade
    for i in xrange(2):
        if len(player_ids[i]) > 0:
            player_ids_sql = ', '.join([str(player_id) for player_id in player_ids[i]])
            g.dbd.execute('SELECT player_id, name, contract_amount / 1000 AS contract_amount FROM player_attributes WHERE player_id IN (%s)' % (player_ids_sql,))
            s['trade'][i] = g.dbd.fetchall()
            g.db.execute('SELECT SUM(contract_amount / 1000) FROM player_attributes WHERE player_id IN (%s)' % (player_ids_sql,))
            s['total'][i], = g.db.fetchone()

    # Test if any warnings need to be displayed
    over_cap = [False, False]
    over_roster_limit = [False, False]
    ratios = [0.0, 0.0]

    for i in xrange(2):
        if i == 0:
            j = 1
        elif i == 1:
            j = 0

        s['payroll_after_trade'][i] = float(get_payroll(team_ids[i])) / 1000 + float(s['total'][j]) - float(s['total'][i])

        g.db.execute('SELECT CONCAT(region, " ", name) FROM team_attributes WHERE team_id = %s AND season = %s', (team_ids[i], g.season))
        s['team_names'][i], = g.db.fetchone()
        g.db.execute('SELECT COUNT(*) FROM player_attributes WHERE team_id = %s', (team_ids[i],))
        num_players_on_roster, = g.db.fetchone() 

        if s['payroll_after_trade'][i] > float(g.salary_cap) / 1000:
            over_cap[i] = True
        if num_players_on_roster - len(player_ids[i]) + len(player_ids[j]) > 15:
            over_roster_limit[i] = True
        if s['total'][i] > 0:
            ratios[i] = int((100.0 * float(s['total'][j])) / float(s['total'][i]))
        elif s['total'][j] > 0:
            ratios[i] = float('inf')
        else:
            ratios[i] = 1

    if True in over_roster_limit:
#        self.button_trade_propose.set_sensitive(False)
        # Which team is at fault?
        if over_roster_limit[0] == True:
            team_name = s['team_names'][0]
        else:
            team_name = s['team_names'][1]
        s['warning'] = 'This trade would put the %s over the maximum roster size limit of 15 players.' % (team_name,)
    elif (ratios[0] > 125 and over_cap[0] == True) or (ratios[1] > 125 and over_cap[1] == True):
#        self.button_trade_propose.set_sensitive(False)
        # Which team is at fault?
        if ratios[0] > 125:
            team_name = s['team_names'][0]
            ratio = ratios[0]
        else:
            team_name = s['team_names'][1]
            ratio = ratios[1]
        s['warning'] = 'The %s are over the salary cap, so the players it receives must have a combined salary less than 125%% of the players it trades.  Currently, that value is %s%%.' % (team_name, ratio)

    return s


def clear():
    """Removes all players currently added to the trade."""
    g.db.execute('UPDATE trade SET player_ids_user = %s, player_ids_other = %s', (pickle.dumps([]), pickle.dumps([])))


def propose():
    pass


class Trade:
    """All non-GUI parts of a trade.

    Currently, it only works for trading between the user's team and a CPU
    team.
    """

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
