import PropTypes from "prop-types";
import { gradientStyleFactory, helpers } from "../../util";
import type { RatingKey } from "../../../common/types.basketball";

const gradientStyle = gradientStyleFactory(25, 45, 55, 75);

type Props = {
	ratings?: {
		pos: string;
		ovr: number;
		pot: number;
	} & Record<RatingKey, number>;
	stats: any;
	type?: "career" | "current" | "draft" | number;
	challengeNoRatings: boolean;
};

const RatingsStats = ({ challengeNoRatings, ratings, stats, type }: Props) => {
	const seasonPrefix =
		typeof type === "number" ? `${type} ` : type === "career" ? "Peak " : "";
	const seasonPrefix2 =
		type === "career" || type === "draft" ? "Career " : seasonPrefix;

	let ratingsBlock;

	if (challengeNoRatings) {
		ratingsBlock = null;
	} else if (ratings) {
		ratingsBlock = (
			<div className="row mb-2">
				<div className="col-4">
					<b>{seasonPrefix}Ratings</b>
					<br />
					<span style={gradientStyle(ratings.hgt)}>Hgt: {ratings.hgt}</span>
					<br />
					<span style={gradientStyle(ratings.stre)}>Str: {ratings.stre}</span>
					<br />
					<span style={gradientStyle(ratings.spd)}>Spd: {ratings.spd}</span>
					<br />
					<span style={gradientStyle(ratings.jmp)}>Jmp: {ratings.jmp}</span>
					<br />
					<span style={gradientStyle(ratings.endu)}>End: {ratings.endu}</span>
				</div>
				<div className="col-4">
					<span style={gradientStyle(ratings.ovr)}>Ovr: {ratings.ovr}</span>
					<br />
					<span style={gradientStyle(ratings.ins)}>Ins: {ratings.ins}</span>
					<br />
					<span style={gradientStyle(ratings.dnk)}>Dnk: {ratings.dnk}</span>
					<br />
					<span style={gradientStyle(ratings.ft)}>Ft: {ratings.ft}</span>
					<br />
					<span style={gradientStyle(ratings.fg)}>2Pt: {ratings.fg}</span>
					<br />
					<span style={gradientStyle(ratings.tp)}>3Pt: {ratings.tp}</span>
				</div>
				<div className="col-4">
					<span style={gradientStyle(ratings.pot)}>
						Pot: {Math.round(ratings.pot)}
					</span>
					<br />
					<span style={gradientStyle(ratings.oiq)}>oIQ: {ratings.oiq}</span>
					<br />
					<span style={gradientStyle(ratings.diq)}>dIQ: {ratings.diq}</span>
					<br />
					<span style={gradientStyle(ratings.drb)}>Drb: {ratings.drb}</span>
					<br />
					<span style={gradientStyle(ratings.pss)}>Pss: {ratings.pss}</span>
					<br />
					<span style={gradientStyle(ratings.reb)}>Reb: {ratings.reb}</span>
				</div>
			</div>
		);
	} else {
		ratingsBlock = (
			<div className="row mb-2">
				<div className="col-12">
					<b>{seasonPrefix}Ratings</b>
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
				</div>
			</div>
		);
	}

	let statsBlock;

	if (stats) {
		statsBlock = (
			<div className="row">
				<div className="col-4">
					<b>{seasonPrefix2}Stats</b>
					<br />
					PTS: {helpers.roundStat(stats.pts, "pts")}
					<br />
					TRB: {helpers.roundStat(stats.trb, "trb")}
					<br />
					AST: {helpers.roundStat(stats.ast, "ast")}
					<br />
					FG: {helpers.roundStat(stats.fgp, "fgp")}%
					<br />
					TS: {helpers.roundStat(stats.tsp, "tsp")}%
				</div>
				<div className="col-4">
					<br />
					BLK: {helpers.roundStat(stats.blk, "blk")}
					<br />
					STL: {helpers.roundStat(stats.stl, "stl")}
					<br />
					TO: {helpers.roundStat(stats.tov, "tov")}
					<br />
					3P: {helpers.roundStat(stats.tpp, "tpp")}%
					<br />
					3PAr: {helpers.roundStat(stats.tpar, "tpar")}
				</div>
				<div className="col-4">
					<br />
					MP: {helpers.roundStat(stats.min, "min")}
					<br />
					PER: {helpers.roundStat(stats.per, "per")}
					<br />
					EWA: {helpers.roundStat(stats.ewa, "ewa")}
					<br />
					FT: {helpers.roundStat(stats.ftp, "ftp")}%
					<br />
					FTr: {helpers.roundStat(stats.ftr, "ftr")}
				</div>
			</div>
		);
	} else {
		statsBlock = (
			<div className="row mt-2">
				<div className="col-12">
					<b>{seasonPrefix2}Stats</b>
					<br />
					<br />
					<br />
					<br />
				</div>
			</div>
		);
	}

	return (
		<>
			{ratingsBlock}
			{statsBlock}
		</>
	);
};

RatingsStats.propTypes = {
	ratings: PropTypes.object,
	stats: PropTypes.object,
};

export default RatingsStats;
