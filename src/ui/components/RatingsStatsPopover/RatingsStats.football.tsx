import { Fragment } from "react";
import posRatings from "../../../common/posRatings.football";
import { getCols, gradientStyleFactory } from "../../util";
import type { RatingKey } from "../../../common/types.football";

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
		const extraRatings = posRatings(ratings.pos);
		const cols = getCols(extraRatings.map(rating => `rating:${rating}`));
		ratingsBlock = (
			<div className="row">
				<div className="col-4">
					<div className="fw-bold mb-1">{seasonPrefix}Ratings</div>
					<span style={gradientStyle(ratings.ovr)}>
						<span title="Overall">Ovr</span>: {ratings.ovr}
					</span>
					<br />
					<span style={gradientStyle(ratings.pot)}>
						<span title="Potential">Pot</span>: {Math.round(ratings.pot)}
					</span>
				</div>
				<div className="col-4 mt-1">
					<br />
					<span style={gradientStyle(ratings.hgt)}>
						<span title="Height">Hgt</span>: {ratings.hgt}
					</span>
					<br />
					<span style={gradientStyle(ratings.stre)}>
						<span title="Strength">Str</span>: {ratings.stre}
					</span>
					<br />
					<span style={gradientStyle(ratings.spd)}>
						<span title="Speed">Spd</span>: {ratings.spd}
					</span>
					<br />
					<span style={gradientStyle(ratings.endu)}>
						<span title="Endurance">End</span>: {ratings.endu}
					</span>
				</div>
				<div className="col-4 mt-1">
					{extraRatings.map((rating, i) => (
						<Fragment key={rating}>
							<br />
							<span style={gradientStyle(ratings[rating])}>
								<span title={cols[i].desc}>{cols[i].title}</span>:{" "}
								{ratings[rating]}
							</span>
						</Fragment>
					))}
				</div>
			</div>
		);
	} else {
		ratingsBlock = (
			<div className="row">
				<div className="col-12">
					<b>{seasonPrefix}Ratings</b>
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
