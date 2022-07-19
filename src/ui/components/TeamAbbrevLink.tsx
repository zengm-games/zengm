import { PLAYER } from "../../common";
import { helpers } from "../util";

const TeamAbbrev = ({
	tid,
	abbrev,
	className,
	season,
}: {
	tid: number;
	abbrev: string;
	className?: string;
	season?: number;
}) => {
	if (!abbrev) {
		return null;
	}

	if (tid === PLAYER.DOES_NOT_EXIST) {
		return (
			<span className={className} title="Does Not Exist">
				DNE
			</span>
		);
	}

	if (tid === PLAYER.TOT) {
		return (
			<span
				className={className}
				title={season !== undefined ? `Total for ${season}` : "Total"}
			>
				TOT
			</span>
		);
	}

	let leagueUrlParam: Parameters<typeof helpers.leagueUrl>[0];

	if (tid === PLAYER.FREE_AGENT) {
		leagueUrlParam = ["free_agents"];
	} else if (tid === PLAYER.UNDRAFTED) {
		leagueUrlParam = ["draft_scouting"];
	} else if (tid < 0) {
		// Weird or retired
		return null;
	} else {
		leagueUrlParam = ["roster", `${abbrev}_${tid}`, season];
	}

	return (
		<a className={className} href={helpers.leagueUrl(leagueUrlParam)}>
			{abbrev}
		</a>
	);
};

export default TeamAbbrev;
