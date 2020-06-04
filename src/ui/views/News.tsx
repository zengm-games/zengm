import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View, EventBBGM, LogEventType } from "../../common/types";
import { useLocalShallow, helpers } from "../util";

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
	} else if (type === "hallOfFame") {
		text = "Hall of Fame";
		className = classNamesByType.award;
	} else {
		text = type;
		className = "badge-secondary";
	}
	return <span className={`badge badge-news ${className} mr-1`}>{text}</span>;
};

const getTid = (event: EventBBGM) => {
	if (!event.tids || event.tids.length === 0 || event.tids[0] < 0) {
		return;
	}

	if (event.type === "playoffs") {
		// First team is winning team
		return event.tids[0];
	}

	if (event.tids.length !== 1) {
		return;
	}

	return event.tids[0];
};

const News = ({ events, level, season }: View<"news">) => {
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
				const tid = getTid(event);
				const teamInfo = tid !== undefined ? teamInfoCache[tid] : undefined;

				return (
					<div key={event.eid} className="col-lg-3 col-md-4 col-sm-6 col-12">
						<div className="card mb-3">
							<div className="card-header p-2">
								<Badge type={event.type} />
								{teamInfo ? (
									<a
										href={helpers.leagueUrl([
											"roster",
											`${teamInfo.abbrev}_${tid}`,
										])}
										className="float-right"
									>
										{teamInfo.region} {teamInfo.name}
									</a>
								) : null}
							</div>
							<div className="p-2">
								{event.score !== undefined ? `${event.score} ` : null}
								<SafeHtml dirty={event.text} />
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default News;
