import { defineChart, dot, lineY, text } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveStepAfter } from "d3-shape";
import { useMemo } from "react";
import { POMYMARKET_NAME } from "../../common/constants.ts";
import { roundWinPercents } from "../../common/winProbability.ts";
import { TEAM_NUMS_DISPLAY_ORDER } from "../util/boxScoreDisplayOrder.ts";
import {
	getLabelYs,
	getLineColors,
	type LiveWinpSample,
} from "../util/liveWinpChart.ts";

const HEIGHT = 200;
// The team labels sit just right of the line's end, which reaches the plot's right edge at the final buzzer, so the percent ticks are pushed past them
const TEAM_LABEL_WIDTH_PX = 72;
const MARGIN = {
	top: 12,
	right: TEAM_LABEL_WIDTH_PX + 36,
	bottom: 12,
	left: 0,
};

const LABEL_HEIGHT_PX = 34;
const MIN_LABEL_GAP = LABEL_HEIGHT_PX / (HEIGHT - MARGIN.top - MARGIN.bottom);

const GRID_VALUES = [0, 0.2, 0.4, 0.6, 0.8, 1];
const LINE_CURVE = d3Curve(curveStepAfter);

type ChartTeam = {
	abbrev: string;
	colors: string[];
};

export const PomymarketChart = ({
	gameOver,
	samples,
	teams,
	xDomain,
}: {
	gameOver: boolean;
	samples: LiveWinpSample[];
	teams: readonly [ChartTeam, ChartTeam];
	xDomain: number;
}) => {
	const abbrev0 = teams[0].abbrev;
	const abbrev1 = teams[1].abbrev;
	const colors0 = teams[0].colors.join();
	const colors1 = teams[1].colors.join();
	const numSamples = samples.length;

	const info = useMemo(() => {
		const last = samples.at(-1);
		if (!last) {
			return;
		}

		const abbrevs = [abbrev0, abbrev1];
		const lineColors = getLineColors([colors0.split(","), colors1.split(",")]);
		const { percents } = roundWinPercents(last.prob, gameOver);
		const probs: [number, number] = [last.prob, 1 - last.prob];
		const labelYs = getLabelYs(probs, MIN_LABEL_GAP);
		const labels = TEAM_NUMS_DISPLAY_ORDER.map((i) => ({
			abbrev: abbrevs[i]!,
			color: lineColors[i],
			percent: `${percents[i]}%`,
			prob: probs[i],
			x: last.x,
			y: labelYs[i],
		}));

		const definition = defineChart({
			marks: [
				...TEAM_NUMS_DISPLAY_ORDER.map((i) =>
					decorative(
						lineY(samples, {
							x: "x",
							y: (d) => (i === 0 ? d.prob : 1 - d.prob),
							stroke: lineColors[i],
							strokeWidth: 2,
							curve: LINE_CURVE,
						}),
					),
				),
				// dot only takes a static fill, so each team gets its own mark
				...labels.map((label) =>
					decorative(
						dot([label], {
							x: "x",
							y: "prob",
							r: 4,
							fill: label.color,
						}),
					),
				),
				decorative(
					text(labels, {
						x: "x",
						y: "y",
						text: "abbrev",
						fill: (d) => d.color,
						anchor: "start",
						dx: 8,
						dy: -9,
						fontSize: 12,
					}),
				),
				decorative(
					text(labels, {
						x: "x",
						y: "y",
						text: "percent",
						fill: (d) => d.color,
						anchor: "start",
						dx: 8,
						dy: 9,
						fontSize: 20,
						fontWeight: 700,
					}),
				),
			],
			scales: {
				x: {
					scale: scaleLinear().domain([0, xDomain]),
					axis: false,
				},
				y: {
					scale: scaleLinear().domain([0, 1]),
					side: "right",
					grid: {
						stroke: "var(--bs-border-color)",
						strokeDasharray: "2 4",
					},
					axis: {
						line: false,
						ticks: {
							values: GRID_VALUES,
							line: false,
							format: (value: number) => `${Math.round(value * 100)}%`,
						},
						tickLabels: {
							dx: TEAM_LABEL_WIDTH_PX,
							fontSize: 11,
							opacity: 0.6,
						},
					},
				},
			},
			margin: MARGIN,
		});

		const ariaLabel = `${POMYMARKET_NAME} win probability over time: ${labels
			.map((label) => `${label.abbrev} ${label.percent}`)
			.join(", ")}`;

		return { ariaLabel, definition };
		// samples is a ref array mutated in place, so its length tells the chart when to redraw
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [abbrev0, abbrev1, colors0, colors1, gameOver, numSamples, xDomain]);

	if (!info) {
		return null;
	}

	return (
		<div className="mb-3">
			<div className="text-body-secondary small">{POMYMARKET_NAME}</div>
			<Chart
				definition={info.definition}
				height={HEIGHT}
				initialWidth={600}
				ariaLabel={info.ariaLabel}
			/>
		</div>
	);
};
