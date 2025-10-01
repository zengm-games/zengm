import { useState, type CSSProperties } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import {
	RecordAndPlayoffs,
	RosterComposition,
	PlusMinus,
} from "../../components/index.tsx";
import { helpers, toWorker } from "../../util/index.ts";
import InstructionsAndSortButtons from "./InstructionsAndSortButtons.tsx";
import PlayThroughInjurySliders from "./PlayThroughInjuriesSliders.tsx";
import type { View } from "../../../common/types.ts";
import { bySport } from "../../../common/index.ts";
import Note from "../Player/Note.tsx";

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
		return `${ovr}/100`;
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

const PayrollAndPenalties = ({
	isCurrentSeason,
	luxuryPayroll,
	luxuryTaxAmount,
	minPayroll,
	minPayrollAmount,
	payroll,
}: {
	isCurrentSeason: boolean;
} & Pick<
	View<"roster">,
	| "luxuryPayroll"
	| "luxuryTaxAmount"
	| "minPayroll"
	| "minPayrollAmount"
	| "payroll"
>) => {
	const payrollString = helpers.formatCurrency(payroll ?? 0, "M");

	if (luxuryTaxAmount === undefined || minPayrollAmount === undefined) {
		return payrollString;
	}

	if (luxuryTaxAmount === 0 && minPayrollAmount === 0) {
		return payrollString;
	}

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover>
					<Popover.Body>
						{isCurrentSeason ? (
							<>
								{luxuryTaxAmount > 0 ? (
									<p>
										Payroll is over the luxury tax limit of{" "}
										{helpers.formatCurrency(luxuryPayroll, "M")}. Projected
										penalty:{" "}
										<span className="text-danger">
											{helpers.formatCurrency(luxuryTaxAmount, "M")}
										</span>
									</p>
								) : null}
								{minPayrollAmount > 0 ? (
									<p>
										Payroll is under the minimum payroll limit of{" "}
										{helpers.formatCurrency(minPayroll, "M")}. Projected
										penalty:{" "}
										<span className="text-danger">
											{helpers.formatCurrency(minPayrollAmount, "M")}
										</span>
									</p>
								) : null}
							</>
						) : (
							<>
								{luxuryTaxAmount > 0 ? (
									<p>
										Luxury tax paid:{" "}
										<span className="text-danger">
											{helpers.formatCurrency(luxuryTaxAmount, "M")}
										</span>
									</p>
								) : null}
								{minPayrollAmount > 0 ? (
									<p>
										Minimum payroll tax paid:{" "}
										<span className="text-danger">
											{helpers.formatCurrency(minPayrollAmount, "M")}
										</span>
									</p>
								) : null}
							</>
						)}
					</Popover.Body>
				</Popover>
			}
			rootClose
		>
			<button
				className="btn btn-link p-0 border-0 text-danger"
				style={{
					// Without this, alignment is a bit off compared to the text version
					verticalAlign: "baseline",
				}}
			>
				{payrollString}
			</button>
		</OverlayTrigger>
	);
};

const TopStuff = ({
	abbrev,
	budget,
	challengeNoRatings,
	currentSeason,
	editable,
	godMode,
	luxuryPayroll,
	luxuryTaxAmount,
	minPayroll,
	minPayrollAmount,
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
	userTid,
}: Pick<
	View<"roster">,
	| "abbrev"
	| "budget"
	| "challengeNoRatings"
	| "currentSeason"
	| "editable"
	| "godMode"
	| "luxuryPayroll"
	| "luxuryTaxAmount"
	| "minPayroll"
	| "minPayrollAmount"
	| "payroll"
	| "players"
	| "salaryCap"
	| "salaryCapType"
	| "season"
	| "showTradeFor"
	| "showTradingBlock"
	| "t"
	| "tid"
	| "userTid"
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
					roundsWonText={t.roundsWonText}
					option="noSeason"
					tid={tid}
				/>
			</>
		) : (
			"Season not found"
		);

	let marginOfVictory = 0;
	if (
		bySport({
			baseball: true,
			basketball: false,
			football: true,
			hockey: true,
		})
	) {
		if (t.stats.gp !== 0) {
			marginOfVictory = (t.stats.pts - t.stats.oppPts) / t.stats.gp;
		}
	} else {
		marginOfVictory = t.stats.pts - t.stats.oppPts;
	}

	const isCurrentSeason = season === currentSeason;

	return (
		<>
			{t.name !== t.seasonAttrs.name || t.region !== t.seasonAttrs.region ? (
				<h3>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</h3>
			) : null}
			<div
				className="d-flex flex-wrap mb-3"
				style={{
					gap: "1rem 6rem",
				}}
			>
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
							: {t.seasonAttrs.avgAge?.toFixed(1)}
						</div>

						{isCurrentSeason ? (
							<div className="mt-3">{openRosterSpots} open roster spots</div>
						) : null}
						{payroll !== undefined ? (
							<div>
								{isCurrentSeason ? "Payroll" : "End of season payroll"}:{" "}
								<PayrollAndPenalties
									isCurrentSeason={isCurrentSeason}
									luxuryPayroll={luxuryPayroll}
									luxuryTaxAmount={luxuryTaxAmount}
									minPayroll={minPayroll}
									minPayrollAmount={minPayrollAmount}
									payroll={payroll}
								/>
							</div>
						) : null}
						{isCurrentSeason && salaryCapType !== "none" ? (
							<div>Salary cap: {helpers.formatCurrency(salaryCap, "M")}</div>
						) : null}
						{isCurrentSeason && budget ? (
							<div>Profit: {helpers.formatCurrency(profit, "M")}</div>
						) : null}
						{isCurrentSeason && showTradeFor ? (
							<div>Strategy: {t.strategy}</div>
						) : null}
					</div>
				</div>
				<div
					className="d-flex flex-wrap"
					style={{
						gap: "1rem 3rem",
					}}
				>
					{isCurrentSeason ? (
						<>
							<div className="d-flex flex-column gap-3">
								<RosterComposition players={players} />
								{godMode && tid !== userTid ? (
									<button
										className="btn btn-god-mode"
										onClick={async () => {
											await toWorker("main", "takeControlTeam", tid);
										}}
									>
										Take control of this team
									</button>
								) : null}
							</div>
							{showTradingBlock ? (
								<div>
									<PlayThroughInjurySliders key={tid} t={t} />
								</div>
							) : null}
						</>
					) : null}
				</div>
			</div>
			<InstructionsAndSortButtons
				keepRosterSorted={t.keepRosterSorted}
				editable={editable}
				tid={tid}
			/>

			<div className="mb-3">
				<Note
					key={JSON.stringify([tid, season])}
					note={t.seasonAttrs.note}
					info={{
						type: "teamSeason",
						tid,
						season,
					}}
				/>
			</div>

			{editable ? (
				<div className="mb-3">
					Click or drag row handles to move players between the starting lineup{" "}
					<span className="table-info legend-square" /> and the bench{" "}
					<span className="table-secondary legend-square" />.
				</div>
			) : season !== currentSeason ? (
				<div className="mb-3">
					Players still on this team are{" "}
					<span className="text-info">highlighted in blue</span>. Players in the
					Hall of Fame are{" "}
					<span className="text-danger">highlighted in red</span>.
				</div>
			) : null}
		</>
	);
};

export default TopStuff;
