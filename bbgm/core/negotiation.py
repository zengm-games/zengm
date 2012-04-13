from flask import g

from bbgm.util import lock, logger

def new(player_id):
    """Start a new contract negotiation with player.

    player_id must correspond with a free agent.

    Returns False if the new negotiation is started successfully. Otherwise, it
    returns a string containing an error message to be sent to the user.
    """
    logger.debug('Trying to start new contract negotiation with player %d' % (player_id,))

    # Check if over roster limit
    g.db.execute('SELECT COUNT(*) FROM %s_player_attributes WHERE team_id = %s', (g.league_id, g.user_team_id))
    num_players_on_roster, = g.db.fetchone()
    if num_players_on_roster >= 15:
        return "Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.";

    # Check if state is locked
    if not lock.can_start_negotiation():
        return "You cannot initiate a new negotiaion while game simulation is in progress, a previous contract negotiation is in process, or a trade is in progress.";

    # Check if player_id is a free agent
    g.db.execute('SELECT team_id FROM %s_player_attributes WHERE player_id = %s', (g.league_id, player_id))
    team_id, = g.db.fetchone()
    if team_id != -1:
        return "Player %d is not a free agent." % (player_id,);

def get_status(player_id):
    g.db.execute('SELECT team_amount, team_years, player_amount, player_years FROM %s_negotiation WHERE player_id = %s', (g.league_id, player_id))
    team_amount, team_years, player_amount, player_years = g.db.fetchone()
    return team_amount, team_years, player_amount, player_years
