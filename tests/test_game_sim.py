import context

from copy import deepcopy
import json

from bbgm.core import game_sim

class GameSimTestSuite():
    """Game simulation test cases."""

    def test_game(self, team1, team2):
        gs = game_sim.GameSim(team1, team2)
        return gs.run()

    def test_games(self):
        pass
#        for i in xrange(100):
#            self.test_game()

if __name__ == '__main__':
    f = open('teams.json')
    teams = json.load(f)
    f.close()

    t = GameSimTestSuite()
    print json.dumps(t.test_game(teams[0], teams[1]))
