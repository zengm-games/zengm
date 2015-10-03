These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

jQuery UI is a custom download including only "sortable" support as the rest
isn't used.

I commented out the RequireJS stuff in jquery.dataTables.js because it is even
more annoying to use that way than to just shim it. I also hacked
jquery.dataTables.js to do some custom stuff when it's wrapped in a
.table-responsive div (search for BBGM). I also applied this commit to fix
errors: https://github.com/DataTables/DataTablesSrc/commit/485b259e5c

jquery.dataTables.bootstrap.js (and DT_bootstrap.css) has been tweaked to play
nice with Davis.js and Bootstrap 3.

bootstrap-dropdown.js needs a patch to work with davis.js. See
https://github.com/olivernn/davis.js/issues/61#issuecomment-52713458

davis.js includes this patch https://github.com/olivernn/davis.js/pull/74 to
make it work in IE10. Also, lines 267-270 are similarly added for IE10:
      // This is a workaround for http://stackoverflow.com/q/17641380/786644
      if (elem.host.length === 0) {
        return false;
      }

jquery.tabSlideOut.js is currently not used.

bluebird.js is mostly needed because I'm not comfortable with Chrome's native
promise support, e.g. https://code.google.com/p/v8/issues/detail?id=3093 and
http://stackoverflow.com/q/26667598/786644. And also because of the IndexedDB-
promises weirdness
https://lists.w3.org/Archives/Public/public-webapps/2015AprJun/0126.html

html2canvas.js has a change on lines 2818-2819 to fix background color always
being set to transparent.

Manually modified for CommonJS:
davis.js
davis.google_analytics.js
faces.js