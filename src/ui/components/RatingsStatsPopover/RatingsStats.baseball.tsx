import { gradientStyleFactory } from "../../util";
import type { RatingKey } from "../../../common/types.baseball";

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
					<span style={gradientStyle(ratings.hgt)}>
						<span title="Height">Hgt:</span> {ratings.hgt}
					</span>
					<br />
					<span style={gradientStyle(ratings.spd)}>
						<span title="Speed">Spd:</span> {ratings.spd}
					</span>
					<br />
					<span style={gradientStyle(ratings.hpw)}>
						<span title="Power">HPw:</span> {ratings.hpw}
					</span>
					<br />
					<span style={gradientStyle(ratings.con)}>
						<span title="Contact">Con:</span> {ratings.con}
					</span>
					<br />
					<span style={gradientStyle(ratings.eye)}>
						<span title="Eye">Eye:</span> {ratings.eye}
					</span>
				</div>
				<div className="col-4">
					<span style={gradientStyle(ratings.ovr)}>
						<span title="Overall">Ovr:</span> {ratings.ovr}
					</span>
					<br />
					<span style={gradientStyle(ratings.gnd)}>
						<span title="Ground Ball Fielding">Gnd:</span> {ratings.gnd}
					</span>
					<br />
					<span style={gradientStyle(ratings.fly)}>
						<span title="Fly Ball Fielding">Fly:</span> {ratings.fly}
					</span>
					<br />
					<span style={gradientStyle(ratings.thr)}>
						<span title="Throwing">Thr:</span> {ratings.thr}
					</span>
					<br />
					<span style={gradientStyle(ratings.cat)}>
						<span title="Catcher Defense">Cat:</span> {ratings.cat}
					</span>
				</div>
				<div className="col-4">
					<span style={gradientStyle(ratings.pot)}>
						<span title="Potential">Pot:</span> {Math.round(ratings.pot)}
					</span>
					<br />
					<span style={gradientStyle(ratings.ppw)}>
						<span title="Pitching Power">PPw:</span> {ratings.ppw}
					</span>
					<br />
					<span style={gradientStyle(ratings.ctl)}>
						<span title="Control">Ctl:</span> {ratings.ctl}
					</span>
					<br />
					<span style={gradientStyle(ratings.mov)}>
						<span title="Movement">Mov:</span> {ratings.mov}
					</span>
					<br />
					<span style={gradientStyle(ratings.endu)}>
						<span title="Endurance">Endu:</span> {ratings.endu}
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
	if (stats && stats.keyStats !== "") {
		statsBlock = (
			<div
				style={{
					whiteSpace: "normal",
				}}
			>
				<div className="fw-bold mb-1">{seasonPrefix2}Stats</div>
				{stats.keyStats}
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
