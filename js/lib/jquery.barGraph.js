// Written for Basketball GM, but could be used elsewhere easily.
// Dependences, jQuery and bootstrap-tooltips
(function ($) {
    "use strict";

    // Default scale for bar chart. This finds the max and min values in the data, adds 10% in each direction so you don't end up with tiny slivers, and then expands the upper/lower lims to 0 if 0 wasn't already in the range.
    function defaultYlim(data, stacked) {
        var i, j, min, max, x;

        min = Infinity;
        max = -Infinity;

        // If stacked, add up all the components
        x = [];
        if (stacked) {
            for (i = 0; i < data[0].length; i++) {
                x[i] = 0;
                for (j = 0; j < data.length; j++) {
                    x[i] += data[j][i];
                }
            }
        } else {
            x = data;
        }

        for (i = 0; i < x.length; i++) {
            if (x[i] < min) {
                min = x[i];
            }
            if (x[i] > max) {
                max = x[i];
            }
        }

        // Add on some padding
        min = min - 0.1 * (max - min);
        max = max + 0.1 * (max - min);

        // Make sure 0 is in range
        if (min > 0) {
            min = 0;
        }
        if (max < 0) {
            max = 0;
        }

        return [min, max];
    }

    function setWidths(container, data, gap) {
        var numBars;

        numBars = container.data("numBars");
        container
            .children()
            .each(function () {
                var bar, num, width;

                bar = $(this);
                num = bar.data("num");  // Index of the bar (0 for first, 1 for next, etc.). All bars have a value here.
                if (num >= 0) {
                    width = (container.width() + gap) / numBars; // Width factoring in N-1 gaps

                    bar.css({
                        left: num * width,
                        width: width - gap
                    });
                }
            });
    }

    function scale(val, ylim) {
        if (val > ylim[1]) {
            return 100;
        }
        if (val < ylim[0]) {
            return 0;
        }
        return (val - ylim[0]) / (ylim[1] - ylim[0]) * 100;
    }

    $.barGraph = function (container, data, ylim, labels, labelFn) {
        var bottom, cssClass, height, i, j, gap, offsets, scaled, stacked;

        labelFn = labelFn !== undefined ? labelFn : function (val) { return val; };

        gap = 2;  // Gap between bars, in pixels

        // Stacked plot or not?
        if (data[0].hasOwnProperty("length")) {
            stacked = true;
        } else {
            stacked = false;
        }

        // ylim specified or not?
        if (ylim === undefined) {
            ylim = defaultYlim(data, stacked);
        }

        container.data("numBars", stacked ? data[0].length : data.length)
            .css({
                position: "relative"
            });

        // Convert heights to percentages
        scaled = [];
        for (i = 0; i < data.length; i++) {
            if (!stacked) {
                scaled[i] = scale(data[i], ylim);
            } else {
                scaled[i] = [];
                for (j = 0; j < data[i].length; j++) {
                    scaled[i][j] = scale(data[i][j], ylim);
                }
            }
        }

        // Draw bars
        if (!stacked) {
            for (i = 0; i < data.length; i++) {
                if (data[i] !== null && data[i] !== undefined) {
                    // Fix for negative values
                    if (data[i] >= 0) {
                        bottom = scale(0, ylim);
                        height = scaled[i];
                        cssClass = "bar-graph-1";
                    } else {
                        bottom = scaled[i];
                        height = scale(0, ylim) - scaled[i];
                        cssClass = "bar-graph-3";
                    }
                    $("<div></div>", {"class": cssClass})
                        .data("num", i)
                        .css({
                            position: "absolute",
                            bottom: bottom + "%",
                            height: height + "%"
                        })
                        .tooltip({
                            title: labels[i] + ": " + labelFn(data[i])
                        })
                        .appendTo(container);
                }
            }
        } else {
            offsets = [];
            for (j = 0; j < data.length; j++) {
                for (i = 0; i < data[j].length; i++) {
                    if (j === 0) {
                        offsets[i] = 0;
                    } else {
                        offsets[i] += scaled[j - 1][i];
                    }
                    if (data[j][i] !== null && data[j][i] !== undefined) {
                        $("<div></div>", {"class": "bar-graph-" + (j + 1)})
                            .data("num", i)
                            .css({
                                position: "absolute",
                                bottom: offsets[i] + "%",
                                height: scaled[j][i] + "%"
                            })
                            .tooltip({
                                title: labels[0][i] + " " + labels[1][j] + ": " + labelFn(data[j][i])
                            })
                            .appendTo(container);
                    }
                }
            }
        }

        // Calculate widths and have them update whenever the container changes size
        setWidths(container, data, gap);
        $(window).resize(function () { setWidths(container, data, gap); });
    };
}($));