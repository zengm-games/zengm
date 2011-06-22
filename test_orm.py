import os
from models import *
from sqlobject import *
import libplayer

sqlhub.processConnection = connectionForURI('sqlite:/:memory:')

Player.createTable()
PlayerStats.createTable()
Team.createTable()
TeamHistory.createTable()
TeamStats.createTable()
Conf.createTable()
Div.createTable()
State.createTable()

#c = Conf(id=666,name='Bob')
#d = Div(name='Bob', conf=c)

libplayer.new_game()
