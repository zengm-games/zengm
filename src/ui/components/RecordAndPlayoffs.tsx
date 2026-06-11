import { helpers } from "../util/helpers.ts";

export const RecordAndPlayoffs = ({
	abbrev,
	className,
	lost,
	noLinks,
	option,
	roundsWonText,
	season,
	tied,
	otl,
	tid,
	won,
}: {
	abbrev: string;
	className?: string;
	lost: number;
	noLinks?: boolean;
	option?: "noSeason";
	roundsWonText?: string;
	season: number;
	tied?: number;
	otl?: number;
	tid: number;
	won: number;
}) => {
	const seasonText =
		option !== "noSeason" ? (
			<span>
				{noLinks ? (
					season
				) : (
					<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}>
						{season}
					</a>
				)}
				:{" "}
			</span>
		) : null;

	const record = helpers.formatRecord({
		won,
		lost,
		otl,
		tied,
	});

	const recordText = noLinks ? (
		record
	) : (
		<a href={helpers.leagueUrl(["standings", season])}>{record}</a>
	);
	const extraText =
		roundsWonText !== undefined && roundsWonText !== "" ? (
			<span>
				,{" "}
				{noLinks ? (
					roundsWonText
				) : (
					<a href={helpers.leagueUrl(["playoffs", season])}>{roundsWonText}</a>
				)}
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
