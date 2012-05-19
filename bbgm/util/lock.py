"""
bbgm.util.lock

These functions all deal with locking game state when there is some blocking
action in progress, currently one of these things:

* Game simulation is in progress
* User is trying to make a trade
* User is negotiating a contract

There are also functions to check if it is permissible to start one of those
actions.
"""

from flask import g

def set_games_in_progress(status):
    g.db.execute('UPDATE game_attributes SET games_in_progress = %s', (status,))

def set_trade_in_progress(status):
    g.db.execute('UPDATE game_attributes SET trade_in_progress = %s', (status,))

def set_negotiation_in_progress(status):
    g.db.execute('UPDATE game_attributes SET negotiation_in_progress = %s', (status,))

def games_in_progress():
    g.db.execute('SELECT games_in_progress FROM game_attributes')
    in_progress, = g.db.fetchone()
    return in_progress

def trade_in_progress():
    g.db.execute('SELECT trade_in_progress FROM game_attributes')
    in_progress, = g.db.fetchone()
    return in_progress

def negotiation_in_progress():
    g.db.execute('SELECT negotiation_in_progress FROM game_attributes')
    in_progress, = g.db.fetchone()
    return in_progress

def can_start_games():
    g.db.execute('SELECT games_in_progress, trade_in_progress, negotiation_in_progress FROM game_attributes')
    games_in_progress, trade_in_progress, negotiation_in_progress = g.db.fetchone()

    if games_in_progress:
        return False

#    g.db.execute('SELECT 1 FROM trade')
#    if trade_in_progress or g.db.rowcount:
#        return False

    print games_in_progress, trade_in_progress, negotiation_in_progress

    g.db.execute('SELECT COUNT(*) FROM negotiation WHERE resigning = 0')
    n_negotiations, = g.db.fetchone()
    if negotiation_in_progress or n_negotiations > 0:
        return False

    print games_in_progress, trade_in_progress, negotiation_in_progress

    return True

def can_start_trade():
    return can_start_games()

def can_start_negotiation():
    g.db.execute('SELECT games_in_progress, trade_in_progress, negotiation_in_progress FROM game_attributes')
    games_in_progress, trade_in_progress, negotiation_in_progress = g.db.fetchone()

    if games_in_progress:
        return False

    g.db.execute('SELECT 1 FROM trade')
    if trade_in_progress or g.db.rowcount:
        return False

    # Allow multiple parallel negotiations (ignore negotiation_in_progress) only for resigning players
    g.db.execute('SELECT 1 FROM negotiation WHERE resigning = 0')
    if g.db.rowcount:
        return False

    return True
