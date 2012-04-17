import cPickle as pickle
from juggernaut import Juggernaut
import time

from flask import url_for, g, render_template

from bbgm import app
from bbgm.util import lock

jug = Juggernaut()

def options(keys=None):
    """Set the options to be shown in the play button.

    Arguments:
        keys: A list of strings identifying the options to be shown. If left
            blank, the default options are shown based on the game state.

    Returns:
        A list of dicts, each dict containing the properties needed to build the
        play button.
    """
    all_options = [{'id': 'stop', 'url': '#', 'label': 'Stop', 'normal_link': False},
                   {'id': 'day', 'url': url_for('play', league_id=g.league_id, amount='day'), 'label': 'One day', 'normal_link': False},
                   {'id': 'week', 'url': url_for('play', league_id=g.league_id, amount='week'), 'label': 'One week', 'normal_link': False},
                   {'id': 'month', 'url': url_for('play', league_id=g.league_id, amount='month'), 'label': 'One month', 'normal_link': False},
                   {'id': 'until_playoffs', 'url': url_for('play', league_id=g.league_id, amount='until_playoffs'), 'label': 'Until playoffs', 'normal_link': False},
                   {'id': 'through_playoffs', 'url': url_for('play', league_id=g.league_id, amount='through_playoffs'), 'label': 'Through playoffs', 'normal_link': False},
                   {'id': 'until_draft', 'url': url_for('play', league_id=g.league_id, amount='until_draft'), 'label': 'Until draft', 'normal_link': False},
                   {'id': 'view_draft', 'url': url_for('draft_'), 'label': 'View draft', 'normal_link': True},
                   {'id': 'until_free_agency', 'url': url_for('play', league_id=g.league_id, amount='until_free_agency'), 'label': 'Until free agency', 'normal_link': False},
                   {'id': 'until_preseason', 'url': url_for('play', league_id=g.league_id, amount='until_preseason'), 'label': 'Until preseason', 'normal_link': False},
                   {'id': 'until_regular_season', 'url': url_for('play', league_id=g.league_id, amount='until_regular_season'), 'label': 'Until regular season', 'normal_link': False},
                   {'id': 'trade', 'url': '#', 'label': 'Continue trade negotiation', 'normal_link': False},
                   {'id': 'contract_negotiation', 'url': url_for('negotiation_list', league_id=g.league_id), 'label': 'Continue contract negotiation', 'normal_link': True}]

    if not keys:
        # Preseason
        if g.phase == 0:
            keys = ['until_regular_season']
        # Regular season - pre trading deadline
        elif g.phase == 1:
            keys = ['day', 'week', 'month', 'until_playoffs']
        # Regular season - post trading deadline
        elif g.phase == 2:
            keys = ['day', 'week', 'month', 'until_playoffs']
        # Playoffs
        elif g.phase == 3:
            keys = ['day', 'week', 'month', 'through_playoffs']
        # Offseason - pre draft
        elif g.phase == 4:
            keys = ['until_draft']
        # Draft
        elif g.phase == 5:
            keys = ['view_draft']
        # Offseason - post draft
        elif g.phase == 6:
            keys = ['until_free_agency']
        # Offseason - free agency
        elif g.phase == 7:
            keys = ['until_preseason']

        if lock.games_in_progress():
            keys = ['stop']
        if lock.trade_in_progress():
            keys = ['trade']
        if lock.negotiation_in_progress():
            keys = ['contract_negotiation']

    # This code is very ugly. Basically I just want to filter all_options into
    # some_options based on if the ID matches one of the keys.
    ids = [o['id'] for o in all_options]
    some_options = []
    for key in keys:
        i = 0
        for id_ in ids:
            if id_ == key:
                some_options.append(all_options[i])
                break
            i += 1

    return some_options

def set_status(status=None):
    """Save status to database and push to client.

    If no status is given, load the last status from the database and push that
    to the client.

    Args:
        status: A string containing the current status message to be pushed to
            the client.
    """
    g.db.execute('SELECT pm_status FROM %s_game_attributes WHERE season = %s', (g.league_id, g.season))
    old_status, = g.db.fetchone()

    if not status:
        status = old_status
        jug.publish('%d_status' % (g.league_id,), status)
    if status != old_status:
        g.db.execute('UPDATE %s_game_attributes SET pm_status = %s WHERE season = %s', (g.league_id, status, g.season))
        jug.publish('%d_status' % (g.league_id,), status)
        app.logger.debug('Set status: %s' % (status,))

def set_phase(phase_text=None):
    """Save phase text to database and push to client.

    If no phase text is given, load the last phase text from the database and
    push that to the client.

    Args:
        phase_text: A string containing the current phase text to be pushed to
            the client.
    """
    g.db.execute('SELECT pm_phase FROM %s_game_attributes WHERE season = %s', (g.league_id, g.season))
    old_phase_text, = g.db.fetchone()

    if not phase_text:
        phase_text = old_phase_text
        jug.publish('%d_phase' % (g.league_id,), phase_text)
    if phase_text != old_phase_text:
        g.db.execute('UPDATE %s_game_attributes SET pm_phase = %s WHERE season = %s', (g.league_id, phase_text, g.season))
        jug.publish('%d_phase' % (g.league_id,), phase_text)
        app.logger.debug('Set phase: %s' % (phase_text,))

def refresh_options():
    """Get current options based on game state and push rendered play button
    to client.
    """
    button = render_template('play_button.html', league_id=g.league_id, options=options())
    jug.publish('%d_button' % (g.league_id,), button)

