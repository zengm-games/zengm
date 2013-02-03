# Basketball GM 3.0.0-alpha

A single-player basketball simulation game. Make trades, set rosters, draft
players, and try to build the next dynasty, all from within your web browser.
The game is implemented entirely in client-side JavaScript, backed by
IndexedDB.

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
technologies. Overall, things are working pretty well. You can play the game and
pretty much all the basic functionality works. There is still a fairly short
list of things in the TODO file that need to be done before it is even beta
quality, though.

## Installing and Running

Basketball GM requires a web browser with IndexedDB support. Mozilla Firefox
(any recent version) works best and is most thoroughly tested. Google Chrome
(version 23 or higher) seems to generally work, but it's not as well tested
as Firefox. Internet Explorer 10 should theoretically work, but I haven't
tried it. (TLDR: Use Firefox)

In addition to a supported browser, you need some way of running a web server to
display the content. The easiest way is using the `runserver.py` file included
here. First, install Python and web.py (as simple as `sudo apt-get install
python-webpy` on Ubuntu). Then, from the command line, run:

    python runserver.py

Finally, point your browser to http://0.0.0.0:8080/

If that URL doesn't work, try http://127.0.0.1:8080/

## Debugging and Problem Solving

If something starts behaving weirdly (this is alpha software), you can reset you
database by clicking the "Reset DB" link at the bottom of any page. If that
still doesn't work (which unfortunately happens sometimes with a corrupted
database), delete the folder named `http+++0.0.0.0+8080` within the `indexedDB`
folder in your Firefox profile folder. That will delete all of the game's stored
data.

To run the test suite, go to http://0.0.0.0:8080/test