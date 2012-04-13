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
    g.db.execute('UPDATE %s_game_attributes SET games_in_progress = %s', (g.league_id, status))

def set_trade_in_progress(status):
    g.db.execute('UPDATE %s_game_attributes SET trade_in_progress = %s', (g.league_id, status))

def set_negotiation_in_progress(status):
    g.db.execute('UPDATE %s_game_attributes SET negotiation_in_progress = %s', (g.league_id, status))

def can_start_games():
    g.db.execute('SELECT games_in_progress, trade_in_progress, negotiation_in_progress FROM %s_game_attributes', (g.league_id,))
    row = g.db.fetchone()

    if any(row):
        return False

    g.db.execute('SELECT 1 FROM %s_trade', (g.league_id,))
    if g.db.rowcount:
        return False

    g.db.execute('SELECT 1 FROM %s_negotiation', (g.league_id,))
    if g.db.rowcount:
        return False

    return True

def can_start_trade():
    return can_start_games()

def can_start_negotiation():
    return can_start_games()
