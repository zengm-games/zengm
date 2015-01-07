This document contains some information that might be useful if you're
interested in contributing to the development of Basketball GM.



# License and Copyright Assignment

Basketball GM is NOT open source, but it is also not completely closed. Please
see LICENSE.md for details.

If you want to contribute code to Basketball GM, you must assign copyright to
me, Jeremy Scheff. To do this, send an email to commissioner@basketball-gm.com
with the subject line, "Copyright assignment by YOUR_NAME_HERE
(GITHUB_USERNAME_HERE)", containing the following statement:

"I, YOUR_NAME_HERE (GitHub username GITHUB_USERNAME_HERE), hereby irrevocably
assign copyright from my contributions to the Basketball GM project to Jeremy
Scheff, under the same licensing terms as the rest of the code. I certify that I
have the right to make such assignment."



# RequireJS Optimizer

Basketball GM uses the RequireJS optimizer to combine JavaScript files and
templates into one minified file. Installation instructions can be found here
http://requirejs.org/docs/optimization.html#download (you should install through
npm). Then, just run:

      make build-requirejs

(Running  just `make` will run the RequireJS optimizer and minify CSS.)

Alternatively, to use the unminified uncombined JavaScript files, go to Tools >
Enable Debug Mode. This is quite useful during development, since it avoids the
need for any compile step.



# Templates

Templates use Knockout for realtime updates.

As noted above, templates are compiled by the RequireJS Optimizer. If you want
to add a new template, you have to add a reference to it in js/templates.js.



# CSS

By default, a minified CSS file is used. This is done using YUI Compressor
(which is available in Ubuntu via `sudo apt-get install yui-compressor` - for
other OSes, Google for install instructions). To update the minified CSS file,
run:

    make build-css

(Running  just `make` will run the RequireJS optimizer and minify CSS.)

Alternatively, you can use the unminified CSS files by going to Tools > Enable
Debug Mode, which removes the need for any compile step during development.



# Adding a new page

...is kind of a bitch. You need to explicitly include the template file in
js/templates.js, and explicitly include the view in js/views.js. Beyond that,
my best guidance is to copy from an existing page and use that as a starting
point.



# Documentation

Code is documented as described in the Google Closure Compiler documentation:
<https://developers.google.com/closure/compiler/docs/js-for-compiler>. Google
Closure Compiler itself isn't actually used for anything (yet).



# JavaScript coding style

Run ESLint with `npm lint`

Documentation of functions is based on
https://developers.google.com/closure/compiler/docs/js-for-compiler



# Twitter Bootstrap

Basketball GM currently uses Bootstrap 3.1.1 with the following options:

* @font-size-base set to 13px



# Basketball stuff

Abbreviations of stats should be done like basketball-reference.com stat pages.
For instance, "defensive rebounds" is "drb".



# To do on new version

- Make sure unit tests all pass
- (if necessary) Write database upgrade code in db.js
- (if not already done piecemeal) Write key changes in js/data/changes.js
- Set version in index.html, CHANGES.md, and README.md, like http://semver.org/
- Tag it in git like:

    git tag -a v3.0.0-beta.2 -m ''
    git push --tags



# Cordova

The game runs equally well within a web browser and within Cordova (Android
4.4+). The codebase is designed to handle both situations (the main difference
is absolute vs relative paths, governed by window.inCordova in index.html). To
collect the files needed for Cordova, run `make cordova` and look in the cordova
folder.