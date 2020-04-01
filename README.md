# Basketball GM and Football GM

Single-player sports simulation games. Make trades, set rosters, draft players,
and try to build the next dynasty, all from within your web browser. The games
are implemented entirely in client-side JavaScript, backed by IndexedDB.

Copyright (C) Jeremy Scheff. All rights reserved.

* Email: commissioner@basketball-gm.com
* Website: <https://basketball-gm.com/> and <https://football-gm.com/>
* Development: <https://github.com/dumbmatter/gm-games>
* Discussion: <https://www.reddit.com/r/BasketballGM/> or
<https://www.reddit.com/r/Football_GM/> or <https://discord.gg/caPFuM9>

**This project is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

## Development Info

If you just want to play the game, go to <https://basketball-gm.com/> or
<https://football-gm.com/>. Instructions below are for developers who want to
run a copy locally so they can make changes to the code.

If you want to contribute but get stuck somewhere, please contact me! I'm happy
to help.

### License and Contributor License Agreement

**This project is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.**

If you want to contribute code to this project, you must sign a contributor
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
be set up by simply installing [Yarn 1](https://classic.yarnpkg.com/) and running

    yarn

from within this folder.

### Step 2 - Building

To build the app along with all its assets, run

    yarn run build

However during development, you probably would rather do

    yarn run start-watch

which will start the server and watch JS and CSS files for changes and
recompile. This simply runs both `yarn run start` and `yarn run watch` together,
which alternatively can be run separately if you wish.

By default this will build the basketball version of the game. For football, set
the SPORT environment variable to "football", like:

    SPORT=football yarn run start-watch

Open `package.json` to see all available development scripts.

### Step 3 - Running

To run the game locally, you need some way of running a web server to display
the content. There are currently two ways to do it. It doesn't matter which you
use as long as you can get it to run on your computer.

#### 1. Node.js (easiest)

Run

    yarn run start

and point your browser to <http://localhost:3000/>. If you use the command `yarn
run start-watch` from above, then running the command `yarn run start` is not
necessary.

#### 2. Apache

The mod_rewrite rules in `.htaccess` let the game run in Apache. Everything
should work if you point it at the `build` folder with mod_rewrite enabled.

### Step 4 - Testing

TypeScript and ESLint are used to enforce some coding standards. To run them on
the entire codebase, run

    yarn run lint

Integration and unit tests are bunched together in the `js/test` folder.
Coverage is not great. They can be run from the command line with

    yarn test

There is also a single end-to-end test which creates a league and simulates a
season. To execute the end-to-end test, run

    yarn run test-e2e

For the end-to-end test, by default it is basketball. If you want it to do
football, stick `SPORT=football ` in front.

### Code Overview

This is a single-page app that runs almost entirely client-side by storing data
in IndexedDB. The core of the game runs inside a Shared Worker (or a Web Worker
in crappy browsers that don't support Shared Workers), and then each open tab
runs only UI code that talks to the worker. The UI code is in the `src/js/ui`
folder and the core game code is in the `src/js/worker` folder. They communicate
through the `toUI` and `toWorker` functions.

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
access to many of the internal functions of the game from within your browser.

### Shared Worker Debugging

As mentioned above, the core of a game runs in a Shared Worker. This makes
debugging a little tricky. For instance, in Chrome, if you `console.log`
something inside the Shared Worker, you won't see it in the normal JS console.
Instead, you need to go to chrome://inspect/#workers and click "Inspect" under
<http://localhost/gen/worker.js>.

In any browser, if you have two tabs open and you reload one of them, the worker
process will not reload. So make sure you close all tabs except one before
reloading if you want to see changes in the worker.

And another note only for Chrome... if you have the worker console open and you
reload the page, [it will automatically set a debugger breakpoint at the
beginning of
worker.js](https://bugs.chromium.org/p/chromium/issues/detail?id=771018). So you
will have to click "resume" to continue loading it, every single time.

### Service Worker

This only applies if you use Apache, not if you use `yarn run start`!

A service worker is used for offline caching. This can make development tricky,
because if you load the game in your browser, make a change, wait for
build/watch to finish, and then reload... you will not see your change because
it will cache the original version and then not update it on a reload. This is
the normal behavior for service workers (they only switch to a new version when
you actually close the website and reopen it, not on a reload), but it makes
development annoying.

To work around that, in Chrome you can [use the "Update on reload" option][1]
and keep your devtools open. Then reloading will always get you the latest
version.

Even with that, ctrl+shift+r may be a good idea to make sure you're seeing your
latest changes.

[1]: https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#update_on_reload

### Git Workflow

If you want to contribute changes back to the project, first create a fork on
GitHub. Then make your changes in a new branch. Confirm that the tests
(hopefully including new ones you wrote!) and ESLint all pass. Finally, send me
a pull request.

It's also probably a good idea to create an [issue on
GitHub](https://github.com/dumbmatter/gm-games/issues) before you start working
on something to keep me in the loop.

## Less Important Development Info

### Sport-specific stuff

Abbreviations of stats should be done like basketball-reference.com and
football-reference.com stat pages. For instance, "defensive rebounds" is "drb".

### Thank you BrowserStack

Shout out to [BrowserStack](https://www.browserstack.com/) for helping with
cross-browser testing.
