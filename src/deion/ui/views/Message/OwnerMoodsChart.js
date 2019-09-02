// @flow

import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { axisBottom } from "d3-axis";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { select } from "d3-selection";
import type { OwnerMood } from "../../../common/types";

const OwnerMoodsChart = React.memo(
    ({ ownerMoods, year }: { ownerMoods: OwnerMood[], year: number }) => {
        const [node, setNode] = useState(null);

        const getNode = useCallback(node2 => {
            if (node2 !== null) {
                setNode(node2);
            }
        }, []);

        useEffect(() => {
            if (node) {
                if (ownerMoods.length < 3) {
                    return;
                }

                const data = ownerMoods.map((mood, i) => {
                    return {
                        ...mood,
                        total: mood.money + mood.playoffs + mood.wins,
                        year: String(year - ownerMoods.length + 1 + i),
                    };
                });

                const allValues = [];
                const years = [];
                for (const row of data) {
                    years.push(row.year);
                    allValues.push(
                        row.money,
                        row.playoffs,
                        row.wins,
                        row.total,
                    );
                }

                const yDomain = [
                    Math.min(-1.3, ...allValues),
                    Math.max(3.3, ...allValues),
                ];

                const margin = { top: 10, right: 15, bottom: 40, left: 15 };
                const width = node.clientWidth - margin.left - margin.right;
                const height = 400;

                const xScale = scalePoint()
                    .domain(years)
                    .range([0, width]);

                const yScale = scaleLinear()
                    .domain(yDomain)
                    .range([height, 0]);

                const svg = select(node)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr(
                        "transform",
                        `translate(${margin.left},${margin.top})`,
                    );

                const drawReferenceLine = (y, color, text, position) => {
                    const line2 = line()
                        .x(d => d)
                        .y(() => yScale(y));

                    svg.append("path")
                        .datum(xScale.range())
                        .attr("class", "chart-line")
                        .style("stroke", color)
                        .style("stroke-dasharray", "5 5")
                        .attr("d", line2);

                    svg.append("text")
                        .attr("y", yScale(y) + (position === "above" ? -7 : 17))
                        .attr("x", width - 4)
                        .attr("text-anchor", "end")
                        .style("fill", color)
                        .text(text);
                };

                drawReferenceLine(3, "var(--success)", "Perfect", "above");
                drawReferenceLine(
                    -1,
                    "var(--danger)",
                    "You're fired!",
                    "below",
                );

                const drawLine = (attr, color, strokeWidth = 1) => {
                    const line2 = line()
                        .x(d => xScale(d.year))
                        .y(d => yScale(d[attr]))
                        .curve(curveMonotoneX);

                    svg.append("path")
                        .datum(data)
                        .attr("class", "chart-line")
                        .style("stroke", color)
                        .style("stroke-width", strokeWidth)
                        .attr("d", line2);

                    svg.selectAll()
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("class", "chart-point")
                        .attr("stroke", color)
                        .style("stroke-width", strokeWidth)
                        .attr("cx", d => xScale(d.year))
                        .attr("cy", d => yScale(d[attr]))
                        .attr("r", 3);
                };

                drawLine("wins", "var(--danger)");
                drawLine("playoffs", "var(--info)");
                drawLine("money", "var(--success)");
                drawLine("total", "var(--dark)", 3);

                svg.append("g")
                    .attr("class", "chart-axis")
                    .attr("transform", `translate(0,${height})`)
                    .call(axisBottom(xScale));
            }
        }, [node, ownerMoods, year]);

        return (
            <div className="position-relative">
                <div ref={getNode} style={{ maxWidth: 400 }} />
                <div className="chart-legend">
                    <ul className="list-unstyled mb-0">
                        <li className="text-danger">
                            — Regular season success
                        </li>
                        <li className="text-info">— Playoff success</li>
                        <li className="text-success">— Finances</li>
                        <li className="text-dark font-weight-bold">— Total</li>
                    </ul>
                </div>
            </div>
        );
    },
);

OwnerMoodsChart.propTypes = {
    ownerMoods: PropTypes.arrayOf(
        PropTypes.shape({
            money: PropTypes.number.isRequired,
            playoffs: PropTypes.number.isRequired,
            wins: PropTypes.number.isRequired,
        }),
    ).isRequired,
    year: PropTypes.number.isRequired,
};

export default OwnerMoodsChart;
