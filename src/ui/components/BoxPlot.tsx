import PropTypes from "prop-types";
import type { CSSProperties } from "react";

const quartile = (data: number[], quart: 1 | 2 | 3) => {
	if (quart === 1 || quart === 2 || quart === 3) {
		return data[Math.round((data.length * quart) / 4)];
	}

	return NaN;
};

const calculateValues = (data: number[]) => {
	// Sort in ascending order
	data.sort((a, b) => a - b);

	// Quartiles, min, max
	return {
		min: data[0],
		q1: quartile(data, 1),
		median: quartile(data, 2),
		q3: quartile(data, 3),
		max: data.at(-1),
	};
};

const scaleValue = (v: number, scale: [number, number]) => {
	return Math.round(100 - ((v - scale[0]) / (scale[1] - scale[0])) * 100);
};

const round = (value: number) => {
	return parseFloat(String(value)).toFixed(1);
};

const boxPlotElementStyle = (color: string, style: CSSProperties) => {
	const baseStyle: {
		[key: string]: 0 | string;
	} = {
		background: "var(--white)",
		position: "absolute",
		top: "22px",
		border: `thin solid ${color}`,
		width: "0px",
		height: "20px",
	};
	return Object.assign(baseStyle, style);
};

/**
 * Create a new box plot
 *
 * BoxPlot is a React component with the following props:
 *     data: An array of numeric data points.
 *     quartiles: An array of quartiles (min, q1, median, q2, max). These
 *            will be used only if data is undefined!
 *     scale: An array with two elements, the minimum and the maximum values
 *         for the canvas, in the same units as data. The box plot will then
 *         show up somewhere between these bounds.
 *     color: color of the lines in the boxplot (default black)
 *     labels: boolean for whether to show numeric labels (default true)
 */
const BoxPlot = ({
	color = "#000000",
	data,
	labels = true,
	quartiles,
	scale,
}: {
	color?: string;
	data?: number[];
	labels?: boolean;
	quartiles?: [number, number, number, number, number];
	scale?: [number, number];
}) => {
	// Either calculate quartiles or use the ones passed directly
	let val;

	if (data) {
		val = calculateValues(data);
	} else if (quartiles) {
		val = {
			min: quartiles[0],
			q1: quartiles[1],
			median: quartiles[2],
			q3: quartiles[3],
			max: quartiles[4],
		};
	} else {
		throw new Error("Must specify either data or quartiles");
	}

	if (scale === undefined) {
		scale = [Math.floor(val.min), Math.ceil(val.max)];
	}

	// Scale the markers on the plot to be relative to the size of the canvas. All these values are percentages.
	const x = {
		min: scaleValue(val.min, scale),
		q1: scaleValue(val.q1, scale),
		median: scaleValue(val.median, scale),
		q3: scaleValue(val.q3, scale),
		max: scaleValue(val.max, scale),
	};
	const midLineDiv = (
		<div
			style={boxPlotElementStyle(color, {
				height: "10px",
				width: "100%",
				border: "none",
				borderBottom: `1px solid ${color}`,
			})}
		/>
	);
	const upperBoxDiv = (
		<div
			style={boxPlotElementStyle(color, {
				right: `${x.q3}%`,
				width: `${x.median - x.q3}%`,
			})}
		/>
	);
	const lowerBoxDiv = (
		<div
			style={boxPlotElementStyle(color, {
				right: `${x.median}%`,
				width: `${x.q1 - x.median}%`,
			})}
		/>
	);
	const lowerWhiskerDiv = (
		<div
			style={boxPlotElementStyle(color, {
				right: `${x.min}%`,
			})}
		/>
	);
	const upperWhiskerDiv = (
		<div
			style={boxPlotElementStyle(color, {
				right: `${x.max}%`,
			})}
		/>
	);
	const minScaleDiv = (
		<div
			style={boxPlotElementStyle(color, {
				left: 0,
				borderRight: 0,
			})}
		/>
	);
	const maxScaleDiv = (
		<div
			style={boxPlotElementStyle(color, {
				right: 0,
				borderLeft: 0,
			})}
		/>
	);

	// Labels
	let labelDivs;

	if (labels) {
		const minScaleLabel = (
			<div
				key="minScaleLabel"
				style={{
					position: "absolute",
					left: 0,
					top: "43px",
				}}
			>
				{scale[0]}
			</div>
		);
		const lowerLabel = (
			<div
				key="lowerLabel"
				style={{
					position: "absolute",
					right: `${x.min}%`,
					top: "3px",
					marginRight: "-0.6em",
				}}
			>
				{round(val.min)}
			</div>
		);
		const q1Label = (
			<div
				key="q1Label"
				style={{
					position: "absolute",
					right: `${x.q1}%`,
					top: "43px",
					marginRight: "-0.6em",
				}}
			>
				{round(val.q1)}
			</div>
		);
		const medianLabel = (
			<div
				key="medianLabel"
				style={{
					position: "absolute",
					right: `${x.median}%`,
					top: "3px",
					marginRight: "-0.6em",
				}}
			>
				{round(val.median)}
			</div>
		);
		const q3Label = (
			<div
				key="q3Label"
				style={{
					position: "absolute",
					right: `${x.q3}%`,
					top: "43px",
					marginRight: "-0.6em",
				}}
			>
				{round(val.q3)}
			</div>
		);
		const upperLabel = (
			<div
				key="upperLabel"
				style={{
					position: "absolute",
					right: `${x.max}%`,
					top: "3px",
					marginRight: "-0.6em",
				}}
			>
				{round(val.max)}
			</div>
		);
		const maxScaleLabel = (
			<div
				key="maxScaleLabel"
				style={{
					position: "absolute",
					right: 0,
					top: "43px",
				}}
			>
				{scale[1]}
			</div>
		);
		labelDivs = [
			minScaleLabel,
			lowerLabel,
			q1Label,
			medianLabel,
			q3Label,
			upperLabel,
			maxScaleLabel,
		];
	} else {
		labelDivs = null;
	}

	return (
		<div
			style={{
				height: "64px",
				paddingBottom: "30px",
				position: "relative",
			}}
		>
			{midLineDiv}
			{upperBoxDiv}
			{lowerBoxDiv}
			{lowerWhiskerDiv}
			{upperWhiskerDiv}
			{minScaleDiv}
			{maxScaleDiv}
			{labelDivs}
		</div>
	);
};

BoxPlot.propTypes = {
	color: PropTypes.string,
	data: PropTypes.arrayOf(PropTypes.number),
	labels: PropTypes.bool,
	quartiles: PropTypes.arrayOf(PropTypes.number),
	scale: PropTypes.arrayOf(PropTypes.number),
};

export default BoxPlot;
