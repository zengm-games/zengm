/**
 * boxPlot.js
 *
 * This was originally based on boxplot.js by Fabian Dill, available at
 * <http://informationandvisualization.de/blog/box-plot>, but it has since been
 * nearly completely rewritten for Basketball GM. The code is reorganized,
 * mostly JSLint compliant, much simpler (no outlier detection, ...), and now
 * makes horizontal rather than vertical box plots.
 */
var boxPlot = (function () {
    "use strict";

	function quartile(data, quart) {
		if (quart === 1 || quart === 2 || quart === 3) {
			return data[Math.round(data.length * quart / 4)];
		}

		return NaN;
	}

	function calculateValues(data) {
		// Sort in ascending order
		data.sort(function (a, b) { return a - b; });

		// Quartiles, min, max
		return {
		    min: data[0],
			q1: quartile(data, 1),
		    median: quartile(data, 2),
		    q3: quartile(data, 3),
		    max: data[data.length - 1]
		};
	}

	function scaleValue(v, height, scale) {
		return Math.round(height - (((v - scale[0]) / (scale[1] - scale[0])) * height));
	}

	function round(value, precision) {
	    precision = precision !== undefined ? parseInt(precision, 10) : 1;

	    return parseFloat(value).toFixed(precision);
	}

    /**
     * Create a new box plot
     *
     * plot is an object with the following properties:
     *     data: An array of numeric data points.
     *     width: The width of the canvas the box plot will be made in, in
     *         pixels.
     *     scale: An array with two elements, the minimum and the maximum values
     *         for the canvas, in the same units as data. The box plot will then
     *         show up somewhere between these bounds.
     *     container: id of the div the box plot will appear in.
     */
	function create(plot) {
		var containerDiv, lowerBoxDiv, lowerLabel, lowerWhiskerDiv, i, medianLabel, q1Label, q3Label, upperBoxDiv, upperLabel, upperWhiskerDiv, val, x;

		val = calculateValues(plot.data);

		// Scale the markers on the plot to be relative to the size of the canvas
		x = {
			min: scaleValue(val.min, plot.width, plot.scale),
			q1: scaleValue(val.q1, plot.width, plot.scale),
			median: scaleValue(val.median, plot.width, plot.scale),
			q3: scaleValue(val.q3, plot.width, plot.scale),
			max: scaleValue(val.max, plot.width, plot.scale)
		};


		// Lines/boxes
		containerDiv = document.getElementById(plot.container);
		containerDiv.style.height = "26px";
		containerDiv.style.width = plot.width + "px";
		containerDiv.style.border = "none";
		containerDiv.style.borderBottom = "1px solid";

		upperBoxDiv = document.createElement("div");
		upperBoxDiv.id = "upperBox" + plot.container;
		upperBoxDiv.className = "boxplot-element";
		upperBoxDiv.style.right = x.q3 + "px";
		upperBoxDiv.style.width = (x.median - x.q3) + "px";
		containerDiv.appendChild(upperBoxDiv);

		lowerBoxDiv = document.createElement("div");
		lowerBoxDiv.id = "lowerBox" + plot.container;
		lowerBoxDiv.className = "boxplot-element";
		lowerBoxDiv.style.right = x.median + "px";
		lowerBoxDiv.style.width = x.q1 - x.median + "px";
		containerDiv.appendChild(lowerBoxDiv);

		lowerWhiskerDiv = document.createElement("div");
		lowerWhiskerDiv.id = "lowerWhisker" + plot.container;
		lowerWhiskerDiv.className = "boxplot-element";
		lowerWhiskerDiv.style.right = x.min + "px";
		containerDiv.appendChild(lowerWhiskerDiv);

		upperWhiskerDiv = document.createElement("div");
		upperWhiskerDiv.id = "upperWhisker" + plot.container;
		upperWhiskerDiv.className = "boxplot-element";
		upperWhiskerDiv.style.right = x.max + "px";
		containerDiv.appendChild(upperWhiskerDiv);

		// Labels
		lowerLabel = document.createElement("div");
		lowerLabel.className = "boxplot-label";
		lowerLabel.innerHTML = round(val.min);
		lowerLabel.style.right = x.min + "px";
		lowerLabel.style.top = "70px";
		containerDiv.appendChild(lowerLabel);

		q1Label = document.createElement("div");
		q1Label.className = "boxplot-label";
		q1Label.innerHTML = round(val.q1);
		q1Label.style.right = (x.q1 - 9) + "px";
		q1Label.style.top = "70px";
		containerDiv.appendChild(q1Label);

		medianLabel = document.createElement("div");
		medianLabel.className = "boxplot-label";
		medianLabel.innerHTML = round(val.median);
		medianLabel.style.right = (x.median - 9) + "px";
		medianLabel.style.top = "70px";
		containerDiv.appendChild(medianLabel);

		q3Label = document.createElement("div");
		q3Label.className = "boxplot-label";
		q3Label.innerHTML = round(val.q3);
		q3Label.style.right = (x.q3 - 9) + "px";
		q3Label.style.top = "70px";
		containerDiv.appendChild(q3Label);

		upperLabel = document.createElement("div");
		upperLabel.className = "boxplot-label";
		upperLabel.innerHTML = round(val.max);
		upperLabel.style.right = (x.max - 9) + "px";
		upperLabel.style.top = "70px";
		containerDiv.appendChild(upperLabel);
	}

    return {
        create: create
    };
}());