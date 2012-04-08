from flask.ext import celery, script

from bbgm import app

# This creates default commands runserver and shell
manager = script.Manager(app)

# This creates celeryd, celerybeat, celeryev, celeryctl, and camqadm commands
celery.install_commands(manager)

if __name__ == "__main__":
    manager.run()
