import math
import sqlite3

import common
import random

class Trade:
    """All parts of a trade, from adding players to proposing to processing.

    Currently, it only works for trading between the user's team and a CPU
    team.
    """
    offer = [{}, {}]

    def __init__(self, team_id):
        """Inits Trade with team ID.

        Args:
            team_id: Team the player is trading with.
        """
        self.team_id = team_id

    def clear_offer(self):
        """Clear the current offer, but leave the teams alone."""
        self.offer = [{}, {}]

    def new_team(self, team_id):
        """Switch to a new trading partner."""
        self.team_id = team_id
        self.offer[1] = {} # Empty player list

    def add_player(self):
        """Adds a player to the deal."""
        pass

    def check_salary_cap(self):
        """Check the salary cap implications of the proposed trade.


        """
        pass

    def _get_team_values(self):
        """Calculate the percieved values of the trade/no-trade scenarios.

        Returns:
            A list containing two numbers, from the perspective of the team the
            user is trying to trade with (the CPU team): the percieved value of
            the players being traded away from the CPU team, and the percieved
            values of the players being traded to the CPU team.
        """
        pass

    def propose_trade(self):
        """Propose the trade to the other team.

        Returns:
            A list containing two elements: 1. a boolean indicating if the
            trade was accepted (True) or not (False); 2. a string containing
            the response from the CPU team.
        """

    def process_trade(self):
        """Process the proposed trade.

        This is called after the trade is accepted, to assign players to their
        new teams.
        """
        pass

