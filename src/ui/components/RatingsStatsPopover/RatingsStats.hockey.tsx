import type { RatingKey } from "../../../common/types.hockey.ts";
import { ratingsGradientStyle } from "./ratingsGradientStyle.ts";

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
					<span style={ratingsGradientStyle(ratings.hgt)}>
						Hgt: {ratings.hgt}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.stre)}>
						Str: {ratings.stre}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.spd)}>
						Spd: {ratings.spd}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.endu)}>
						End: {ratings.endu}
					</span>
				</div>
				<div className="col-4">
					<span style={ratingsGradientStyle(ratings.ovr)}>
						Ovr: {ratings.ovr}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.oiq)}>
						oIQ: {ratings.oiq}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.pss)}>
						Pss: {ratings.pss}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.wst)}>
						Wst: {ratings.wst}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.sst)}>
						Sst: {ratings.sst}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.stk)}>
						Stk: {ratings.stk}
					</span>
				</div>
				<div className="col-4">
					<span style={ratingsGradientStyle(ratings.pot)}>
						Pot: {Math.round(ratings.pot)}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.diq)}>
						dIQ: {ratings.diq}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.chk)}>
						Chk: {ratings.chk}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.blk)}>
						Blk: {ratings.blk}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.fcf)}>
						Fcf: {ratings.fcf}
					</span>
					<br />
					<span style={ratingsGradientStyle(ratings.glk)}>
						Glk: {ratings.glk}
					</span>
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
	if (stats && stats.keyStatsWithGoalieGP !== "") {
		statsBlock = (
			<div
				style={{
					whiteSpace: "normal",
				}}
			>
				<div className="fw-bold mb-1">{seasonPrefix2}Stats</div>
				{stats.keyStatsWithGoalieGP}
			</div>
		);
	} else {
		statsBlock = null;
	}

	return (
		<>
			{ratingsBlock}
			{statsBlock}
		</>
	);
};

export default RatingsStats;
