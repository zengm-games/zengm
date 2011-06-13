import sys

sys.path.append("..")

from config import Config
from player import Player

config = Config()

p = []

p.append(Player(config, 0, 25, 'Big', 60, 80))
p.append(Player(config, 0, 25, 'Wing', 60, 80))
