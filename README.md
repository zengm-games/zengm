# Basketball GM, Football GM, ZenGM Baseball, and ZenGM Hockey

Single-player sports simulation games. Make trades, set rosters, draft players,
and try to build the next dynasty, all from within your web browser. The games
are implemented entirely in client-side JavaScript, backed by IndexedDB.

Copyright (C) ZenGM, LLC. All rights reserved.

Email: <jeremy@zengm.com>

Website: <https://zengm.com/>

Development: <https://github.com/zengm-games/zengm>

Discussion:

* [Discord](https://zengm.com/discord/)
* Reddit: [Basketball GM](https://www.reddit.com/r/BasketballGM/),
[Football GM](https://www.reddit.com/r/Football_GM/),
[ZenGM Baseball](https://www.reddit.com/r/ZenGMBaseball/),
[ZenGM Hockey](https://www.reddit.com/r/ZenGMHockey/)

## Who is this for?

If you just want to play a game, go to <https://zengm.com/>. Instructions below
are for developers who want to run a copy locally so they can make changes to
the code.

## License and contributor license agreement

**This project is NOT open source, but it is also not completely closed. Please
see [LICENSE.md](LICENSE.md) for details.**

If you want to contribute code to this project, you must sign a contributor
license agreement. There are separate forms for individuals and entities (such
as corporations):

* [Individual CLA](CLA-individual.md) (this is probably what you want)
* [Entity CLA](CLA-entity.md)

Make a copy of the form, fill in your information at the bottom, and send an
email to jeremy@zengm.com with the subject line, "Contributor License Agreement
from YOUR_NAME_HERE (GITHUB_USERNAME_HERE)".

## Setup 

First install [Node.js](https://nodejs.org/) 24 and [pnpm](https://pnpm.io/) 10.

Then install the dependencies:

    pnpm install

and start the dev server, which watches the source code for changes:

    node --run dev

The `dev` script will tell you a URL to open in your browser to view the game,
<http://localhost:3000> unless that port is already in use.

By default this builds the basketball version of the game. For other sports, set
the `SPORT` environment variable to `football`, `baseball`, or `hockey`, like:

    SPORT=football node --run dev

## Other dev info

### Tests

TypeScript and ESLint are used to enforce some coding standards. To run them on
the entire codebase, run:

    node --run lint

Integration and unit tests spread out through the codebase in *.test.ts files.
Coverage is not great. They can be run from the command line with:

    node --run test

There is also a single end-to-end test which creates a league and simulates a
season. To execute the end-to-end test, run:

    node --run test-e2e

Like the dev command, you can stick `SPORT=football ` or whatever in front of
this command to run it for a non-basketball sport.

### Git workflow

If you want to contribute changes back to the project, first create a fork on
GitHub. Then make your changes in a new branch. Confirm that the tests
(hopefully including new ones you wrote!) and lint scripts all pass. Finally,
send me a pull request.

It's also probably a good idea to [create an issue on
GitHub](https://github.com/zengm-games/zengm/issues) or [send me a
message](https://zengm.com/contact/) before you start working on something. I
don't want you to spend lots of time on something that I don't want to put in
the game!

### Code overview

This is a single-page app that runs almost entirely client-side by storing data
in IndexedDB. The core of the game runs inside a Shared Worker (or a Web Worker
in crappy browsers that don't support Shared Workers), and then each open tab
runs only UI code that talks to the worker. The UI code is in the `src/ui`
folder and the core game code is in the `src/worker` folder. They communicate
through the `toUI` and `toWorker` functions.

The UI is built with React and Bootstrap.

In the worker, data is ultimately stored in IndexedDB, but for performance and
cross-browser compatibility reasons, a cache (implemented in
`src/worker/db/Cache.ts`) sits on top of the database containing all commonly
accessed data. The idea is that IndexedDB should only be accessed for uncommon
situations, like viewing stats from past seasons. For simulating games and
viewing current data, only the cache should be necessary.

The cache is overly complicated because (1) the values it returns are mutable,
so you better not mess with them accidentally, and (2) when you do purposely
mutate a value (like updating a player's stats), you need to remember to always
write it back to the cache manually by calling `idb.cache.*.put`.

In both the worker and UI processes, there is a global variable `self.bbgm`
which gives you access to many of the internal functions of the game from
within your browser.

### Shared Worker debugging

As mentioned above, the core of a game runs in a Shared Worker. This makes
debugging a little tricky. For instance, in Chrome, if you `console.log`
something inside the Shared Worker, you won't see it in the normal JS console.
Instead, you need to go to chrome://inspect/#workers and click "Inspect" under
<http://localhost/gen/worker.js>.

In any browser, if you have two tabs open and you reload one of them, the worker
process will not reload. So make sure you close all tabs except one before
reloading if you want to see changes in the worker.

### Thank you BrowserStack

Shout out to [BrowserStack](https://www.browserstack.com/) for helping with
cross-browser testing.
