These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

html2canvas.js has a change on lines 2818-2819 to fix background color always
being set to transparent.

lie.js has one change, on line 2 - immediate is replaced by an immediately
executing function, thus making promise resolution synchronous, which is
horrible but necessary for keeping IndexedDB transactions alive in Firefox.

Manually modified for CommonJS:
html2canvas.js