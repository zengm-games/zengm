#!/usr/bin/env python
# python -tt test.py

import gamesim

print 'HI'

game = gamesim.Game()
game.play(0,1)
print game.team[0].region, game.team[0].name, game.team[0].stat['points']
print game.team[0].player[2].id, game.team[0].player[2].rating['name']
print game.team[0].player[2].composite_rating['pace']
print game.team[0].player[2].stat['minutes']
print game.team[0].stat['minutes']
print game.team[0].player[2].stat['minutes']
print game.team[0].stat['minutes']
game.box_score()
