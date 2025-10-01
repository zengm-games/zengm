import { helpers } from "../util/index.ts";

const RecordAndPlayoffs = ({
	abbrev,
	className,
	lost,
	option,
	roundsWonTextLower,
	season,
	tied,
	otl,
	tid,
	won,
}: {
	abbrev: string;
	className?: string;
	lost: number;
	option?: "noSeason";
	roundsWonTextLower?: string;
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
		roundsWonTextLower !== undefined && roundsWonTextLower !== "" ? (
			<span>
				,{" "}
				<a href={helpers.leagueUrl(["playoffs", season])}>
					{roundsWonTextLower}
				</a>
			</span>
		) : null;
	return (
		<span className={className}>
			{seasonText}
			{recordText}
			{extraText}
		</span>
	);
};

export default RecordAndPlayoffs;
