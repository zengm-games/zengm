import { timeBetweenGames } from "../../common";
import type { PlayerInjury } from "../../common/types";

const InjuryIcon = ({
	className = "",
	injury,
}: {
	className?: string;
	injury?: PlayerInjury & {
		playingThrough?: boolean;
	};
}) => {
	if (injury === undefined) {
		return null;
	}

	const colorClass = injury.playingThrough ? "warning" : "danger";

	if (injury.gamesRemaining === -1) {
		// This is used in box scores, where it would be confusing to display "out X more days" in old box scores
		return (
			<span
				className={`badge badge-${colorClass} badge-injury ${className}`}
				title={injury.type}
			>
				+
			</span>
		);
	}

	if (injury.gamesRemaining > 0 || injury.type !== "Healthy") {
		let title = `${injury.type}, out ${
			injury.gamesRemaining
		} more ${timeBetweenGames(injury.gamesRemaining)}`;
		if (injury.playingThrough) {
			title += ", played through injury";
		}

		return (
			<span
				className={`badge badge-${colorClass} badge-injury ${className}`}
				title={title}
			>
				{injury.gamesRemaining}
			</span>
		);
	}

	return null;
};

export default InjuryIcon;
