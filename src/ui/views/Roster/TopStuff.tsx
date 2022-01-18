import { useState, CSSProperties } from "react";
import {
	RecordAndPlayoffs,
	RosterComposition,
	PlusMinus,
} from "../../components";
import { helpers } from "../../util";
import InstructionsAndSortButtons from "./InstructionsAndSortButtons";
import PlayThroughInjurySliders from "./PlayThroughInjuriesSliders";
import type { View } from "../../../common/types";
import { isSport } from "../../../common";

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

const TopStuff = ({
	abbrev,
	budget,
	challengeNoRatings,
	currentSeason,
	editable,
	godMode,
	numConfs,
	numPlayoffRounds,
	openRosterSpots,
	payroll,
	players,
	profit,
	salaryCap,
	salaryCapType,
	season,
	showTradeFor,
	showTradingBlock,
	t,
	tid,
}: Pick<
	View<"roster">,
	| "abbrev"
	| "budget"
	| "challengeNoRatings"
	| "currentSeason"
	| "editable"
	| "godMode"
	| "numConfs"
	| "numPlayoffRounds"
	| "payroll"
	| "players"
	| "salaryCap"
	| "salaryCapType"
	| "season"
	| "showTradeFor"
	| "showTradingBlock"
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
					otl={t.seasonAttrs.otl}
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

	let marginOfVictory = 0;
	if (isSport("football") || isSport("hockey")) {
		if (t.stats.gp !== 0) {
			marginOfVictory = (t.stats.pts - t.stats.oppPts) / t.stats.gp;
		}
	} else {
		marginOfVictory = t.stats.pts - t.stats.oppPts;
	}

	return (
		<>
			{t.name !== t.seasonAttrs.name || t.region !== t.seasonAttrs.region ? (
				<h3>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</h3>
			) : null}
			<div className="d-sm-flex mb-3">
				<div className="d-flex">
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
							<PlusMinus>{marginOfVictory}</PlusMinus>
							<br />
							<span title="Average age, weighted by minutes played">
								Average age
							</span>
							: {t.seasonAttrs.avgAge!.toFixed(1)}
						</div>

						{season === currentSeason ? (
							<div className="mt-3">
								{openRosterSpots} open roster spots
								<br />
								Payroll: {helpers.formatCurrency(payroll || 0, "M")}
								<br />
								{salaryCapType !== "none" ? (
									<>
										Salary cap: {helpers.formatCurrency(salaryCap, "M")}
										<br />
									</>
								) : null}
								{budget ? (
									<>
										Profit: {helpers.formatCurrency(profit, "M")}
										<br />
									</>
								) : null}
								{showTradeFor ? `Strategy: ${t.strategy}` : null}
							</div>
						) : null}
					</div>
				</div>
				<div className="d-md-flex">
					{season === currentSeason ? (
						<div className="ms-sm-5 mt-3 mt-sm-0">
							<RosterComposition players={players} />
						</div>
					) : null}
					{showTradingBlock ? (
						<div className="ms-sm-5 mt-3 mt-md-0">
							<PlayThroughInjurySliders key={tid} t={t} />
						</div>
					) : null}
				</div>
			</div>
			<InstructionsAndSortButtons
				keepRosterSorted={t.keepRosterSorted}
				editable={editable}
				godMode={godMode}
				players={players}
				tid={tid}
			/>
			{season !== currentSeason ? (
				<p>
					Players still on this team are{" "}
					<span className="text-info">highlighted in blue</span>. Players in the
					Hall of Fame are{" "}
					<span className="text-danger">highlighted in red</span>.
				</p>
			) : null}
		</>
	);
};

export default TopStuff;
