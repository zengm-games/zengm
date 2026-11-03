import { helpers } from "../util/helpers.ts";

export const RecordAndPlayoffs = (
	props: {
		className?: string;
		lost: number;
		noLinks?: boolean;
		roundsWonText?: string;
		season: number;
		tied?: number;
		otl?: number;
		won: number;
	} & (
		| {
				// abbrev and tid are for the link to the roster page for this season
				abbrev: string;
				option?: undefined;
				tid: number;
		  }
		| {
				option: "noSeason";
		  }
	),
) => {
	const { className, lost, noLinks, roundsWonText, season, tied, otl, won } =
		props;

	const seasonText =
		props.option !== "noSeason" ? (
			<span>
				{noLinks ? (
					season
				) : (
					<a
						href={helpers.leagueUrl([
							"roster",
							`${props.abbrev}_${props.tid}`,
							season,
						])}
					>
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
