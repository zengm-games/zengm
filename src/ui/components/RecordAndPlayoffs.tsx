import { helpers } from "../util";

const RecordAndPlayoffs = ({
	abbrev,
	boldChamps,
	lost,
	playoffsByConf,
	numPlayoffRounds,
	option,
	playoffRoundsWon,
	season,
	tied,
	otl,
	tid,
	won,
}: {
	abbrev: string;
	lost: number;
	option?: "noSeason";
	season: number;
	tied?: number;
	otl?: number;
	tid: number;
	won: number;
} & (
	| {
			boldChamps?: boolean;
			numPlayoffRounds: number;
			playoffRoundsWon: number;
			playoffsByConf: boolean;
	  }
	| {
			boldChamps?: void;
			numPlayoffRounds?: void;
			playoffRoundsWon?: void;
			playoffsByConf?: void;
	  }
)) => {
	const seasonText =
		option !== "noSeason" ? (
			<span>
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}>
					{season}
				</a>
				:{" "}
			</span>
		) : null;

	const record = helpers.formatRecord({
		won,
		lost,
		otl,
		tied,
	});

	const recordText = (
		<a href={helpers.leagueUrl(["standings", season])}>{record}</a>
	);
	const extraText =
		playoffsByConf !== undefined &&
		numPlayoffRounds !== undefined &&
		playoffRoundsWon !== undefined &&
		playoffRoundsWon >= 0 ? (
			<span>
				,{" "}
				<a href={helpers.leagueUrl(["playoffs", season])}>
					{helpers
						.roundsWonText(playoffRoundsWon, numPlayoffRounds, playoffsByConf)
						.toLowerCase()}
				</a>
			</span>
		) : null;
	return (
		<span
			className={
				boldChamps && playoffRoundsWon === numPlayoffRounds
					? "fw-bold"
					: undefined
			}
		>
			{seasonText}
			{recordText}
			{extraText}
		</span>
	);
};

export default RecordAndPlayoffs;
