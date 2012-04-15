from flask.ext import celery, script

from bbgm import app, init_db

# This creates default commands runserver and shell
manager = script.Manager(app)

manager.add_command('init_db', init_db())

# This creates celeryd, celerybeat, celeryev, celeryctl, and camqadm commands
celery.install_commands(manager)

if __name__ == "__main__":
    manager.run()
