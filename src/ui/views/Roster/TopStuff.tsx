import PropTypes from "prop-types";
import React, { useState, CSSProperties } from "react";
import { RecordAndPlayoffs, RosterComposition } from "../../components";
import { helpers } from "../../util";
import InstructionsAndSortButtons from "./InstructionsAndSortButtons";
import type { View } from "../../../common/types";

const fontSizeLarger = { fontSize: "larger" };

const TeamRating = ({
	ovr,
	ovrCurrent,
}: {
	ovr: number;
	ovrCurrent: number;
}) => {
	const [showCurrent, setShowCurrent] = useState(true);

	if (ovr === ovrCurrent) {
		// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
		return <>{`${ovr}/100`}</>;
	}

	const title = showCurrent
		? "Current rating, including injuries"
		: "Rating when healthy";
	const rating = showCurrent ? ovrCurrent : ovr;
	const className = showCurrent ? "text-danger" : undefined;

	return (
		<>
			<a
				className="cursor-pointer"
				title={title}
				onClick={() => setShowCurrent(!showCurrent)}
			>
				<span className={className}>{rating}</span>/100
			</a>
		</>
	);
};

TeamRating.propTypes = {
	ovr: PropTypes.number.isRequired,
	ovrCurrent: PropTypes.number.isRequired,
};

const TopStuff = ({
	abbrev,
	budget,
	challengeNoRatings,
	currentSeason,
	editable,
	numConfs,
	numPlayoffRounds,
	openRosterSpots,
	payroll,
	players,
	profit,
	salaryCap,
	season,
	showTradeFor,
	t,
	tid,
}: Pick<
	View<"roster">,
	| "abbrev"
	| "budget"
	| "challengeNoRatings"
	| "currentSeason"
	| "editable"
	| "numConfs"
	| "numPlayoffRounds"
	| "payroll"
	| "players"
	| "salaryCap"
	| "season"
	| "showTradeFor"
	| "t"
	| "tid"
> & {
	openRosterSpots: number;
	profit: number;
}) => {
	const logoStyle: CSSProperties = {
		margin: "0.25rem 1rem 0 0",
	};
	if (t.seasonAttrs.imgURL) {
		logoStyle.display = "inline";
		logoStyle.backgroundImage = `url('${t.seasonAttrs.imgURL}')`;
	}

	const recordAndPlayoffs =
		t.seasonAttrs !== undefined ? (
			<>
				Record:{" "}
				<RecordAndPlayoffs
					abbrev={abbrev}
					season={season}
					won={t.seasonAttrs.won}
					lost={t.seasonAttrs.lost}
					tied={t.seasonAttrs.tied}
					playoffRoundsWon={t.seasonAttrs.playoffRoundsWon}
					option="noSeason"
					numConfs={numConfs}
					numPlayoffRounds={numPlayoffRounds}
					tid={tid}
				/>
			</>
		) : (
			"Season not found"
		);

	let marginOfVictory: string;
	if (process.env.SPORT === "football") {
		if (t.stats.gp !== 0) {
			marginOfVictory = ((t.stats.pts - t.stats.oppPts) / t.stats.gp).toFixed(
				1,
			);
		} else {
			marginOfVictory = "0.0";
		}
	} else {
		marginOfVictory = (t.stats.pts - t.stats.oppPts).toFixed(1);
	}

	return (
		<>
			{t.name !== t.seasonAttrs.name || t.region !== t.seasonAttrs.region ? (
				<h3>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</h3>
			) : null}
			<div className="d-flex mb-3">
				<div className="team-picture" style={logoStyle} />
				<div>
					<div>
						<span style={fontSizeLarger}>{recordAndPlayoffs}</span>
						<br />
						{!challengeNoRatings ? (
							<>
								Team rating:{" "}
								<TeamRating ovr={t.ovr} ovrCurrent={t.ovrCurrent} />
								<br />
							</>
						) : null}
						<span title="Average margin of victory">Average MOV</span>:{" "}
						{marginOfVictory}
					</div>

					{season === currentSeason || process.env.SPORT === "football" ? (
						<div className="d-flex mt-3">
							{season === currentSeason ? (
								<div>
									{openRosterSpots} open roster spots
									<br />
									Payroll: {helpers.formatCurrency(payroll || 0, "M")}
									<br />
									Salary cap: {helpers.formatCurrency(salaryCap, "M")}
									<br />
									{budget ? (
										<>
											Profit: {helpers.formatCurrency(profit, "M")}
											<br />
										</>
									) : null}
									{showTradeFor ? `Strategy: ${t.strategy}` : null}
								</div>
							) : null}
							{process.env.SPORT === "football" ? (
								<RosterComposition className="ml-3" players={players} />
							) : null}
						</div>
					) : null}
				</div>
			</div>
			<InstructionsAndSortButtons editable={editable} />
			{season !== currentSeason ? (
				<p>
					Players in the Hall of Fame are{" "}
					<span className="text-danger">highlighted in red</span>.
				</p>
			) : null}
		</>
	);
};

TopStuff.propTypes = {
	abbrev: PropTypes.string.isRequired,
	budget: PropTypes.bool.isRequired,
	currentSeason: PropTypes.number.isRequired,
	editable: PropTypes.bool.isRequired,
	numConfs: PropTypes.number.isRequired,
	numPlayoffRounds: PropTypes.number.isRequired,
	openRosterSpots: PropTypes.number.isRequired,
	payroll: PropTypes.number,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	profit: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	showTradeFor: PropTypes.bool.isRequired,
	t: PropTypes.object.isRequired,
	tid: PropTypes.number.isRequired,
};

export default TopStuff;
