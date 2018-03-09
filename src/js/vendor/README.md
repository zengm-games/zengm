These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

html2canvas.js has a change on lines 2818-2819 to fix background color always
being set to transparent.

IndexedDB-getAll-shim was altered to override the native getAll always.
Originally this was to work around a Safari bug that was hard crashing, but the
current version of IndexedDB-getAll-shim detects that and handles it. However
after upgrading IndexedDB-getAll-shim, another problem appeared: "Maximum IPC
message size exceeded" errors in Chrome on getAll calls that return too much
data: idb.getCopies.players(), idb.getCopies.players({ activeAndRetired: true
}), idb.getCopies.players({ retired: true }), league.exportLeague, and possibly
others as well. The eventual solution to this would be to stream in results,
either using objectStore.iterate from Backboard. Might be a good idea to wrap
that into something like getAllFiltered that would accept a boolean-returning
callback like Array.filter. Doesn't have to be part of Backboard, could be an
internal function.

Manually modified for CommonJS:
html2canvas.js