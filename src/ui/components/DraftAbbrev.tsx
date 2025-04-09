import { helpers, useLocal } from "../util";

type TeamOverride = {
	abbrev: string;
	imgURL?: string;
	imgURLSmall?: string;
};

// Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
// Supply t and originalT if you want historical abbrevs/logos to be accurate, otherwise current values will be used.
const DraftAbbrev = ({
	originalT,
	originalTid,
	t,
	tid,
	season,
}: {
	originalT?: TeamOverride;
	originalTid: number;
	t?: TeamOverride;
	tid: number;
	season?: number;
	children?: any;
}) => {
	const teamInfoCache = useLocal((state) => state.teamInfoCache);
	const abbrev = t?.abbrev ?? teamInfoCache[tid]?.abbrev;
	const originalAbbrev =
		originalT?.abbrev ?? teamInfoCache[originalTid]?.abbrev;
	const args1 =
		season === undefined
			? ["roster", `${abbrev}_${tid}`]
			: ["roster", `${abbrev}_${tid}`, season];

	if (abbrev === originalAbbrev) {
		return <a href={helpers.leagueUrl(args1)}>{abbrev}</a>;
	}

	const args2 =
		season === undefined
			? ["roster", `${originalAbbrev}_${originalTid}`]
			: ["roster", `${originalAbbrev}_${originalTid}`, season];
	return (
		<>
			<a href={helpers.leagueUrl(args1)}>{abbrev}</a> (from{" "}
			<a href={helpers.leagueUrl(args2)}>{originalAbbrev}</a>)
		</>
	);
};

export default DraftAbbrev;
