import {
	type ChangeEvent,
	type FormEvent,
	Fragment,
	useEffect,
	useState,
} from "react";
import { BarGraph, DataTable, HelpPopover, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, logEvent, toWorker, useLocalPartial } from "../util";
import type { View } from "../../common/types";
import { getAdjustedTicketPrice, PHASE } from "../../common";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import type { DataTableRow } from "../components/DataTable";
import { MAX_LEVEL } from "../../common/budgetLevels";

const paddingLeft85 = { paddingLeft: 85 };

const formatTicketPrice = (ticketPrice: number) => {
	// Never show just one decimal place, because it's cents
	if (!Number.isInteger(ticketPrice) && Number.isInteger(ticketPrice * 10)) {
		return ticketPrice.toFixed(2);
	}
	return String(ticketPrice);
};

const FinancesForm = ({
	autoTicketPrice,
	challengeNoRatings,
	gameSimInProgress,
	noSeasonData,
	phase,
	spectator,
	t,
	tid,
	userTid,
}: Pick<
	View<"teamFinances">,
	| "autoTicketPrice"
	| "challengeNoRatings"
	| "spectator"
	| "phase"
	| "t"
	| "tid"
	| "userTid"
> & {
	gameSimInProgress: boolean;
	noSeasonData: boolean;
}) => {
	const [state, setState] = useState({
		dirty: false,
		saving: false,
		coaching: String(t.budget.coaching),
		facilities: String(t.budget.facilities),
		health: String(t.budget.health),
		scouting: String(t.budget.scouting),
		ticketPrice: formatTicketPrice(t.budget.ticketPrice),
		adjustForInflation: t.adjustForInflation,
		autoTicketPrice: t.autoTicketPrice,
	});

	useEffect(() => {
		if (!state.dirty) {
			setState(state2 => ({
				...state2,
				coaching: String(t.budget.coaching),
				facilities: String(t.budget.facilities),
				health: String(t.budget.health),
				scouting: String(t.budget.scouting),
				ticketPrice: formatTicketPrice(t.budget.ticketPrice),
				adjustForInflation: t.adjustForInflation,
				autoTicketPrice: t.autoTicketPrice,
			}));
		}
	}, [state.dirty, t]);

	const setStateValue = (
		name: Exclude<keyof typeof state, "dirty" | "saving">,
		value: any,
	) => {
		setState(state2 => ({
			...state2,
			dirty: true,
			[name]: value,
		}));
	};

	const handleChange =
		(name: Exclude<keyof typeof state, "dirty" | "saving">) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			if (name === "adjustForInflation" || name === "autoTicketPrice") {
				setStateValue(name, event.target.checked);
			} else {
				setStateValue(name, event.target.value);
			}
		};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setState(state2 => ({ ...state2, saving: true }));

		const budgetAmounts = {
			// Convert from [millions of dollars] to [thousands of dollars] rounded to the nearest $10k
			coaching: helpers.bound(
				Math.round(parseFloat(state.coaching)),
				1,
				MAX_LEVEL,
			),
			facilities: helpers.bound(
				Math.round(parseFloat(state.facilities)),
				1,
				MAX_LEVEL,
			),
			health: helpers.bound(Math.round(parseFloat(state.health)), 1, MAX_LEVEL),
			scouting: helpers.bound(
				Math.round(parseFloat(state.scouting)),
				1,
				MAX_LEVEL,
			),

			// Already in [dollars]
			ticketPrice: helpers.bound(
				parseFloat(parseFloat(state.ticketPrice).toFixed(2)),
				0,
				Infinity,
			),
		};

		await toWorker("main", "updateBudget", {
			budgetLevels: budgetAmounts,
			adjustForInflation: state.adjustForInflation || state.autoTicketPrice,
			autoTicketPrice: state.autoTicketPrice,
		});

		logEvent({
			type: "success",
			text: "Saved team finance settings.",
			saveToDb: false,
		});

		setState(state2 => ({
			...state2,
			dirty: false,
			saving: false,
		}));
	};

	const warningMessage =
		gameSimInProgress && tid === userTid && !spectator ? (
			<div className="text-danger mb-2">Stop game simulation to edit.</div>
		) : null;

	const formDisabled = gameSimInProgress || tid !== userTid || spectator;

	const expenseCategories: {
		key: "scouting" | "coaching" | "health" | "facilities";
		title: string;
	}[] = [
		{
			key: "scouting",
			title: "Scouting",
		},
		{
			key: "coaching",
			title: "Coaching",
		},
		{
			key: "health",
			title: "Health",
		},
		{
			key: "facilities",
			title: "Facilities",
		},
	];

	return (
		<form onSubmit={handleSubmit} className="mb-3">
			{warningMessage}
			<h3>
				Expense Levels{" "}
				<HelpPopover title="Expense Levels">
					<p>Scouting: Controls the accuracy of displayed player ratings.</p>
					<p>Coaching: Better coaches mean better player development.</p>
					<p>Health: A good team of doctors speeds recovery from injuries.</p>
					<p>
						Facilities: Better training facilities make your players happier and
						other players envious; stadium renovations increase attendance.
					</p>
				</HelpPopover>
			</h3>
			<p>
				Click the ? above to see what exactly each category does. Effects are
				based on your average level over the past three seasons.
			</p>
			<div className="d-flex flex-column gap-2">
				{expenseCategories.map(expenseCategory => {
					const value = state[expenseCategory.key];
					const valueInt = parseInt(state[expenseCategory.key]);
					return (
						<div className="d-flex" key={expenseCategory.key}>
							<div className="finances-settings-label">
								{expenseCategory.title}
							</div>
							<div
								className="input-group"
								style={{
									width: 120,
								}}
							>
								<input
									type="text"
									className="form-control"
									disabled={formDisabled || challengeNoRatings}
									onChange={handleChange(expenseCategory.key)}
									value={value}
								/>
								<button
									className="btn btn-secondary"
									type="button"
									disabled={
										formDisabled || Number.isNaN(valueInt) || valueInt >= 100
									}
									onClick={() => {
										setStateValue(expenseCategory.key, valueInt + 1);
									}}
								>
									+
								</button>
								<button
									className="btn btn-secondary"
									type="button"
									disabled={
										formDisabled || Number.isNaN(valueInt) || valueInt <= 1
									}
									onClick={() => {
										setStateValue(expenseCategory.key, valueInt - 1);
									}}
								>
									−
								</button>
							</div>
							<div className="finances-settings-text-small">
								Current spending rate: ???
								<br />
								{noSeasonData || phase === PHASE.PRESEASON ? (
									<br />
								) : (
									`Spent this season: ???`
								)}
							</div>
						</div>
					);
				})}
			</div>
			<h3 className="mt-3">
				Ticket Price{" "}
				<HelpPopover title="Revenue Settings">
					Set your ticket price too high, and attendance will decrease and some
					fans will resent you for it. Set it too low, and you're not maximizing
					your profit.
				</HelpPopover>
			</h3>
			<div className="d-flex">
				<div
					className="input-group"
					style={{
						width: 115,
					}}
				>
					<div className="input-group-text">$</div>
					{state.autoTicketPrice ? (
						<input
							type="text"
							className="form-control"
							disabled
							value={formatTicketPrice(autoTicketPrice)}
						/>
					) : (
						<input
							type="text"
							className="form-control"
							disabled={formDisabled || state.autoTicketPrice}
							onChange={handleChange("ticketPrice")}
							value={state.ticketPrice}
						/>
					)}
				</div>
				<div className="finances-settings-text">Leaguewide rank: ???</div>
			</div>
			{phase === PHASE.PLAYOFFS ? (
				<div className="mb-1 text-warning" style={paddingLeft85}>
					Playoffs price:{" "}
					{helpers.formatCurrency(
						getAdjustedTicketPrice(
							state.autoTicketPrice
								? autoTicketPrice
								: parseFloat(state.ticketPrice),
							true,
						),
					)}
				</div>
			) : null}
			<div className="mt-1 d-flex">
				<div className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("autoTicketPrice")}
							type="checkbox"
							checked={state.autoTicketPrice}
							disabled={formDisabled}
						/>
						Auto ticket price
					</label>
					<HelpPopover title="Auto ticket price" className="ms-1">
						<p>
							When enabled, your ticket price will be set to the maximum value
							possible while still selling out most games.
						</p>
						<p>
							In the playoffs, ticket prices automatically adjust to account for
							increased demand. That happens regardless of the "auto ticket
							price" setting.
						</p>
					</HelpPopover>
				</div>
				<div className="form-check ms-4">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={handleChange("adjustForInflation")}
							type="checkbox"
							checked={state.adjustForInflation || state.autoTicketPrice}
							disabled={formDisabled || state.autoTicketPrice}
						/>
						Auto adjust for inflation
					</label>
					<HelpPopover title="Inflation adjustment" className="ms-1">
						When enabled, your ticket price will automatically change whenever
						the salary cap changes.
					</HelpPopover>
				</div>
			</div>
			{tid === userTid && !spectator ? (
				<div className="mt-5" style={paddingLeft85}>
					<button
						className="btn btn-large btn-primary"
						disabled={formDisabled || state.saving}
						type="submit"
					>
						Save Expense Levels
						<br />
						and Ticket Price
					</button>
				</div>
			) : null}
		</form>
	);
};

const PayrollInfo = ({
	luxuryPayroll,
	luxuryTax,
	minContract,
	minPayroll,
	payroll,
	salaryCap,
	salaryCapType,
}: Pick<
	View<"teamFinances">,
	| "luxuryPayroll"
	| "luxuryTax"
	| "minContract"
	| "minPayroll"
	| "payroll"
	| "salaryCap"
	| "salaryCapType"
>) => {
	const parts = [
		<>
			{payroll > minPayroll ? "above" : "below"} the minimum payroll limit (
			<b>{helpers.formatCurrency(minPayroll, "M")}</b>)
		</>,
	];

	if (salaryCapType !== "none") {
		parts.push(
			<>
				{payroll > salaryCap ? "above" : "below"} the salary cap (
				<b>{helpers.formatCurrency(salaryCap, "M")}</b>)
			</>,
		);
	}

	if (salaryCapType !== "hard") {
		parts.push(
			<>
				{payroll > luxuryPayroll ? "above" : "below"} the luxury tax limit (
				<b>{helpers.formatCurrency(luxuryPayroll, "M")}</b>)
			</>,
		);
	}

	return (
		<p>
			The current payroll (<b>{helpers.formatCurrency(payroll, "M")}</b>) is{" "}
			{parts.length <= 2 ? (
				<>
					{parts[0]} and {parts[1]}
				</>
			) : (
				<>
					{parts.slice(0, -1).map((part, i) => (
						<Fragment key={i}>{part}, </Fragment>
					))}
					and {parts.at(-1)}
				</>
			)}
			.{" "}
			{salaryCapType === "hard" ? (
				<HelpPopover title="Payroll Limits">
					<p>
						The salary cap is a hard cap, meaning that you cannot exceed it,
						even when re-signing your own players or making trades. The only
						exception is that you can always sign players to minimum contracts (
						{helpers.formatCurrency(minContract, "M")}/year), so you are never
						stuck with a team too small to play.
					</p>
					<p>
						Teams with payrolls below the minimum payroll limit will be assessed
						a fine equal to the difference at the end of the season.
					</p>
				</HelpPopover>
			) : salaryCapType === "soft" ? (
				<HelpPopover title="Payroll Limits">
					<p>
						The salary cap is a soft cap, meaning that you can exceed it to
						re-sign your own players, to sign free agents to minimum contracts (
						{helpers.formatCurrency(minContract, "M")}/year), and when making
						certain trades; however, you cannot exceed the salary cap to sign a
						free agent for more than the minimum.
					</p>
					<p>
						Teams with payrolls below the minimum payroll limit will be assessed
						a fine equal to the difference at the end of the season. Teams with
						payrolls above the luxury tax limit will be assessed a fine equal to{" "}
						{luxuryTax} times the difference at the end of the season.
					</p>
				</HelpPopover>
			) : (
				<HelpPopover title="Payroll Limits">
					<p>
						There is no salary cap, but the minimum payroll and luxury tax
						limits still apply.
					</p>
					<p>
						Teams with payrolls below the minimum payroll limit will be assessed
						a fine equal to the difference at the end of the season. Teams with
						payrolls above the luxury tax limit will be assessed a fine equal to{" "}
						{luxuryTax} times the difference at the end of the season.
					</p>
				</HelpPopover>
			)}
		</p>
	);
};

const highlightZeroNegative = (amount: number) => {
	const formattedValue = helpers.formatCurrency(amount, "M");

	if (amount === 0) {
		return { classNames: "text-body-secondary", value: formattedValue };
	}
	if (amount < 0) {
		return { classNames: "text-danger", value: formattedValue };
	}

	return formattedValue;
};

const TeamFinances = ({
	abbrev,
	autoTicketPrice,
	barData,
	budget,
	challengeNoRatings,
	contractTotals,
	contracts,
	luxuryPayroll,
	luxuryTax,
	maxStadiumCapacity,
	minContract,
	minPayroll,
	numGames,
	spectator,
	payroll,
	phase,
	salariesSeasons,
	salaryCap,
	salaryCapType,
	show,
	t,
	tid,
	userTid,
}: View<"teamFinances">) => {
	useTitleBar({
		title: "Team Finances",
		dropdownView: "team_finances",
		dropdownFields: { teams: abbrev, shows: show },
	});

	const { gameSimInProgress } = useLocalPartial(["gameSimInProgress"]);

	const cols = getCols(["Pos", "Name"]).concat(
		salariesSeasons.map(season => {
			return {
				title: String(season),
				sortSequence: ["desc", "asc"],
				sortType: "currency",
			};
		}),
	);

	const rows = contracts.map((p, i) => {
		const data: DataTableRow["data"] = [
			p.pos,
			wrappedPlayerNameLabels({
				injury: p.injury,
				jerseyNumber: p.jerseyNumber,
				pid: p.pid,
				skills: p.skills,
				style: { fontStyle: p.released ? "italic" : "normal" },
				watch: p.watch,
				firstName: p.firstName,
				firstNameShort: p.firstNameShort,
				lastName: p.lastName,
			}),
		];

		// Loop through the salaries for the next five years for this player.
		for (let j = 0; j < salariesSeasons.length; j++) {
			if (p.amounts[j]) {
				const formattedAmount = helpers.formatCurrency(p.amounts[j], "M");

				if (p.released) {
					data.push(<i>{formattedAmount}</i>);
				} else {
					data.push(formattedAmount);
				}
			} else {
				data.push(null);
			}
		}

		return {
			key: i, // Can't be pid because a player will appear twice if he is cut and re-signed
			data,
		};
	});

	const footer = [
		["", "Totals"].concat(
			// @ts-expect-error
			contractTotals.map(amount => highlightZeroNegative(amount)),
		),
		salaryCapType === "none"
			? ["", "Under Luxury Tax"].concat(
					// @ts-expect-error
					contractTotals.map(amount =>
						highlightZeroNegative(luxuryPayroll - amount),
					),
			  )
			: ["", "Free Cap Space"].concat(
					// @ts-expect-error
					contractTotals.map(amount =>
						highlightZeroNegative(salaryCap - amount),
					),
			  ),
	];

	// This happens for expansion teams before they have a TeamSeason
	const noSeasonData = barData.length === 0;

	type Row = (typeof barData)[number];
	const classNameOverride = (row: Row) =>
		row.champ ? "bar-graph-3" : undefined;
	const champSuffix = (row: Row) => (row.champ ? ", won championship" : "");

	return (
		<>
			<MoreLinks type="team" page="team_finances" abbrev={abbrev} tid={tid} />

			<PayrollInfo
				luxuryPayroll={luxuryPayroll}
				luxuryTax={luxuryTax}
				minContract={minContract}
				minPayroll={minPayroll}
				payroll={payroll}
				salaryCap={salaryCap}
				salaryCapType={salaryCapType}
			/>

			{budget ? null : (
				<p className="text-danger">
					The budget is disabled in this league, so most of the information
					usually shown here is hidden. You can change the budget setting in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			)}

			<div className="row">
				<div className="col-md-3 col-sm-2">
					<h3>Wins</h3>
					<div className="bar-graph-small">
						<BarGraph
							data={barData}
							y={["won"]}
							tooltip={row => `${row.season}: ${row.won}${champSuffix(row)}`}
							ylim={[0, numGames]}
							classNameOverride={classNameOverride}
						/>
					</div>
					<br />
					<br />
					<h3>
						Hype{" "}
						<HelpPopover title="Hype">
							"Hype" refers to fans' interest in your team. If your team is
							winning or improving, then hype increases; if your team is losing
							or stagnating, then hype decreases. Hype influences attendance,
							various revenue sources such as merchandising, and the attitude
							players have towards your organization.
						</HelpPopover>
					</h3>
					<div id="bar-graph-hype" className="bar-graph-small">
						<BarGraph
							data={barData}
							y={["hype"]}
							tooltip={row =>
								`${row.season}: ${row.hype.toFixed(2)}${champSuffix(row)}`
							}
							ylim={[0, 1]}
							classNameOverride={classNameOverride}
						/>
					</div>
					<br />
					<br />
					<h3>Region Population</h3>
					<div id="bar-graph-pop" className="bar-graph-small">
						<BarGraph
							data={barData}
							y={["pop"]}
							tooltip={row =>
								`${row.season}: ${row.pop.toFixed(1)}M${champSuffix(row)}`
							}
							ylim={[0, 20]}
							classNameOverride={classNameOverride}
						/>
					</div>
					<br />
					<br />
					<h3>Average Attendance</h3>
					<div id="bar-graph-att" className="bar-graph-small">
						<BarGraph
							data={barData}
							y={["att"]}
							tooltip={row =>
								`${row.season}: ${helpers.numberWithCommas(
									Math.round(row.att),
								)}${champSuffix(row)}`
							}
							ylim={[0, maxStadiumCapacity]}
							classNameOverride={classNameOverride}
						/>
					</div>
				</div>
				{budget && !noSeasonData ? (
					<div className="col-lg-4 col-md-3 col-sm-3 mb-3">
						<h3>Revenue</h3>
						<div id="bar-graph-revenue" className="bar-graph-large">
							<BarGraph
								data={barData}
								y={[
									"revenuesNationalTv",
									"revenuesLocalTv",
									"revenuesTicket",
									"revenuesSponsor",
									"revenuesMerch",
									"revenuesLuxuryTaxShare",
								]}
								tooltip={(row, y) => {
									const text = {
										revenuesNationalTv: "national TV revenue",
										revenuesLocalTv: "local TV revenue",
										revenuesTicket: "ticket revenue",
										revenuesSponsor: "corporate sponsorship revenue",
										revenuesMerch: "merchandising revenue",
										revenuesLuxuryTaxShare: "luxury tax share revenue",
									};

									return `${row.season} ${text[y]}: ${helpers.formatCurrency(
										row[y] / 1000,
										"M",
										1,
									)}`;
								}}
							/>
						</div>
						<br />
						<br />
						<h3>Expenses</h3>
						<div id="bar-graph-expenses" className="bar-graph-large">
							<BarGraph
								data={barData}
								y={[
									"expensesSalary",
									"expensesMinTax",
									"expensesLuxuryTax",
									"expensesScouting",
									"expensesCoaching",
									"expensesHealth",
									"expensesFacilities",
								]}
								tooltip={(row, y) => {
									const text = {
										expensesSalary: "player salaries",
										expensesMinTax: "minimum payroll tax",
										expensesLuxuryTax: "luxury tax",
										expensesScouting: "scouting",
										expensesCoaching: "coaching",
										expensesHealth: "health",
										expensesFacilities: "facilities",
									};

									return `${row.season} ${text[y]}: ${helpers.formatCurrency(
										row[y] / 1000,
										"M",
										1,
									)}`;
								}}
							/>
						</div>
						<br />
						<br />
						<h3>Cash (cumulative)</h3>
						<div id="bar-graph-cash" className="bar-graph-medium">
							<BarGraph
								data={barData}
								y={["cash"]}
								tooltip={row =>
									`${row.season}: ${helpers.formatCurrency(
										row.cash,
										"M",
										1,
									)}${champSuffix(row)}`
								}
								classNameOverride={classNameOverride}
							/>
						</div>
					</div>
				) : null}
				{budget ? (
					<div className="col-lg-5 col-md-6 col-sm-7">
						<FinancesForm
							autoTicketPrice={autoTicketPrice}
							challengeNoRatings={challengeNoRatings}
							gameSimInProgress={gameSimInProgress}
							noSeasonData={noSeasonData}
							spectator={spectator}
							phase={phase}
							t={t}
							tid={tid}
							userTid={userTid}
						/>
					</div>
				) : null}
			</div>

			<h2>Player Salaries</h2>

			<p>
				You can release players from{" "}
				<a href={helpers.leagueUrl(["roster"])}>your roster</a>. Released
				players who are still owed money are <i>shown in italics</i>.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[2, "desc"]}
				name="TeamFinances"
				nonfluid
				footer={footer}
				rows={rows}
			/>
		</>
	);
};

export default TeamFinances;
