import { PlayerPicture } from ".";
import SafeHtml from "./SafeHtml";
import classNames from "classnames";
import { helpers } from "../util";
import type { View, LogEventType } from "../../common/types";
import { categories, types } from "../../common/transactionInfo";

const Badge = ({ type }: { type: LogEventType }) => {
	let text;
	let className;
	const typeInfo = types[type];
	if (typeInfo) {
		text = typeInfo.text;
		className = categories[typeInfo.category].className;
	} else {
		text = type;
		className = "bg-secondary";
	}
	return (
		<span className={`badge badge-news mx-2 ms-auto ${className}`}>{text}</span>
	);
};

const logoStyle = { maxHeight: 28, maxWidth: 28 };
const topStyle = { height: 36 };

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
		imgURLSmall?: string;
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
					{teamInfo.imgURL || teamInfo.imgURLSmall ? (
						<a href={rosterURL} className="p-1">
							<img
								src={teamInfo.imgURLSmall ?? teamInfo.imgURL}
								alt=""
								style={logoStyle}
							/>
						</a>
					) : null}
					<a href={rosterURL} className="ps-1">
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
				`${teamInfo.abbrev}_${tid}`,
				season,
			]);

			return (
				<a key={tid} href={rosterURL} className="p-1">
					{teamInfo.imgURL || teamInfo.imgURLSmall ? (
						<img
							src={teamInfo.imgURLSmall ?? teamInfo.imgURL}
							alt=""
							style={logoStyle}
						/>
					) : (
						teamInfo.abbrev
					)}
				</a>
			);
		});
	}

	let colors: [string, string, string] | undefined;
	if (event.p && event.p.face) {
		colors = event.p.face.teamColors as [string, string, string];
	}

	return (
		<div className="card">
			<div
				className={classNames(
					"d-flex align-items-center",
					event.tids && event.tids.includes(userTid)
						? "table-info"
						: "card-header p-0",
				)}
				style={topStyle}
			>
				{teamName}
				<Badge type={event.type} />
			</div>
			<div className="d-flex">
				{event.p &&
				(event.p.imgURL !== "/img/blank-face.png" || event.p.face) ? (
					<div
						style={{
							maxHeight: 90,
							width: 60,
							marginTop: event.p.imgURL ? 0 : -10,
						}}
						className="flex-shrink-0"
					>
						<PlayerPicture
							face={event.p.face}
							imgURL={event.p.imgURL}
							colors={colors}
						/>
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
