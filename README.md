# Basketball GM 3.4.0

A single-player basketball simulation game. Make trades, set rosters, draft
players, and try to build the next dynasty, all from within your web browser.
The game is implemented entirely in client-side JavaScript, backed by IndexedDB.

Copyright (C) Jeremy Scheff. All rights reserved.

* Email: commissioner@basketball-gm.com

* Website: <http://basketball-gm.com/>

* Discussion: <http://www.reddit.com/r/BasketballGM/>

**Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**



## Installing and Running

If you just want to play the game, go to <http://basketball-gm.com/>.
Instructions below are for developers who want to run a copy locally so they can
test changes to the code.

To run the game locally, you need some way of running a web server to display
the content. There are currently three ways to do it. It doesn't matter which
you use as long as you can get it to run on your computer.

#### 1. Mongoose - Easiest on Windows

Run the included `mongoose-tiny-4.1.exe`. Point your browser to
<http://localhost:8080/>.

That's it.

If that doesn't work, try right clicking on the Mongoose icon in your
notification area and poke around in there. You can also see if there is a newer
version of Mongoose available http://cesanta.com/downloads.html

#### 2. web.py - Easiest on Linux

Install Python and web.py (as simple as `sudo apt-get install python-webpy` on
Ubuntu). Then, from the command line, run:

    python runserver.py

Point your browser to <http://localhost:8080/>. If that URL doesn't work, try
<http://0.0.0.0:8080/>.

#### 3. Apache

If you can't get one of the above methods to work, the mod_rewrite rules in
`.htaccess` can be used to make Apache run Basketball GM. Everything should work
if you just have a domain/subdomain point at this folder with mod_rewrite
enabled.



## Development Quick Start

**Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

In production, JavaScript and CSS files are minified. See below for more info.
But if you just want to play around with the code a bit, you don't have to worry
about that. You can bypass minification by going to Tools > Enable Debug Mode
within the game. Then, edit any file in the `css`, `js`, or `templates` folders
and reload the game to see your changes.

If you want to contribute but get stuck somewhere, please contact me! I'm happy
to help.



## Important Development Info

### License and Copyright Assignment

**Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

If you want to contribute code to Basketball GM, you must assign copyright to
me, Jeremy Scheff. To do this, send an email to commissioner@basketball-gm.com
with the subject line, "Copyright assignment by YOUR_NAME_HERE
(GITHUB_USERNAME_HERE)", containing the following statement:

"I, YOUR_NAME_HERE (GitHub username GITHUB_USERNAME_HERE), hereby irrevocably
assign copyright from my contributions to the Basketball GM project to Jeremy
Scheff, under the same licensing terms as the rest of the code. I certify that I
have the right to make such assignment."

### Tooling

All of the tooling used in development can be installed by simply installing
[npm](https://www.npmjs.com/) and running

    npm install

from within this folder.

Basketball GM uses the RequireJS optimizer for JS minification and clean-css for
CSS minification. To minify everything, run

    npm run build

But as mentioned above, if you enable Debug Mode, you don't need to do this
during development.

ESLint is used to enforce some coding standards. It's mostly pretty standard
Crockfordian stuff. To run ESLint on the entire codebase, run

    npm run lint

Integration and unit tests are bunched together in the `js/test` folder.
Coverage is not great. They can be run manually within a web browser by going to
<http://localhost:8080/test> or from the command line in Karma with

    npm run test

### Code Overview

Basketball GM is a single-page app that runs almost entirely client-side by
storing data in IndexedDB. All the application code is in the `js` folder.
Modules are defined with RequireJS. Routes are set in `js/app.js`. Most of the
important stuff is in `js/core`.

UI is ultimately driven by `js/utils/bbgmView.js`, a small UI layer I wrote on
top of Knockout which is used by all the views in the `js/views` folder. Each
view also has a corresponding HTML file in the `templates` folder. Adding a new
page is kind of a bitch. You need to explicitly include the template file in
`js/templates.js`, and explicitly include the view in `js/views.js`. Beyond
that, my best guidance is to copy from an existing page and use that as a
starting point.

For database access, I wrote a very thin Promises-based wrapper around IndexedDB
which can be found in `js/dao.js`. Understanding how IndexedDB works is critical
in any non-trivial work on Basketball GM.

### Documentation

Code should ideally be documented as described in the Google Closure Compiler
documentation:
<https://developers.google.com/closure/compiler/docs/js-for-compiler>.
Google Closure Compiler itself isn't actually used for anything (yet).

### Git Workflow

If you want to contribute changes back to the project, first create a fork on
GitHub. Then make your changes in a new branch. Confirm that the tests
(hopefully including new ones you wrote!) and ESLint all pass. Finally, send me
a pull request.

It's also probably a good idea to create an [issue on
GitHub](https://github.com/dumbmatter/basketball-gm/issues) before you start
working on something to keep me in the loop.



## Even More Development Info

### Bootstrap

Basketball GM's layout is currently based on Bootstrap 3.1.1 with the following
options:

* @font-size-base set to 13px

### Basketball stuff

Abbreviations of stats should be done like basketball-reference.com stat pages.
For instance, "defensive rebounds" is "drb".

### To do on new version

- Make sure tests all pass (if necessary)

- Write database upgrade code in db.js (if not already done piecemeal)

- Write key changes in js/data/changes.js

- Set version in index.html, CHANGES.md, and README.md, like <http://semver.org/>

- Tag it in git like:

        git tag -a v3.0.0-beta.2 -m ''
        git push --tags

### Cordova

The game runs equally well within a web browser and within Cordova (Android
4.4+). The codebase is designed to handle both situations (the main difference
is absolute vs relative paths, governed by window.inCordova in index.html). To
collect the files needed for Cordova, run `npm run build-cordova` and look in
the cordova folder.
