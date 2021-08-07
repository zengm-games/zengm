import PropTypes from "prop-types";
import type { ReactNode } from "react";
import RatingsStatsPopover from "./RatingsStatsPopover";
import SkillsBlock from "./SkillsBlock";
import { helpers } from "../util";
import type { PlayerInjury } from "../../common/types";
import InjuryIcon from "./InjuryIcon";

const PlayerNameLabels = (props: {
	children: ReactNode;
	disableWatchToggle?: boolean;
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
		disableWatchToggle,
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
				<RatingsStatsPopover
					disableWatchToggle={disableWatchToggle}
					pid={pid}
					season={season}
					watch={watch}
				/>
			) : null}
		</span>
	);
};

PlayerNameLabels.propTypes = {
	children: PropTypes.any,
	injury: PropTypes.shape({
		gamesRemaining: PropTypes.number.isRequired,
		type: PropTypes.string.isRequired,
	}),
	jerseyNumber: PropTypes.string,
	pos: PropTypes.string,
	pid: PropTypes.number,
	skills: PropTypes.arrayOf(PropTypes.string),
	style: PropTypes.object,
	watch: PropTypes.bool,
};

export default PlayerNameLabels;
