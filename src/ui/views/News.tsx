import React, { useState } from "react";
import { SafeHtml } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import type { View, LogEventType } from "../../common/types";
import { useLocalShallow, helpers } from "../util";
import classNames from "classnames";

const categories = {
	award: {
		text: "Awards",
		className: "badge-warning",
	},
	league: {
		text: "League",
		className: "badge-secondary",
	},
	injury: {
		text: "Injuries",
		className: "badge-danger",
	},
	playerFeat: {
		text: "Player Feats",
		className: "badge-success",
	},
	playoffs: {
		text: "Playoffs",
		className: "badge-primary",
	},
	rare: {
		text: "Rare Events",
		className: "badge-dark",
	},
	transaction: {
		text: "Transactions",
		className: "badge-info",
	},
	team: {
		text: "Teams",
		className: "badge-light",
	},
};

const types: Partial<Record<
	LogEventType,
	{
		text: string;
		category: keyof typeof categories;
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
	ageFraud: {
		text: "Fraud",
		category: "rare",
	},
	tragedy: {
		text: "Tragic Death",
		category: "rare",
	},
	teamContraction: {
		text: "Contraction",
		category: "team",
	},
	teamExpansion: {
		text: "Expansion",
		category: "team",
	},
	teamLogo: {
		text: "New Logo",
		category: "team",
	},
	teamRelocation: {
		text: "Relocation",
		category: "team",
	},
	teamRename: {
		text: "Rename",
		category: "team",
	},
	gameAttribute: {
		text: "League",
		category: "league",
	},
};

const Badge = ({ type }: { type: LogEventType }) => {
	let text;
	let className;
	const typeInfo = types[type];
	if (typeInfo) {
		text = typeInfo.text;
		className = categories[typeInfo.category].className;
	} else {
		text = type;
		className = "badge-secondary";
	}
	return <span className={`badge badge-news ${className} mr-1`}>{text}</span>;
};

const News = ({ events, level, season, userTid }: View<"news">) => {
	const [showCategories, setShowCategories] = useState<
		Record<keyof typeof categories, boolean>
	>({
		award: true,
		injury: true,
		league: true,
		playerFeat: true,
		playoffs: true,
		rare: true,
		transaction: true,
		team: true,
	});

	useTitleBar({
		title: "News Feed",
		dropdownView: "news",
		dropdownFields: { seasons: season, newsLevels: level },
	});

	const { teamInfoCache } = useLocalShallow(state => ({
		teamInfoCache: state.teamInfoCache,
	}));

	return (
		<>
			{helpers.keys(categories).map(category => {
				const info = categories[category];
				return (
					<div key={category} className="form-check">
						<input
							className="form-check-input"
							type="checkbox"
							checked={showCategories[category]}
							id={`news-${category}`}
							onChange={() => {
								setShowCategories(show => ({
									...show,
									[category]: !show[category],
								}));
							}}
						/>
						<label
							className={`form-check-label badge badge-news ${info.className}`}
							htmlFor={`news-${category}`}
						>
							{info.text}
						</label>
					</div>
				);
			})}

			<div className="row">
				{events
					.filter(event => {
						const type = types[event.type];
						if (type) {
							return showCategories[type.category] === true;
						}
						return true;
					})
					.map(event => {
						const teamInfo =
							event.tid !== undefined ? teamInfoCache[event.tid] : undefined;

						return (
							<div
								key={event.eid}
								className="col-lg-3 col-md-4 col-sm-6 col-12"
							>
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
		</>
	);
};

export default News;
