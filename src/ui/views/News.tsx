import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View, EventBBGM, LogEventType } from "../../common/types";
import { useLocalShallow, helpers } from "../util";
import classNames from "classnames";

const classNamesByType = {
	award: "badge-warning",
	injury: "badge-danger",
	playerFeat: "badge-success",
	playoffs: "badge-primary",
	transaction: "badge-info",
};

const Badge = ({ type }: { type: LogEventType }) => {
	let text;
	let className;
	if (type === "injured") {
		text = "Injury";
		className = classNamesByType.injury;
	} else if (type === "healed") {
		text = "Recovery";
		className = classNamesByType.injury;
	} else if (type === "playerFeat") {
		text = "Player Feat";
		className = classNamesByType.playerFeat;
	} else if (type === "playoffs" || type === "madePlayoffs") {
		text = "Playoffs";
		className = classNamesByType.playoffs;
	} else if (type === "freeAgent") {
		text = "Free Agent";
		className = classNamesByType.transaction;
	} else if (type === "reSigned") {
		text = "Re-signing";
		className = classNamesByType.transaction;
	} else if (type === "retired") {
		text = "Retirement";
		className = classNamesByType.transaction;
	} else if (type === "award") {
		text = "Award";
		className = classNamesByType.award;
	} else if (type === "hallOfFame") {
		text = "Hall of Fame";
		className = classNamesByType.award;
	} else {
		text = type;
		className = "badge-secondary";
	}
	return <span className={`badge badge-news ${className} mr-1`}>{text}</span>;
};

const News = ({ events, level, season, userTid }: View<"news">) => {
	useTitleBar({
		title: "League News",
		dropdownView: "news",
		dropdownFields: { seasons: season, newsLevels: level },
	});

	const { teamInfoCache } = useLocalShallow(state => ({
		teamInfoCache: state.teamInfoCache,
	}));

	return (
		<div className="row">
			{events.map(event => {
				const teamInfo =
					event.tid !== undefined ? teamInfoCache[event.tid] : undefined;

				return (
					<div key={event.eid} className="col-lg-3 col-md-4 col-sm-6 col-12">
						<div className="card mb-3">
							<div
								className={classNames(
									"p-2",
									event.tids && event.tids.includes(userTid)
										? "table-info"
										: "card-header",
								)}
							>
								<Badge type={event.type} />
								{teamInfo ? (
									<a
										href={helpers.leagueUrl([
											"roster",
											`${teamInfo.abbrev}_${event.tid}`,
										])}
										className="float-right"
									>
										{teamInfo.region} {teamInfo.name}
									</a>
								) : null}
							</div>
							<div className="p-2">
								<SafeHtml dirty={event.text} />
								{event.score !== undefined ? (
									<div className="text-muted">Score: {event.score}</div>
								) : null}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default News;
