import { helpers } from "../util";

const RecordAndPlayoffs = ({
	abbrev,
	boldChamps,
	lost,
	numConfs,
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
	boldChamps?: boolean;
	lost: number;
	numConfs?: number;
	numPlayoffRounds?: number;
	option?: "noSeason";
	playoffRoundsWon?: number;
	season: number;
	tied?: number;
	otl?: number;
	tid: number;
	won: number;
}) => {
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
		numConfs !== undefined &&
		numPlayoffRounds !== undefined &&
		playoffRoundsWon !== undefined &&
		playoffRoundsWon >= 0 ? (
			<span>
				,{" "}
				<a href={helpers.leagueUrl(["playoffs", season])}>
					{helpers
						.roundsWonText(playoffRoundsWon, numPlayoffRounds, numConfs)
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
