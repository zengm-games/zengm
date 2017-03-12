These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

html2canvas.js has a change on lines 2818-2819 to fix background color always
being set to transparent.

lie.js is modified to be synchronous during IndexedDB transactions, which is
horrible but necessary for keeping IndexedDB transactions alive in Firefox. This
is done by looking for a Promise.idbTransaction flag, which I set in
checkPromiseImplementation in a very hacky way.

Manually modified for CommonJS:
html2canvas.js