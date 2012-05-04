from flask.ext import script

import bbgm

# This creates default commands runserver and shell
manager = script.Manager(bbgm.app)

@manager.command
def init_db():
    bbgm.init_db()

if __name__ == "__main__":
    manager.run()
