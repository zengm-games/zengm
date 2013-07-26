# Basketball GM 3.1.1

A single-player basketball simulation game. Make trades, set rosters, draft
players, and try to build the next dynasty, all from within your web browser.
The game is implemented entirely in client-side JavaScript, backed by
IndexedDB.

* Website: http://www.basketball-gm.com/

* Development website: https://github.com/jdscheff/basketball-gm

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

## Installing and Running

The easiest way to play is by going to http://play.basketball-gm.com/

Basketball GM requires a web browser with IndexedDB support. Mozilla Firefox
(any recent version) works best and is most thoroughly tested. Google Chrome
(version 23 or higher) works, but it's not as well tested as Firefox. Internet
Explorer 10 seems to work, but it's not regularly tested.
(TLDR: Use Firefox or maybe Chrome)

If you want to run your own copy...

In addition to a supported browser, you need some way of running a web server to
display the content. The easiest way is using the `runserver.py` file included
here. First, install Python and web.py (as simple as `sudo apt-get install
python-webpy` on Ubuntu). Then, from the command line, run:

    python runserver.py

Finally, point your browser to http://0.0.0.0:8080/

If that URL doesn't work, try http://127.0.0.1:8080/

Alternatively, the mod_rewrite rules in .htaccess can be used to make Apache
run Basketball GM. Everything should work if you just have a domain/subdomain
point at this folder with mod_rewrite enabled.

## Debugging and Problem Solving

If something starts behaving weirdly (this is beta software), you can reset you
database by clicking the "Reset DB" link in the debug menu at the top. If that
still doesn't work (which unfortunately happens sometimes with a corrupted
database), you might have to just delete everything and start fresh. In Firefox,
go to the `indexedDB` folder in your Firefox profile folder and delete the
folder corresponding to your copy of Basketball GM (such as
`http+++0.0.0.0+8080` if you're running it locally through web.py, or
`http+++play.basketball-gm.com` if you're playing on the official website). That
will delete all of the game's stored data.

To run the test suite, go to http://0.0.0.0:8080/test