// Written for Basketball GM, but could be used elsewhere easily.
// Dependences, jQuery and bootstrap-tooltips
(function ($) {
    "use strict";

    function setWidths(container, data, gap) {
        container
            .children()
            .each(function () {
                var bar, width;

                bar = $(this);
                width = (container.width() + gap) / data.length; // Width factoring in N-1 gaps

                bar.css({
                    left: bar.data("num") * width,
                    width: width - gap
                });
            });
    }

    $.barGraph = function (container, data, ylim, labels) {
        var bar, barWidth, i, gap, scaled, stacked;

        gap = 2;  // Gap between bars, in pixels

        // Stacked plot or not?
        if (data[0].hasOwnProperty("length")) {
            stacked = true;
        } else {
            stacked = false;
        }

        // Width of each bar, as a fraction of the container width
        barWidth = 1 / data.length;

        container.css({
            position: "relative"
        });

        if (!stacked) {
            // Convert heights to percentages
            scaled = [];
            for (i = 0; i < data.length; i++) {
                if (data[i] > ylim[1]) {
                    scaled[i] = 100;
                } else if (data[i] < ylim[0]) {
                    scaled[i] = 0;
                } else {
                    scaled[i] = (data[i] - ylim[0]) / (ylim[1] - ylim[0]) * 100;
                }
            }

            // Draw bars
            for (i = data.length - 1; i >= 0; i--) {  // Count down so the ones on the left are drawn on top so the borders show
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
        }

        // Calculate widths and have them update whenever the container changes size
        setWidths(container, data, gap);
        $(window).resize(function () { setWidths(container, data, gap); });
    };
}(jQuery));