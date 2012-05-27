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

This is an incomplete port of Basketball GM from PyGObject (GTK+) to web-based
technologies. Ultimately, this may or may not be a good idea. Due to all the
missing features still, I haven't put a lot of time into making it easy to use.
It's basically only of interest to developers now, but hopefully that will
change soon.

## Dependencies

### Required

#### Non-Python packages

* mysql-server
* redis-server
* nodejs
* juggernaut

You can install these packages on Ubuntu 12.04 with these commands (this will
also install python-pip and npm to make installing the other dependencies
easier, as well as python-dev and libmysqlclient-dev which are required for
the MySQLdb Python package):

    sudo apt-get install mysql-server redis-server nodejs npm python-pip python-dev libmysqlclient-dev
    sudo npm install -g juggernaut

#### Python packages

There are also various Python-based dependencies listed in requirements.txt.
You can install them all with this command:

    pip install -r requirements.txt

### Optional packages

* python-numpy

This speeds up some things a bit, but now that game simulation is done in
JavaScript it doesn't really matter much.

## Installing

Create a new MySQL database called bbgm. To do this, from the command line run
something like:

    mysql -u root -p
    CREATE DATABASE bbgm;
    GRANT ALL ON bbgm.* TO testuser@localhost IDENTIFIED BY 'test623';

Make sure your database settings in bbgm/__init__.py match the user and
database you just created. Then, to create the database tables, run the
following command (WARNING: make sure you use a new database, as this will
delete everything else in the database):

    python manage.py init_db

## Running

On the command line, run these four commands (note: some services may already be
running, such as redis_server if you install the normal Ubuntu package):

    redis_server
    juggernaut
    python manage.py runserver

Point your browser to http://127.0.0.1:5000/
