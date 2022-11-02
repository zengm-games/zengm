import { useId } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
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
	const tooltipId = useId();

	if (injury === undefined) {
		return null;
	}

	const colorClass = injury.playingThrough ? "warning" : "danger";

	let info;
	if (injury.gamesRemaining === -1) {
		// This is used in box scores, where it would be confusing to display "out X more days" in old box scores
		info = {
			title: injury.type,
			text: "+",
		};
	} else if (injury.gamesRemaining > 0 || injury.type !== "Healthy") {
		let title = `${injury.type}, out ${
			injury.gamesRemaining
		} more ${timeBetweenGames(injury.gamesRemaining)}`;
		if (injury.playingThrough) {
			title += ", played through injury";
		}

		info = {
			title,
			text: injury.gamesRemaining,
		};
	}

	if (info) {
		return (
			<OverlayTrigger
				trigger={["hover", "focus", "click"]}
				overlay={<Tooltip id={tooltipId}>{info.title}</Tooltip>}
			>
				<span className={`badge bg-${colorClass} badge-injury ${className}`}>
					{info.text}
				</span>
			</OverlayTrigger>
		);
	}

	return null;
};

export default InjuryIcon;
