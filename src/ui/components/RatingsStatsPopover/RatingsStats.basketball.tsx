import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";
import type { RatingKey } from "../../../common/types.basketball";

type Props = {
	ratings?: {
		pos: string;
		ovr: number;
		pot: number;
	} & Record<RatingKey, number>;
	stats: any;
	challengeNoRatings: boolean;
};

const RatingsStats = ({ challengeNoRatings, ratings, stats }: Props) => {
	let ratingsBlock;

	if (challengeNoRatings) {
		ratingsBlock = null;
	} else if (ratings) {
		ratingsBlock = (
			<div className="row mb-2">
				<div className="col-4">
					<b>Ratings</b>
					<br />
					<span className={helpers.colorRating(ratings.hgt)}>
						Hgt: {ratings.hgt}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.stre)}>
						Str: {ratings.stre}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.spd)}>
						Spd: {ratings.spd}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.jmp)}>
						Jmp: {ratings.jmp}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.endu)}>
						End: {ratings.endu}
					</span>
				</div>
				<div className="col-4">
					<span className={helpers.colorRating(ratings.ovr)}>
						Ovr: {ratings.ovr}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.ins)}>
						Ins: {ratings.ins}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.dnk)}>
						Dnk: {ratings.dnk}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.ft)}>
						Ft: {ratings.ft}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.fg)}>
						2Pt: {ratings.fg}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.tp)}>
						3Pt: {ratings.tp}
					</span>
				</div>
				<div className="col-4">
					<span className={helpers.colorRating(ratings.pot)}>
						Pot: {Math.round(ratings.pot)}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.oiq)}>
						oIQ: {ratings.oiq}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.diq)}>
						dIQ: {ratings.diq}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.drb)}>
						Drb: {ratings.drb}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.pss)}>
						Pss: {ratings.pss}
					</span>
					<br />
					<span className={helpers.colorRating(ratings.reb)}>
						Reb: {ratings.reb}
					</span>
				</div>
			</div>
		);
	} else {
		ratingsBlock = (
			<div className="row mb-2">
				<div className="col-12">
					<b>Ratings</b>
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
					<b>Stats</b>
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
					<b>Stats</b>
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
