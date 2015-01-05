/**
 * Bar plots, both stacked and normal.
 * Written by Jeremy Scheff
 *
 * Displays simple and elegant bar plots that are just series of rectangles with no visible text that completely fill up a container div. When hovering over a bar, a tooltip appears with a complete annotation.
 *
 *
 *
 * Usage:
 *
 * HTML: Create a div. Height and width should be specified in your CSS, either as percentages or fixed pixels.
 *
 *     <div id="my-plot">
 *
 * CSS: Set the size of your div and specify your colors. These colors were taken from Bootstrap. You only need as many colors as you have stacked components in your bar graphs (so, just .bar-graph-1 is used if you aren't stacking - the exception to this rule is that bar-graph-3 is used for negative values).
 *
 *     #my-plot { height: 80px; }
 *     .bar-graph-1 { background-color: #049cdb; }
 *     .bar-graph-2 { background-color: #f89406; }
 *     .bar-graph-3 { background-color: #9d261d; }
 *     .bar-graph-4 { background-color: #ffc40d; }
 *     .bar-graph-5 { background-color: #7a43b6; }
 *     .bar-graph-6 { background-color: #46a546; }
 *     .bar-graph-7 { background-color: #c3325f; }
 *
 * JavaScript: Include it in your page, of course. Then...
 *
 *     $.barGraph(container, data, ylim, labels, dataTooltipFn)
 *
 * @param {object} container jQuery for your container div.
 * @param {Array} data For a non-stacked bar graph, an array of data values which will be transformed to heights. For a stacked bar graph, an array of arrays, where each internal array is as described in the previous sentence. The first one will be the bottom in the stack, the last will be the top. For stacked bar graphs, all values must be positive. For non-stacked bar graphs, positive and negative values are allowed
 * @param {Array.<number>=} ylim An array of two numbers, the minimum and maximum values for the scale. If undefined, then this will be set to the minimum and maximum values of your data, plus 10% wiggle room and with either the maximum or minimum set to 0 if 0 is not in the range already (for a stacked graph, the default minimum is always 0 because all data is positive).
 * @param {Array=} labels For a non-stacked bar graph, an array of text labels of the same size as data. For a stacked bar graph, an array of two arrays; the first is the same as described in the first sentence, and the second is an array of labels corresponding to the different stacked components. See the example below to make this more clear. If undefined, then no labels are shown in tooltips and just the data values are displayed.
 * @param {function(number)=} dataTooltipFn An optional function to process the data values when displayed in a tooltip. So if one of your values is 54.3876826 and you want to display it rounded, pass Math.round here.
 *
 * Example JavaScript: Fitting with the HTML and CSS above...
 *
 * This will create a non-stacked bar plot, with positive and negative values shown in different colors. Tooltip labels will be like "2002: $15", "2003: $3", etc.
 *
 *     $.barGraph($("my-plot"), [15.2, 3, -5, 7.2], [-10, 20], [2002, 2003, 2004, 2005], function (val) { return "$" + Math.round(val); });
 *
 * This will create a stacked bar plot, with tooltip labels like "NJ Lions: 1", "NJ Tigers: 5", "NY Lions: 5", etc.
 *
 *     $.barGraph($("my-plot"), [[1, 5, 2], [5, 3, 1]], undefined, [["NJ", "NY", "PA"], ["Lions", "Tigers"]]);
 *
 * This will just draw the same bars as above, but with no labels in the tooltips, so they will just be the numbers themselves.
 *
 *     $.barGraph($("my-plot"), [[1, 5, 2], [5, 3, 1]]);
 */
/*global jQuery */
(function ($) {
    "use strict";

    // Default scale for bar chart. This finds the max and min values in the data, adds 10% in each direction so you don't end up with tiny slivers, and then expands the upper/lower lims to 0 if 0 wasn't already in the range.
    function defaultYlim(data, stacked) {
        var i, j, max, min, x;

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

        // For stacked plots, min is always 0
        if (stacked) {
            min = 0;
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

    $.barGraph = function (container, data, ylim, labels, dataTooltipFn) {
        var bottom, cssClass, gap, height, i, j, offsets, scaled, stacked, titleStart;

        dataTooltipFn = dataTooltipFn !== undefined ? dataTooltipFn : function (val) { return val; };

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

        container.empty()
            .data("numBars", stacked ? data[0].length : data.length)
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
            // Not stacked
            for (i = 0; i < data.length; i++) {
                if (data[i] !== null && data[i] !== undefined) {
                    titleStart = "";
                    if (labels !== undefined) {
                        titleStart = labels[i] + ": ";
                    }
                    // Fix for negative values
                    if (data[i] >= 0) {
                        bottom = scale(0, ylim);
                        height = scaled[i] - scale(0, ylim);
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
                            title: titleStart + dataTooltipFn(data[i])
                        })
                        .appendTo(container);
                }
            }
        } else {
            // Stacked
            offsets = [];
            for (j = 0; j < data.length; j++) {
                for (i = 0; i < data[j].length; i++) {
                    if (j === 0) {
                        offsets[i] = 0;
                    } else {
                        offsets[i] += scaled[j - 1][i];
                    }
                    if (data[j][i] !== null && data[j][i] !== undefined) {
                        titleStart = "";
                        if (labels !== undefined) {
                            titleStart = labels[0][i] + " " + labels[1][j] + ": ";
                        }
                        $("<div></div>", {"class": "bar-graph-" + (j + 1)})
                            .data("num", i)
                            .css({
                                position: "absolute",
                                bottom: offsets[i] + "%",
                                height: scaled[j][i] + "%"
                            })
                            .tooltip({
                                title: titleStart + dataTooltipFn(data[j][i])
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
}(jQuery));