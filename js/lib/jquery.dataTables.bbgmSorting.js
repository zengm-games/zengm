/*global jQuery */

(function ($) {
    /**
     * Based on http://www.datatables.net/examples/plug-ins/sorting_plugin.html
     *
     * Designed for a draft pick column in Basketball GM, like
     *     1-1
     *     1-2
     *     ...
     *     2-1
     *     2-2
     *     ...
     */
    $.fn.dataTableExt.aTypes.unshift(sData => {
        let bDash = false;
        let bDigitBeforeDash = false;
        let bDigitAfterDash = false;
        const sValidChars = "0123456789-";

        for (let i = 0; i < sData.length; i++) {
            const char = sData.charAt(i);
            if (sValidChars.indexOf(char) === -1) {
                return null;
            }

            // Need a digit after dash
            if (char !== "-" && !bDash) {
                bDigitBeforeDash = true;
            }

            /* Only allowed one dash place... */
            if (char === "-") {
                if (bDash) {
                    return null;
                }
                bDash = true;
            }

            // Need a digit after dash
            if (char !== "-" && bDash) {
                bDigitAfterDash = true;
            }
        }

        if (bDash && bDigitBeforeDash && bDigitAfterDash) {
            return "numeric-dash";
        }

        return null;
    });
    $.fn.dataTableExt.oSort["numeric-dash-asc"] = (a, b) => {
        const x = a.split("-");
        const y = b.split("-");

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
        if (x[1] < y[1]) {
            return -1;
        }
        return 0;
    };
    $.fn.dataTableExt.oSort["numeric-dash-desc"] = (a, b) => {
        const x = a.split("-");
        const y = b.split("-");

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
        if (x[1] < y[1]) {
            return 1;
        }
        return 0;
    };

    /**
     * Based on http://www.datatables.net/examples/plug-ins/sorting_plugin.html
     *
     * Designed for a monetary column in Basketball GM, like a contract
     *     $9.50M thru 2023
     *     $19.50M thru 2022
     *     ...
     * or just an amount of money
     *     -$15.2M
     *     $2.6M
     *     ...
     */
    $.fn.dataTableExt.aTypes.unshift(sData => {
        const iDollarSign = sData.indexOf("$");
        if (iDollarSign < 0) {
            return null;
        }

        let bSomething = false;
        let bM = false;
        const sValidChars = "0123456789-.M";

        for (let i = iDollarSign + 1; i < sData.length; i++) {
            const char = sData.charAt(i);
            if (sValidChars.indexOf(char) === -1) {
                return null;
            }
            bSomething = true;  // Didn't return, so something is there

            if (char === "M") {
                bM = true;
                break;
            }
        }

        if (bSomething && bM) {
            return "money";
        }

        return null;
    });
    $.fn.dataTableExt.oSort["money-asc"] = (a, b) => {
        let x = parseFloat(a.substring(a.indexOf("$") + 1, a.indexOf("M")));
        let y = parseFloat(b.substring(b.indexOf("$") + 1, b.indexOf("M")));

        // Fix for negative signs before the dollar sign
        if (a[a.indexOf("$") - 1] === "-") { x = -x; }
        if (b[b.indexOf("$") - 1] === "-") { y = -y; }

        if (x > y) {
            return 1;
        }
        if (x < y) {
            return -1;
        }
        return 0;
    };
    $.fn.dataTableExt.oSort["money-desc"] = (a, b) => {
        let x = parseFloat(a.substring(a.indexOf("$") + 1, a.indexOf("M")));
        let y = parseFloat(b.substring(b.indexOf("$") + 1, b.indexOf("M")));

        // Fix for negative signs before the dollar sign
        if (a[a.indexOf("$") - 1] === "-") { x = -x; }
        if (b[b.indexOf("$") - 1] === "-") { y = -y; }

        if (x > y) {
            return -1;
        }
        if (x < y) {
            return 1;
        }
        return 0;
    };

    /**
     * Based on http://www.datatables.net/examples/plug-ins/sorting_plugin.html
     *
     * Designed to sort by last name in Basketball GM, like
     *     Bob Smith
     *     John Anderson
     *     ...
     * Other content (like "skills" span) is allowed to appear after the name
     */
    $.fn.dataTableExt.aTypes.unshift(sData => {
        // This is kind of messy... the first condition is to match anything that looks like a name. The second is to catch a series of Three Capitalized Words that occur inside an HTML tag, as in a list of team names ("New York Knights").
        if (sData.match(/[A-Z][a-z]+ [A-Z][A-Z|a-z]+/) && !sData.match(/>[A-Z][a-z]+ [A-Z][A-Z|a-z]+ [A-Z][a-z]+/)) {
            return "name";
        }

        return null;
    });
    $.fn.dataTableExt.oSort["name-asc"] = (a, b) => {
        const x = a.match(/[A-Z][a-z]+ [A-Z][A-Z|a-z]+/)[0].split(' ');
        const y = b.match(/[A-Z][a-z]+ [A-Z][A-Z|a-z]+/)[0].split(' ');

        if (x[1] > y[1]) {
            return 1;
        }
        if (x[1] < y[1]) {
            return -1;
        }
        if (x[0] > y[0]) {
            return 1;
        }
        if (x[0] < y[0]) {
            return -1;
        }
        return 0;
    };
    $.fn.dataTableExt.oSort["name-desc"] = (a, b) => {
        const x = a.match(/[A-Z][a-z]+ [A-Z][A-Z|a-z]+/)[0].split(' ');
        const y = b.match(/[A-Z][a-z]+ [A-Z][A-Z|a-z]+/)[0].split(' ');

        if (x[1] > y[1]) {
            return -1;
        }
        if (x[1] < y[1]) {
            return 1;
        }
        if (x[0] > y[0]) {
            return -1;
        }
        if (x[0] < y[0]) {
            return 1;
        }
        return 0;
    };
}(jQuery));
