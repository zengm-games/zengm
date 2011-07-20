Basketball GM 1.0.0alpha
========================

A basketball simulation game. Make trades, set rosters, draft players, and try
to build the next dynasty. Built with PyGTK and SQLite.

* Website: https://github.com/jdscheff/basketball-gm

* Main developer: Jeremy Scheff <jdscheff@gmail.com>


Plea for help
-------------

Do you like this game? Or, do you at least like the idea of what this game
could one day be? Then PLEASE HELP US! See the HACKING file for more info.


License
-------

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3 as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.


Dependencies
------------

Required:

* PyGTK
* SQLite

Optional packages (speeds up gameplay by about 10%):

* Numpy

To install all these packages in Ubuntu 11.04, run:

    sudo apt-get install python-gtk2 libsqlite3-0 python-numpy

To install all these packages in Fedora 15, run as root:

    yum install pygtk2 sqlite numpy

I haven't tried any other platforms, but if you install the packages listed
above on Windows, maybe it would work.


Running and/or installing
-------------------------

To run the game from this directory:

    ./bin/basketball-gm

Or, to install the game system-wide and then run it:

    sudo python setup.py install

    basketball-gm

The system-wide install through setup.py should also make a launcher for "Basketball GM".
