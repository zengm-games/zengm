import context

from copy import deepcopy
import json

from bbgm.core import game, game_sim

def box_score(teams):
    format = '%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s'
    for t in teams:
        print format % ('ID', 'Min', 'FG', '3Pt', 'FT', 'Off', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts')
        for p in t['player']:
            print format % (p['id'], round(p['stat']['minutes']), '%s-%s' % (p['stat']['field_goals_made'], p['stat']['field_goals_attempted']), '%s-%s' % (p['stat']['three_pointers_made'], p['stat']['three_pointers_attempted']), '%s-%s' % (p['stat']['free_throws_made'], p['stat']['free_throws_attempted']), p['stat']['offensive_rebounds'], p['stat']['offensive_rebounds'] + p['stat']['defensive_rebounds'], p['stat']['assists'], p['stat']['turnovers'], p['stat']['steals'], p['stat']['blocks'], p['stat']['personal_fouls'], p['stat']['points'])
        print format % ('Total', round(t['stat']['minutes']), '%s-%s' % (t['stat']['field_goals_made'], t['stat']['field_goals_attempted']), '%s-%s' % (t['stat']['three_pointers_made'], t['stat']['three_pointers_attempted']), '%s-%s' % (t['stat']['free_throws_made'], t['stat']['free_throws_attempted']), t['stat']['offensive_rebounds'], t['stat']['offensive_rebounds'] + t['stat']['defensive_rebounds'], t['stat']['assists'], t['stat']['turnovers'], t['stat']['steals'], t['stat']['blocks'], t['stat']['personal_fouls'], t['stat']['points'])
        print ''

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
    box_score(t.test_game(teams[0], teams[1]))
