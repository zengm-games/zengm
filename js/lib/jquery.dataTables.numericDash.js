/**
 * Based on http://www.datatables.net/examples/plug-ins/sorting_plugin.html
 *
 * Designed for a draft pick column like round-pick in Basketball GM
 */

jQuery.fn.dataTableExt.aTypes.unshift(
    function (sData) {
        "use strict";
        var bDash, bDigitAfterDash, bDigitBeforeDash, Char, i, sValidChars;

        bDash = false;
        sValidChars = "0123456789-";

        /* Check the numeric part */
        for (i = 0; i < sData.length; i++) {
            Char = sData.charAt(i);
            if (sValidChars.indexOf(Char) === -1) {
                return null;
            }

            // Need a digit after dash
            if (Char !== "-" && !bDash) {
                bDigitBeforeDash = true;
            }

            /* Only allowed one dash place... */
            if (Char === "-") {
                if (bDash) {
                    return null;
                }
                bDash = true;
            }

            // Need a digit after dash
            if (Char !== "-" && bDash) {
                bDigitAfterDash = true;
            }
        }

        if (bDash) {
            return 'numeric-dash';
        }

        return null;
    }
);

jQuery.fn.dataTableExt.oSort['numeric-dash-asc'] = function (a, b) {
    "use strict";
    var x, y;

    x = a.split("-");
    y = b.split("-");

    if (x.length !== 2 || y.length !== 2) {
        return 0;
    }

    x[0] = parseFloat(x[0]);
    x[1] = parseFloat(x[1]);
    y[0] = parseFloat(y[0]);
    y[1] = parseFloat(y[1]);

    if (x[0] > y[0]) {
        return -1;
    }
    if (x[0] < y[0]) {
        return 1;
    }
    if (x[1] > y[1]) {
        return -1;
    }
    return 1;
};

jQuery.fn.dataTableExt.oSort['numeric-dash-desc'] = function (a, b) {
    "use strict";
    var x, y;

    x = a.split("-");
    y = b.split("-");

    if (x.length !== 2 || y.length !== 2) {
        return 0;
    }

    x[0] = parseFloat(x[0]);
    x[1] = parseFloat(x[1]);
    y[0] = parseFloat(y[0]);
    y[1] = parseFloat(y[1]);

    if (x[0] > y[0]) {
        return 1;
    }
    if (x[0] < y[0]) {
        return -1;
    }
    if (x[1] > y[1]) {
        return 1;
    }
    return -1;
};