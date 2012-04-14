from flask import g

from bbgm import app

def request_context_globals(league_id):
    """Call this within an app.test_request_context() to set other globals."""
    app.preprocess_request()  # So that g is available
    g.league_id = league_id
    # The following txwo lines are copied from bbgm.util.decorators.global_game_attributes
    g.db.execute('SELECT team_id, season, phase, schedule, version FROM %s_game_attributes LIMIT 1', (g.league_id,))
    g.user_team_id, g.season, g.phase, g.schedule, g.version = g.db.fetchone()
