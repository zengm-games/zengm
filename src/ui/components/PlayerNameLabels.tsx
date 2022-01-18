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

	return (
		<span style={style}>
			{props.hasOwnProperty("jerseyNumber") ? (
				<span className="text-muted jersey-number-name">{jerseyNumber}</span>
			) : null}
			{typeof pos === "string" ? `${pos} ` : null}
			{pid !== undefined ? (
				<a href={helpers.leagueUrl(["player", pid])}>{children}</a>
			) : (
				children
			)}
			<InjuryIcon injury={injury} />
			<SkillsBlock skills={skills} />
			{pid !== undefined ? (
				<RatingsStatsPopover pid={pid} season={season} watch={watch} />
			) : null}
		</span>
	);
};

export default PlayerNameLabels;
