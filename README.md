# Basketball GM 4.0.0


## Quidditch GM 0.0.1
apeterson-BFI fork.

An overhaul to write Quidditch-GM, a continuation of work from hpteam, but now with Quidditch positions, attributes, etc.

Very much in beginning stages.


## Normal Readme Starts

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

First, make sure you're using [Node.js](https://nodejs.org/) v6 or higher, older
versions probably won't work. Then, all of the tooling used in development can
be set up by simply installing [npm](https://www.npmjs.com/) and running

    npm install

from within this folder.

### Step 2 - Building

Basketball GM uses Browserify for JS minification and clean-css for
CSS minification. To build the app along with all its assets, run

    npm run build

However during development, you probably would rather do

    npm run start-watch

which will start the server and watch JS and CSS files for changes and
recompile. This simply runs both `npm start` and `npm run watch` together, which
alternatively can be run separately if you wish.

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

ESLint, Flow, and, stylelint are used to enforce some coding standards. To run
them on the entire codebase, run

    npm run lint

Integration and unit tests are bunched together in the `js/test` folder.
Coverage is not great. They can be run from the command line in Karma with

    npm test

or

    npm run test-watch

or manually within a web browser by running `npm run build-test` (or
`npm run watch-test`) and going to <http://localhost:3000/test> (this might be
broken currently).

### Code Overview

Basketball GM is a single-page app that runs almost entirely client-side by
storing data in IndexedDB. The core of the game runs inside a Shared Worker (or
a Web Worker in crappy browsers that don't support Shared Workers), and then
each open tab runs only UI code that talks to the worker. The UI code is in the
`src/js/ui` folder and the core game code is in the `src/js/worker` folder. They
communicate through the `toUI` and `toWorker` functions.

The UI is built with React and Bootstrap.

In the worker, data is ultimately stored in IndexedDB, but for performance and
cross-browser compatibility reasons, a cache (implemented in
`src/js/worker/db/Cache.js`) sits on top of the database containing all commonly
accessed data. The idea is that IndexedDB should only be accessed for uncommon
situations, like viewing stats from past seasons. For simulating games and
viewing current data, only the cache should be necessary.

The cache is overly complicated because (1) the values it returns are mutable,
so you better not mess with them accidentally, and (2) when you do purposely
mutate a value (like updating a player's stats), you need to remember to always
write it back to the cache manually by calling `idb.cache.*.put`.

Also in the worker, there is a global variable `self.bbgm` which gives you
access to many of the internal functions of Basketball GM from within your
browser.

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

### Cordova

The game runs equally well within a web browser and within Cordova (Android
4.4+). The codebase is designed to handle both situations (the main difference
is absolute vs relative paths, governed by window.inCordova in index.html).

Warning: This hasn't been tested in a while and is probably broken by now.

### Thank you BrowserStack

Shout out to [BrowserStack](https://www.browserstack.com/) for helping with
cross-browser testing.
