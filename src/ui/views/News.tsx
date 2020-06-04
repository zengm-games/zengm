import React from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View, EventBBGM, LogEventType } from "../../common/types";
import { useLocalShallow, helpers } from "../util";
import classNames from "classnames";

const classNamesByCategory = {
	award: "badge-warning",
	injury: "badge-danger",
	playerFeat: "badge-success",
	playoffs: "badge-primary",
	transaction: "badge-info",
};

const types: Partial<Record<
	LogEventType,
	{
		text: string;
		category: keyof typeof classNamesByCategory;
	}
>> = {
	injured: {
		text: "Injury",
		category: "injury",
	},
	healed: {
		text: "Recovery",
		category: "injury",
	},
	playerFeat: {
		text: "Player Feat",
		category: "playerFeat",
	},
	playoffs: {
		text: "Playoffs",
		category: "playoffs",
	},
	madePlayoffs: {
		text: "Playoffs",
		category: "playoffs",
	},
	freeAgent: {
		text: "Free Agent",
		category: "transaction",
	},
	reSigned: {
		text: "Re-signing",
		category: "transaction",
	},
	retired: {
		text: "Retirement",
		category: "transaction",
	},
	trade: {
		text: "Trade",
		category: "transaction",
	},
	award: {
		text: "Award",
		category: "award",
	},
	hallOfFame: {
		text: "Hall of Fame",
		category: "award",
	},
};

const Badge = ({ type }: { type: LogEventType }) => {
	let text;
	let className;
	const typeInfo = types[type];
	if (typeInfo) {
		text = typeInfo.text;
		className = classNamesByCategory[typeInfo.category];
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
