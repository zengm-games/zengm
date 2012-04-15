# Basketball GM 2.0.0alpha

A single-player basketball simulation game. Make trades, set rosters, draft
players, and try to build the next dynasty, all from within your web browser.

* Website: https://github.com/jdscheff/basketball-gm

* Main developer: Jeremy Scheff <jdscheff@gmail.com>

## License

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3 as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.

## Warning

This is a (currently) very incomplete port of Basketball GM from PyGObject
(GTK+) to web-based technologies. Ultimately, this may or may not be a good
idea. Due to all the missing features still, I haven't put a lot of time into
making it easy to use. It's basically only of interest to developers now, but
hopefully that will change relatively soon.

## Dependencies

### Required

* mysql-server
* python-mysqldb
* redis-server
* node.js
* juggernaut
* python-juggernaut
* Flask
* Celery
* Flask-Celery
* Flask-Assets
* Closure Compiler
* YUI Compressor

For the first three, you can just use the normal Ubuntu (or whatever) packages
and it will probably work fine.

For node.js, install it however you want. This is what I used:
https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
The same Ubuntu PPA linked there also has npm packaged, which you can then use
to install Juggernaut:

    sudo npm install -g juggernaut

And to install the rest, run:

    sudo apt-get install python-pip
    sudo pip install juggernaut
    sudo pip install Flask
    sudo pip install Celery
    sudo pip install Flask-Celery
    sudo pip install Flask-Assets
    sudo pip install closure
    sudo pip install yuicompressor

### Optional packages

* python-numpy

This speeds up gameplay by about 10%, for now at least.

## Installing and running

Create a new MySQL database called bbgm. To do this, from the command line run
something like:

    mysql -u root -p
    CREATE DATABASE bbgm;
    GRANT ALL ON bbgm.* TO testuser@localhost IDENTIFIED BY 'test623';

Then these commands in the Python interpreter, from this folder:

    import bbgm
    bbgm.init_db()

On the command line, run these four commands (note: some services may already be
running, such as redis_server if you install the normal Ubuntu package):

    redis_server
    juggernaut
    python manage.py celeryd
    python manage.py runserver

Point your browser to http://127.0.0.1:5000/
