# Plea for help

Do you like this game? Or, do you at least like the idea of what this game
could one day be? Then PLEASE HELP US! We need people with all kinds of skill
sets to work on (and this is not an exhaustive list):

* Artwork
* UI design and implementation
* Database optimization
* Game simulation
* Opposing manager AI
* Localization
* New gameplay features

So please, get the code on GitHub <https://github.com/jdscheff/basketball-gm>
and start hacking. Or email me <jdscheff@gmail.com> and we can discuss how you
want to contribute.


# RequireJS Optimizer

Basketball GM uses the RequireJS optimizer to combine JavaScript files into one
minified file. Installation instructions can be found here
http://requirejs.org/docs/optimization.html#download (you should install through
npm). Then, just run:

	make build-requirejs

(Running  just `make` will run the RequireJS optimizer, compile templates and
minify CSS.)

Alternatively, to use the unminified uncombined JavaScript files, just change

	<script src="/gen/app.js"></script>

to

	<script data-main="/js/app.js" src="/js/lib/require.js"></script>

in index.html. This is convenient for development.


# Handlebars templates

Any change made to one of the templates will not be processed until it is
compiled, as described here <http://handlebarsjs.com/precompilation.html>.
After installing the Handlebars precompiler, run this command from this
folder to update the templates:

    make build-templates

(Running  just `make` will run the RequireJS optimizer, compile templates and
minify CSS.)


# CSS

By default, a minified CSS file is used. This is done using YUI Compressor
(which is available in Ubuntu via `sudo apt-get install yui-compressor` - for
other OSes, Google for install instructions). To update the minified CSS file,
run:

    make build-css

(Running  just `make` will run the RequireJS optimizer, compile templates and
minify CSS.)

Alternatively, you can use the unminified CSS files by switching a couple
comments in index.html.


# Documentation

Code is documented as described in the Google Closure Compiler documentation:
<https://developers.google.com/closure/compiler/docs/js-for-compiler>. Google
Closure Compiler itself isn't actually used for anything (yet). To update the
HTML-based documentation in the docs folder, install JsDoc Toolkit 2 (available
in the Ubuntu repos as `jsdoc-toolkit`) and then run `make docs`, which will
generate documentation and stick it in the docs folder.


# JavaScript coding style

Douglas Crockford is always right. Well, usually. See `make lint` for details.

Documentation of functions is based on
https://developers.google.com/closure/compiler/docs/js-for-compiler


# Views

There is currently a rewrite of the views in progress to use Knockout for more
granular realtime updates. All the views in the js/views folder are rewritten
(or in progress) and the views in js/views.js are out of date and pending
rewrites. Things are still in flux, but the general way I see this now is that
each view should have a certain structure:

* `get` and `post` directly take input, process/validate it, and pass it on to
  `update`. That's it, no fancy logic here. This is the entry point to the view.
  Clicking a link leads here. When data is updated, `ui.realtimeUpdate` is
  called which will end up calling `get` again for the currently-loaded view. So
  ultimately, the same entry point is used for generating a view from scratch
  and updating it. Discrimination between these two scenarios is described
  below. `get` then calls `update`.

* `update` decides what to do based on the input. First, a dummy view model
  (stored in `vm`) is generated with mostly blank entries if `vm` does not
  already exist. In a simple view that responds to all changes in the same way
  (e.g. `roster`), `update` can contain the code to check if it's even worth
  hitting the database and whatnot (if we're viewing the same roster and nothing
  has changed, none of the displayed data has changed). In a more complex view
  with different components responding to different things (e.g. `gameLog`),
  this logic can be left for the below functions. `update` then calls
  `loadBefore`.

* `loadBefore` loads most/all data and builds most/all of `vm`. The only things
  that are not loaded here are things that can be really slow, like the list of
  games in `gameLog`. `vm` should usually be updated once, at the very end of
  this function, to limit flickering and inconsistent data display. Then
  `display` is called.

* `display` displays the view template and binds `vm` to it (if it's not already
  displayed and bound). Any DOM manipulation that needs to be done on the
  already-displayed content can be done here. Then `loadAfter` is (optionally)
  called.

* `loadAfter` is used to do any further work to load the view after it's already
  displayed. This should be rarely used unless there is some content that takes
  a really long time to generate. Since unlike `loadBefore` the template is
  always loaded here, `vm` updates and DOM manipulation can be more piecemeal
  here.


# Twitter Bootstrap

Basketball GM currently uses Bootstrap 2.2 compiled without responsive parts and
with a few changes to make it work more like 2.0:

* @baseFontSize set to 13px in variables.less
* @baseLineHeight set to 18px in variables.less

There are more changes in bbgm.css, but the baseFontSize and baseLineHeight
stuff is too much of a bitch to do that way, because they are used in so many
places.


# Basketball stuff

Abbreviations of stats should be done like basketball-reference.com stat pages.
For instance, "defensive rebounds" is "drb".


# To do on new version

- Make sure unit tests all pass
- Set version in index.html and README.md, like http://semver.org/
- Tag it in git:

    git tag -a v3.0.0-beta.2 -m ''
    git push --tags