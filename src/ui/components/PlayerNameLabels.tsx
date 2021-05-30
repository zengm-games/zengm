import PropTypes from "prop-types";
import type { ReactNode } from "react";
import RatingsStatsPopover from "./RatingsStatsPopover";
import SkillsBlock from "./SkillsBlock";
import { helpers } from "../util";
import type { PlayerInjury } from "../../common/types";
import { timeBetweenGames } from "../../common";

const PlayerNameLabels = (props: {
	children: ReactNode;
	disableWatchToggle?: boolean;
	jerseyNumber?: string;
	injury?: PlayerInjury & {
		playingThrough?: boolean;
	};
	pos?: string;
	pid?: number;
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
		skills,
		style,
		watch,
	} = props;

	let injuryIcon: ReactNode = null;

	if (injury !== undefined) {
		const colorClass = injury.playingThrough ? "warning" : "danger";

		if (injury.gamesRemaining === -1) {
			// This is used in box scores, where it would be confusing to display "out X more days" in old box scores
			injuryIcon = (
				<span
					className={`badge badge-${colorClass} badge-injury`}
					title={injury.type}
				>
					+
				</span>
			);
		} else if (injury.gamesRemaining > 0 || injury.type !== "Healthy") {
			let title = `${injury.type}, out ${
				injury.gamesRemaining
			} more ${timeBetweenGames(injury.gamesRemaining)}`;
			if (injury.playingThrough) {
				title += ", played through injury";
			}
			injuryIcon = (
				<span
					className={`badge badge-${colorClass} badge-injury`}
					title={title}
				>
					{injury.gamesRemaining}
				</span>
			);
		}
	}

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
			{injuryIcon}
			<SkillsBlock skills={skills} />
			{pid !== undefined ? (
				<RatingsStatsPopover
					disableWatchToggle={disableWatchToggle}
					pid={pid}
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
