// @flow

import PropTypes from "prop-types";
import React from "react";
import Line from "recharts/lib/cartesian/Line";
import ReferenceLine from "recharts/lib/cartesian/ReferenceLine";
import XAxis from "recharts/lib/cartesian/XAxis";
import YAxis from "recharts/lib/cartesian/YAxis";
import Label from "recharts/lib/component/Label";
import LineChart from "recharts/lib/chart/LineChart";
import { NewWindowLink, SafeHtml } from "../components";
import { helpers, setTitle } from "../util";
import type { Message as Message_, OwnerMood } from "../../common/types";

const OwnerMoodsChart = ({
    ownerMoods,
    year,
}: {
    ownerMoods: OwnerMood[],
    year: number,
}) => {
    if (ownerMoods.length < 3) {
        return null;
    }

    const data = ownerMoods.map((mood, i) => {
        return {
            ...mood,
            total: mood.money + mood.playoffs + mood.wins,
            year: year - ownerMoods.length + 1 + i,
        };
    });

    const domain = [
        Math.min(-1.3, ...data.map(d => d.total)),
        Math.max(3.3, ...data.map(d => d.total)),
    ];

    return (
        <div className="position-relative">
            <LineChart
                width={400}
                height={400}
                data={data}
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                className="mb-2"
            >
                <XAxis dataKey="year" style={{ fill: "var(--secondary)" }} />
                <YAxis type="number" domain={domain} tick={false} hide />
                <Line
                    dataKey="wins"
                    yAxisId={0}
                    style={{ stroke: "var(--danger)" }}
                />
                <Line
                    dataKey="playoffs"
                    yAxisId={0}
                    style={{ stroke: "var(--info)" }}
                />
                <Line
                    dataKey="money"
                    yAxisId={0}
                    style={{ stroke: "var(--success)" }}
                />
                <Line
                    dataKey="total"
                    yAxisId={0}
                    strokeWidth={4}
                    style={{ stroke: "var(--dark)" }}
                />
                <ReferenceLine
                    y={3}
                    strokeDasharray="5 5"
                    style={{ stroke: "var(--success)" }}
                >
                    <Label
                        value="Perfect"
                        position="insideBottomRight"
                        style={{ fill: "var(--success)" }}
                    />
                </ReferenceLine>
                <ReferenceLine
                    y={-1}
                    strokeDasharray="5 5"
                    style={{ stroke: "var(--danger)" }}
                >
                    <Label
                        value="You're fired!"
                        position="insideTopRight"
                        style={{ fill: "var(--danger)" }}
                    />
                </ReferenceLine>
            </LineChart>
            <div className="chart-legend">
                <ul className="list-unstyled mb-0">
                    <li className="text-danger">— Regular season success</li>
                    <li className="text-info">— Playoff success</li>
                    <li className="text-success">— Finances</li>
                    <li className="text-dark font-weight-bold">— Total</li>
                </ul>
            </div>
        </div>
    );
};

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

const Message = ({ message }: { message: void | Message_ }) => {
    if (!message) {
        setTitle("Message");

        return (
            <>
                <h1>Error</h1>
                <p>Message not found.</p>
            </>
        );
    }

    setTitle(`Message From ${message.from}`);

    return (
        <>
            {message.subject ? (
                <>
                    <h4>{message.subject}</h4>
                    <h5 className="mb-3">
                        From: {message.from}, {message.year} <NewWindowLink />
                    </h5>
                </>
            ) : (
                <h4 className="mb-3">
                    From: {message.from}, {message.year} <NewWindowLink />
                </h4>
            )}

            <SafeHtml dirty={message.text} />

            {message.ownerMoods ? (
                <OwnerMoodsChart
                    ownerMoods={message.ownerMoods}
                    year={message.year}
                />
            ) : null}

            <p>
                <a href="#" onClick={() => window.history.back()}>
                    Previous Page
                </a>{" "}
                · <a href={helpers.leagueUrl(["inbox"])}>Inbox</a>
            </p>
        </>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        from: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        year: PropTypes.number.isRequired,
        subject: PropTypes.string,
        ownerMoods: PropTypes.array,
    }),
};

export default Message;
