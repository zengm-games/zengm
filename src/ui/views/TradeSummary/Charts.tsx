import React, { useCallback, useEffect, useState } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { select } from "d3-selection";
import type { View } from "../../../common/types";
import { helpers } from "../../util";

const Charts = ({
	season,
	seasonsToPlot,
	teams,
}: Pick<View<"tradeSummary">, "season" | "seasonsToPlot" | "teams">) => {
	const [node, setNode] = useState<HTMLDivElement | null>(null);
	const getNode = useCallback(node2 => {
		if (node2 !== null) {
			setNode(node2);
		}
	}, []);
	useEffect(() => {
		if (node) {
			const allStats: number[] = [];
			const seasons: string[] = [];

			for (const row of seasonsToPlot) {
				for (const team of row.teams) {
					if (team.stat !== undefined) {
						allStats.push(team.stat);
					}
				}
				seasons.push(row.season);
			}

			// totals span -1 to 3, others -3 to 1
			const yDomainStat = [Math.min(0, ...allStats), Math.max(1, ...allStats)];
			const margin = {
				top: 15,
				right: 15,
				bottom: 30,
				left: 30,
			};
			const width = node.clientWidth - margin.left - margin.right;
			const height = 200;
			const xScale = scalePoint().domain(seasons).range([0, width]);
			const yScaleWinp = scaleLinear().domain([0, 1]).range([height, 0]) as (
				y: number,
			) => number;
			const yScaleStat = scaleLinear()
				.domain(yDomainStat)
				.range([height, 0]) as (y: number) => number;
			const svg = select(node)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			const drawHorizontal = (
				yScale: (y: number) => number,
				y: number,
				color: string,
				text?: string,
				position?: string,
			) => {
				const line2 = line<number>()
					.x(d => d)
					.y(() => yScale(y));
				svg
					.append("path")
					.datum(xScale.range())
					.attr("class", "chart-line")
					.style("stroke", color)
					.style("stroke-dasharray", "5 5")
					.attr("d", line2);

				if (text) {
					svg
						.append("text")
						.attr("y", yScale(y) + (position === "above" ? -7 : 17))
						.attr("x", width - 4)
						.attr("text-anchor", "end")
						.style("fill", color)
						.text(text);
				}
			};

			/*drawReferenceLine(3, "var(--success)", "Perfect", "above");
			drawReferenceLine(-1, "var(--danger)", "You're fired!", "below");
			drawReferenceLine(3, "var(--success)", "Perfect", "above");
            drawReferenceLine(0, "var(--secondary)");*/
			drawHorizontal(yScaleWinp, 0.5, "var(--secondary)");

			const strokeWidth = 1;

			for (let i = 0; i < 2; i++) {
				const color = teams[i].colors[0];

				const line2 = line<typeof seasonsToPlot[number]>()
					.x(d => xScale(d.season) as number)
					.y(d => yScaleWinp(d.teams[i].winp ?? 0))
					.curve(curveMonotoneX);

				svg
					.append("path")
					.datum(seasonsToPlot)
					.attr("class", "chart-line")
					.style("stroke", color)
					.style("stroke-width", strokeWidth)
					.attr("d", line2);

				svg
					.selectAll()
					.data(seasonsToPlot)
					.enter()
					.append("circle")
					.attr("class", "chart-point")
					.attr("stroke", color)
					.style("stroke-width", strokeWidth)
					.attr("cx", d => xScale(d.season) as number)
					.attr("cy", d => yScaleWinp(d.teams[i].winp ?? 0))
					.attr("r", 5 * Math.sqrt(strokeWidth));

				svg
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,${height})`)
					.call(axisBottom(xScale));

				svg
					.append("g")
					.attr("class", "chart-axis")
					.attr("transform", `translate(0,0)`)
					.call(axisLeft(yScaleWinp).tickFormat(helpers.roundWinp));
			}
		}
	}, [node, seasonsToPlot, teams]);

	return (
		<div
			className="position-relative mt-3"
			style={{
				maxWidth: 400,
			}}
		>
			<div className="text-center">
				Team winning percentages before and after the trade
			</div>
			<div ref={getNode} />
			<div
				className="chart-legend"
				style={{
					top: 24,
					left: "inherit",
					right: 13,
				}}
			>
				<ul className="list-unstyled mb-0">
					{teams.map((t, i) => (
						<li key={i} style={{ color: t.colors[0] }}>
							— {t.abbrev}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default Charts;
