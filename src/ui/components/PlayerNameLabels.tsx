import type { ReactNode } from "react";
import RatingsStatsPopover from "./RatingsStatsPopover";
import SkillsBlock from "./SkillsBlock";
import { helpers } from "../util";
import type { PlayerInjury } from "../../common/types";
import InjuryIcon from "./InjuryIcon";

const PlayerNameLabels = (props: {
	children: ReactNode;
	jerseyNumber?: string;
	injury?: PlayerInjury & {
		playingThrough?: boolean;
	};
	pos?: string;
	pid?: number;

	// season is passed to RatingsStatsPopover only, where it's used to determine whether to show a historical season's data
	season?: number;

	skills?: string[];
	style?: {
		[key: string]: string;
	};
	watch?: boolean;
	xsName?: string;
}) => {
	const {
		children,
		injury,
		jerseyNumber,
		pid,
		pos,
		season,
		skills,
		style,
		watch,
	} = props;
	let xsName = props.xsName;

	// See if we need to truncate skills
	let numSkillsBeforeTruncate;
	if (window.mobile && xsName && skills) {
		// Skills are about twice as wide as normal letters
		const injuryLength = injury && injury.gamesRemaining > 0 ? 3 : 0;
		const totalLength = xsName.length + injuryLength + skills.length * 2;

		const targetLength = 20;

		if (totalLength > targetLength) {
			numSkillsBeforeTruncate = Math.max(
				0,
				Math.floor((targetLength - 2 - injuryLength - xsName.length) / 2),
			);
		}

		if (numSkillsBeforeTruncate === 0) {
			xsName = xsName.slice(0, targetLength - 4 - injuryLength) + "...";
		}
	}

	const name = xsName ? (
		<>
			<span className="d-inline-block d-sm-none">{xsName}</span>
			<span className="d-none d-sm-inline">{children}</span>
		</>
	) : (
		children
	);

	return (
		<span style={style}>
			{props.hasOwnProperty("jerseyNumber") ? (
				<span className="text-muted jersey-number-name d-none d-sm-inline-block">
					{jerseyNumber}
				</span>
			) : null}
			{typeof pos === "string" ? `${pos} ` : null}
			{pid !== undefined ? (
				<a href={helpers.leagueUrl(["player", pid])}>{name}</a>
			) : (
				name
			)}
			<InjuryIcon injury={injury} />
			<SkillsBlock
				skills={skills}
				numSkillsBeforeTruncate={numSkillsBeforeTruncate}
			/>
			{pid !== undefined ? (
				<RatingsStatsPopover pid={pid} season={season} watch={watch} />
			) : null}
		</span>
	);
};

export default PlayerNameLabels;
