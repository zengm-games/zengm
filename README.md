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
technologies. Ultimately, this may or may not be a good idea. Due to all the
missing features still, I haven't put a lot of time into making it easy to use.
It's basically only of interest to developers now, but hopefully that will
change soon.

## Installing and Running

Basketball GM will currently ONLY work in Mozilla Firefox (any recent version)
or Google Chrome (version 23 or higher) due to their support for IndexedDB. I
recommend you use Firefox, though, because the game currently runs much slower
in Chrome and it seems more glitchy in Chrome.

In addition to a supported browser, you need some way of running a web server to
display the content. The easiest way is using the `runserver.py` file included
here. If you install Python and web.py (as simple as `sudo apt-get install
python-webpy` on Ubuntu), then you can run:

    python runserver.py

Then, point your browser to http://0.0.0.0:8080/

## Debugging and Problem Solving

If something starts behaving weirdly (this is alpha software), you can reset you
database by clicking the "Reset DB" link at the bottom of any page. If that
still doesn't work (which unfortunately happens sometimes with a corrupted
database), delete the folder named `http+++0.0.0.0+8080` within the `indexedDB`
folder in your Firefox profile folder. That will delete all of the game's stored
data.

To run the test suite, go to http://0.0.0.0:8080/test