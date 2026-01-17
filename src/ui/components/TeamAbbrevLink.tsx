import { PLAYER } from "../../common/index.ts";
import { helpers } from "../util/index.ts";

type Props = {
	tid: number;
	abbrev: string;
	className?: string;
	season?: number;
};

const TeamAbbrevLink = ({ tid, abbrev, className, season }: Props) => {
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

export const wrappedTeamAbbrevLink = ({
	tid,
	abbrev,
	className,
	season,
}: Props) => {
	let text;
	if (!abbrev) {
		text = undefined;
	} else if (tid === PLAYER.DOES_NOT_EXIST) {
		text = "DNE";
	} else if (tid === PLAYER.TOT) {
		text = "TOT";
	} else if (tid < 0) {
		text = undefined;
	} else {
		text = abbrev;
	}

	return {
		value: (
			<TeamAbbrevLink
				tid={tid}
				abbrev={abbrev}
				className={className}
				season={season}
			/>
		),
		sortValue: text,
		searchValue: text,
	};
};
