from flask.ext import celery, script

import bbgm

# This creates default commands runserver and shell
manager = script.Manager(bbgm.app)

# This creates celeryd, celerybeat, celeryev, celeryctl, and camqadm commands
celery.install_commands(manager)

@manager.command
def init_db():
    bbgm.init_db()

if __name__ == "__main__":
    manager.run()
