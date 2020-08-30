import React from "react";
import PlayerPicture from "./PlayerPicture";
import SafeHtml from "./SafeHtml";
import classNames from "classnames";
import { helpers } from "../util";
import type { View, LogEventType } from "../../common/types";

export const categories = {
	award: {
		text: "Awards",
		className: "badge-warning",
	},
	draft: {
		text: "Draft",
		className: "badge-darkblue",
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
		className: "badge-info",
	},
	playoffs: {
		text: "Playoffs",
		className: "badge-orange",
	},
	rare: {
		text: "Rare Events",
		className: "badge-dark",
	},
	transaction: {
		text: "Transactions",
		className: "badge-success",
	},
	team: {
		text: "Teams",
		className: "badge-light",
	},
};

export const types: Partial<Record<
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
	release: {
		text: "Released",
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
	retiredJersey: {
		text: "Jersey Retirement",
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
	draft: {
		text: "Draft",
		category: "draft",
	},
	draftLottery: {
		text: "Draft Lottery",
		category: "draft",
	},
	newLeague: {
		text: "New League",
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
	return (
		<span
			className={`badge badge-news m-2 ml-auto align-self-start ${className}`}
		>
			{text}
		</span>
	);
};

const logoStyle = { height: 36 };

const NewsBlock = ({
	event,
	season,
	userTid,
	teams,
}: {
	event: View<"news">["events"][number];
	season: number;
	userTid: number;
	teams: {
		abbrev: string;
		imgURL?: string;
		region: string;
	}[];
}) => {
	let teamName = null;
	if (event.tid !== undefined) {
		const teamInfo = teams[event.tid];

		if (teamInfo) {
			const rosterURL = helpers.leagueUrl([
				"roster",
				`${teamInfo.abbrev}_${event.tid}`,
				season,
			]);

			teamName = (
				<>
					{teamInfo.imgURL ? (
						<a
							href={rosterURL}
							className="align-self-center p-1"
							style={logoStyle}
						>
							<img className="mw-100 mh-100" src={teamInfo.imgURL} alt="" />
						</a>
					) : null}
					<a href={rosterURL} className="align-self-center pl-1">
						{teamInfo.region}
					</a>
				</>
			);
		}
	} else if (event.tids && event.tids.length <= 3) {
		// Show multiple logos, like for a trade;
		teamName = event.tids.map(tid => {
			const teamInfo = teams[tid];

			if (!teamInfo) {
				return null;
			}
			const rosterURL = helpers.leagueUrl([
				"roster",
				`${teamInfo.abbrev}_${event.tid}`,
				season,
			]);

			return (
				<a
					key={tid}
					href={rosterURL}
					className="align-self-center p-1"
					style={logoStyle}
				>
					{teamInfo.imgURL ? (
						<img className="mw-100 mh-100" src={teamInfo.imgURL} alt="" />
					) : (
						teamInfo.abbrev
					)}
				</a>
			);
		});
	}

	return (
		<div className="card">
			<div
				className={classNames(
					"d-flex",
					event.tids && event.tids.includes(userTid)
						? "table-info"
						: "card-header p-0",
				)}
			>
				{teamName}
				<Badge type={event.type} />
			</div>
			<div className="d-flex">
				{event.p && event.p.imgURL !== "/img/blank-face.png" ? (
					<div
						style={{
							maxHeight: 90,
							width: 60,
							marginTop: event.p.imgURL ? 0 : -10,
						}}
						className="flex-shrink-0"
					>
						<PlayerPicture face={event.p.face} imgURL={event.p.imgURL} />
					</div>
				) : null}
				<div className="p-2">
					<SafeHtml dirty={event.text} />
				</div>
			</div>
		</div>
	);
};

export default NewsBlock;
