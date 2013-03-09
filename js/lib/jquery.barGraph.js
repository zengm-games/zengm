// Written for Basketball GM, but could be used elsewhere easily.
// Dependences, jQuery and bootstrap-tooltips
(function ($) {
    "use strict";

    function setWidths(container, data, gap) {
        var numBars;

        numBars = container.data("numBars");
        container
            .children()
            .each(function () {
                var bar, width;

                bar = $(this);
                width = (container.width() + gap) / numBars; // Width factoring in N-1 gaps

                bar.css({
                    left: bar.data("num") * width,
                    width: width - gap
                });
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
        var i, j, gap, offsets, scaled, stacked;

        labelFn = labelFn !== undefined ? labelFn : function (val) { return val; };

        gap = 2;  // Gap between bars, in pixels

        // Stacked plot or not?
        if (data[0].hasOwnProperty("length")) {
            stacked = true;
        } else {
            stacked = false;
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
                    $("<div></div>", {"class": "bar-graph-1"})
                        .data("num", i)
                        .css({
                            position: "absolute",
                            bottom: 0,
                            height: scaled[i] + "%"
                        })
                        .tooltip({
                            title: labels[i] + ": " + data[i]
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
}(jQuery));