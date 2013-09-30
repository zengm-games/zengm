These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

jQuery UI is a custom download including only "sortable" support as the rest
isn't used.

Upgrading jquery.dataTables to 1.9.4 produces errors in the minified version.
Not sure why.

jquery.dataTables.bootstrap.js (and DT_bootstrap.css) has been tweaked to play
nice with Davis.js and Bootstrap 3.

I'm using bootstrap-dropdown.js 2.0.2 because 2.1.0+ interferes with Davis.js
handling normal links in the play menu. See
https://github.com/olivernn/davis.js/issues/61

raphael.js has this very minor patch applied to make it play nice with
Require.js: https://github.com/robcolburn/raphael/commit/e81cbaa03898f4da6e705e7a9f6947cccb8e27e7
I also deleted the VML module to save space, since that is only for ancient
browsers which aren't supported anyway.

knockout.mapping.js is changed to depend on lib/knockout, not knockout.

html5-dataset.js is only needed for IE10, which is the only browser to support
IndexedDB but not dataset.

davis.js includes this patch https://github.com/olivernn/davis.js/pull/74 to
make it work in IE10. Also, lines 267-270 are similarly added for IE10:
      // This is a workaround for http://stackoverflow.com/q/17641380/786644
      if (elem.host.length === 0) {
        return false;
      }