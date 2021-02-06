import PropTypes from "prop-types";
import { helpers, useLocal } from "../util"; // Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.

const DraftAbbrev = ({
	originalTid,
	tid,
	season,
}: {
	originalTid: number;
	tid: number;
	season?: number;
	children?: any;
}) => {
	const teamInfoCache = useLocal(state => state.teamInfoCache);
	const abbrev = teamInfoCache[tid]?.abbrev;
	const originalAbbrev = teamInfoCache[originalTid]?.abbrev;
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

DraftAbbrev.propTypes = {
	originalTid: PropTypes.number.isRequired,
	season: PropTypes.number,
	tid: PropTypes.number.isRequired,
};

export default DraftAbbrev;
