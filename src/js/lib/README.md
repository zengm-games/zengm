These are various third-party libraries used in Basketball GM. They are all
standard, except for the following exceptions:

bootstrap-dropdown.js needs a patch to work with davis.js. See
https://github.com/olivernn/davis.js/issues/61#issuecomment-52713458

davis.js includes this patch https://github.com/olivernn/davis.js/pull/74 to
make it work in IE10. Also, lines 267-270 are similarly added for IE10:
      // This is a workaround for http://stackoverflow.com/q/17641380/786644
      if (elem.host.length === 0) {
        return false;
      }

jquery.tabSlideOut.js is currently not used.

html2canvas.js has a change on lines 2818-2819 to fix background color always
being set to transparent.

Manually modified for CommonJS:
davis.js
davis.google_analytics.js
html2canvas.js