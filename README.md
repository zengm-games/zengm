# Basketball GM 3.6.0

A single-player basketball simulation game. Make trades, set rosters, draft
players, and try to build the next dynasty, all from within your web browser.
The game is implemented entirely in client-side JavaScript, backed by IndexedDB.

Copyright (C) Jeremy Scheff. All rights reserved.

* Email: commissioner@basketball-gm.com
* Website: <https://basketball-gm.com/>
* Development: <https://github.com/dumbmatter/basketball-gm>
* Discussion: <http://www.reddit.com/r/BasketballGM/>

**Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

## Development Info

If you just want to play the game, go to <http://basketball-gm.com/>.
Instructions below are for developers who want to run a copy locally so they can
make changes to the code.

If you want to contribute but get stuck somewhere, please contact me! I'm happy
to help.

### License and Contributor License Agreement

**Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

If you want to contribute code to Basketball GM, you must sign a contributor
license agreement. There are separate forms for individuals and entities (such
as corporations):

* [Individual CLA](CLA-individual.md) (this is probably what you want)
* [Entity CLA](CLA-entity.md)

Make a copy of the form, fill in your information at the bottom, and send an
email to commissioner@basketball-gm.com with the subject line, "Contributor
License Agreement from YOUR_NAME_HERE (GITHUB_USERNAME_HERE)".

### Step 1 - Installing

All of the tooling used in development can be retrieved by installing
[npm](https://www.npmjs.com/) and running

    npm install

from within this folder.

### Step 2 - Building

Basketball GM uses Browserify for JS minification and clean-css for
CSS minification. To build the app along with all its assets, run

    npm run build

However during development, you probably would rather do

    npm run start-watch

which will start the server and watch JS and CSS files for changes and
recompile. This simple runs both `npm start` and `npm run watch` together, which
can be run separately if you wish.

Open `package.json` to see all available scripts.

### Step 3 - Running

To run the game locally, you need some way of running a web server to display
the content. There are currently two ways to do it. It doesn't matter which
you use as long as you can get it to run on your computer.

#### 1. Node.js (easiest)

Run

    npm start

and point your browser to <http://localhost:3000/>. If you use the command
`npm run start-watch` from above, then running the command `npm start` is not
necessary.

#### 2. Apache

The mod_rewrite rules in `.htaccess` can be used to make Apache run Basketball
GM. Everything should work if you point it at the `build` folder with
mod_rewrite enabled. That's how it's done on play.basketball-gm.com.

### Step 4 - Testing

ESLint is used to enforce some coding standards. It's mostly pretty standard
Crockfordian stuff. To run ESLint on the entire codebase, run

    npm run lint-js

Integration and unit tests are bunched together in the `js/test` folder.
Coverage is not great. They can be run from the command line in Karma with

    npm test

or manually within a web browser by running `npm run build-test` (or
`npm run watch-test`) and going to <http://localhost:3000/test>.

### Code Overview

Basketball GM is a single-page app that runs almost entirely client-side by
storing data in IndexedDB. All the application code is in the `js` folder.
Routes are set in `js/app.js`. Most of the important stuff is in `js/core`.

UI is ultimately driven by `js/util/bbgmView.js`, a small UI layer I wrote on
top of Knockout which is used by all the views in the `js/views` folder. Each
view also has a corresponding HTML file in the `templates` folder. Adding a new
page is kind of a bitch. You need to explicitly include the template file in
`js/templates.js`, and explicitly include the view in `js/views.js`. Beyond
that, my best guidance is to copy from an existing page and use that as a
starting point.

For database access, I wrote a very thin Promises-based wrapper around IndexedDB
called [Backboard](https://github.com/dumbmatter/backboard). Understanding how
IndexedDB works is critical in any non-trivial work on Basketball GM.

Also, there is a global variable `window.bbgm` which gives you access to many of
the internal functions of Basketball GM from within your browser.

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

## Less Important Development Info

### Bootstrap

Basketball GM's layout is currently based on Bootstrap 3.1.1 with the following
options:

* @font-size-base set to 13px

### Basketball stuff

Abbreviations of stats should be done like basketball-reference.com stat pages.
For instance, "defensive rebounds" is "drb".

### To do on new version

- Make sure tests all pass (if necessary)
- Write database upgrade code in `db.js` (if not already done piecemeal)
- Write key changes in `js/data/changes.js`
- Set version in index.html, CHANGES.md, and README.md, like <http://semver.org/>
- Tag it in git like:

        git tag -a v3.0.0-beta.2 -m ''
        git push --tags

### Cordova

The game runs equally well within a web browser and within Cordova (Android
4.4+). The codebase is designed to handle both situations (the main difference
is absolute vs relative paths, governed by window.inCordova in index.html).

Warning: This hasn't been tested in a while and is probably broken by now.
