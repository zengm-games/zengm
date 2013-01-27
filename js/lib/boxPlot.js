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

	function scaleValue(v, scale) {
		return Math.round(100 - (((v - scale[0]) / (scale[1] - scale[0])) * 100));
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
     *     scale: An array with two elements, the minimum and the maximum values
     *         for the canvas, in the same units as data. The box plot will then
     *         show up somewhere between these bounds.
     *     container: id of the div the box plot will appear in.
     */
	function create(plot) {
		var containerDiv, lowerBoxDiv, lowerLabel, lowerWhiskerDiv, i, medianLabel, midLineDiv, maxScaleDiv, maxScaleLabel, minScaleDiv, minScaleLabel, q1Label, q3Label, upperBoxDiv, upperLabel, upperWhiskerDiv, val, x;

		val = calculateValues(plot.data);

		// Scale the markers on the plot to be relative to the size of the canvas. All these values are percentages.
		x = {
			min: scaleValue(val.min, plot.scale),
			q1: scaleValue(val.q1, plot.scale),
			median: scaleValue(val.median, plot.scale),
			q3: scaleValue(val.q3, plot.scale),
			max: scaleValue(val.max, plot.scale)
		};


		// Lines/boxes
		containerDiv = document.getElementById(plot.container);
		containerDiv.style.height = "34px";

		midLineDiv = document.createElement("div");
		midLineDiv.id = "midLine" + plot.container;
		midLineDiv.className = "boxplot-element";
		midLineDiv.style.height = "10px";
		midLineDiv.style.width = "100%";
		midLineDiv.style.border = "none";
		midLineDiv.style.borderBottom = "1px solid";
		containerDiv.appendChild(midLineDiv);

		upperBoxDiv = document.createElement("div");
		upperBoxDiv.id = "upperBox" + plot.container;
		upperBoxDiv.className = "boxplot-element";
		upperBoxDiv.style.right = x.q3 + "%";
		upperBoxDiv.style.width = (x.median - x.q3) + "%";
		containerDiv.appendChild(upperBoxDiv);

		lowerBoxDiv = document.createElement("div");
		lowerBoxDiv.id = "lowerBox" + plot.container;
		lowerBoxDiv.className = "boxplot-element";
		lowerBoxDiv.style.right = x.median + "%";
		lowerBoxDiv.style.width = x.q1 - x.median + "%";
		containerDiv.appendChild(lowerBoxDiv);

		lowerWhiskerDiv = document.createElement("div");
		lowerWhiskerDiv.id = "lowerWhisker" + plot.container;
		lowerWhiskerDiv.className = "boxplot-element";
		lowerWhiskerDiv.style.right = x.min + "%";
		containerDiv.appendChild(lowerWhiskerDiv);

		upperWhiskerDiv = document.createElement("div");
		upperWhiskerDiv.id = "upperWhisker" + plot.container;
		upperWhiskerDiv.className = "boxplot-element";
		upperWhiskerDiv.style.right = x.max + "%";
		containerDiv.appendChild(upperWhiskerDiv);

		minScaleDiv = document.createElement("div");
		minScaleDiv.id = "upperWhisker" + plot.container;
		minScaleDiv.className = "boxplot-element";
		minScaleDiv.style.left = 0;
		minScaleDiv.style.borderRight = 0;
		containerDiv.appendChild(minScaleDiv);

		maxScaleDiv = document.createElement("div");
		maxScaleDiv.id = "upperWhisker" + plot.container;
		maxScaleDiv.className = "boxplot-element";
		maxScaleDiv.style.right = 0;
		maxScaleDiv.style.borderLeft = 0;
		containerDiv.appendChild(maxScaleDiv);

		// Labels
		minScaleLabel = document.createElement("div");
		minScaleLabel.innerHTML = round(plot.scale[0]);
		minScaleLabel.style.position = "absolute";
		minScaleLabel.style.left = 0;
		minScaleLabel.style.top = "40px";
		containerDiv.appendChild(minScaleLabel);

		lowerLabel = document.createElement("div");
		lowerLabel.innerHTML = round(val.min);
		lowerLabel.style.position = "absolute";
		lowerLabel.style.right = x.min + "%";
		lowerLabel.style.top = "0px";
		lowerLabel.style.marginRight = "-0.6em";
		containerDiv.appendChild(lowerLabel);

		q1Label = document.createElement("div");
		q1Label.innerHTML = round(val.q1);
		q1Label.style.position = "absolute";
		q1Label.style.right = x.q1 + "%";
		q1Label.style.top = "40px";
		q1Label.style.marginRight = "-0.6em";
		containerDiv.appendChild(q1Label);

		medianLabel = document.createElement("div");
		medianLabel.innerHTML = round(val.median);
		medianLabel.style.position = "absolute";
		medianLabel.style.right = x.median + "%";
		medianLabel.style.top = "0px";
		medianLabel.style.marginRight = "-0.6em";
		containerDiv.appendChild(medianLabel);

		q3Label = document.createElement("div");
		q3Label.innerHTML = round(val.q3);
		q3Label.style.position = "absolute";
		q3Label.style.right = x.q3 + "%";
		q3Label.style.top = "40px";
		q3Label.style.marginRight = "-0.6em";
		containerDiv.appendChild(q3Label);

		upperLabel = document.createElement("div");
		upperLabel.innerHTML = round(val.max);
		upperLabel.style.position = "absolute";
		upperLabel.style.right = x.max + "%";
		upperLabel.style.top = "0px";
		upperLabel.style.marginRight = "-0.6em";
		containerDiv.appendChild(upperLabel);

		maxScaleLabel = document.createElement("div");
		maxScaleLabel.innerHTML = round(plot.scale[1]);
		maxScaleLabel.style.position = "absolute";
		maxScaleLabel.style.right = 0;
		maxScaleLabel.style.top = "40px";
		containerDiv.appendChild(maxScaleLabel);
	}

    return {
        create: create
    };
}());