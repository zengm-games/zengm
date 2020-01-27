import PropTypes from "prop-types";
import React, { ChangeEvent, FormEvent, ReactNode } from "react";
import {
	BarGraph,
	DataTable,
	HelpPopover,
	PlayerNameLabels,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, logEvent, toWorker } from "../util";
import { View } from "../../common/types";

type FinancesFormProps = {
	gamesInProgress: boolean;
	t: any;
	tid: number;
	userTid: number;
};

type FinancesFormState = {
	dirty: boolean;
	coaching: string;
	facilities: string;
	health: string;
	saving: boolean;
	scouting: string;
	ticketPrice: string;
};

type HandleChanges = {
	coaching: (event: ChangeEvent<HTMLInputElement>) => void;
	facilities: (event: ChangeEvent<HTMLInputElement>) => void;
	health: (event: ChangeEvent<HTMLInputElement>) => void;
	scouting: (event: ChangeEvent<HTMLInputElement>) => void;
	ticketPrice: (event: ChangeEvent<HTMLInputElement>) => void;
};

class FinancesForm extends React.Component<
	FinancesFormProps,
	FinancesFormState
> {
	handleChanges: HandleChanges;

	constructor(props: FinancesFormProps) {
		super(props);
		this.state = {
			dirty: false,
			coaching: String(props.t.budget.coaching.amount),
			facilities: String(props.t.budget.facilities.amount),
			health: String(props.t.budget.health.amount),
			saving: false,
			scouting: String(props.t.budget.scouting.amount),
			ticketPrice: String(props.t.budget.ticketPrice.amount),
		};
		this.handleChanges = {
			coaching: this.handleChange.bind(this, "coaching"),
			facilities: this.handleChange.bind(this, "facilities"),
			health: this.handleChange.bind(this, "health"),
			scouting: this.handleChange.bind(this, "scouting"),
			ticketPrice: this.handleChange.bind(this, "ticketPrice"),
		};
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	static getDerivedStateFromProps(
		nextProps: FinancesFormProps,
		prevState: FinancesFormState,
	) {
		if (!prevState.dirty) {
			return {
				coaching: nextProps.t.budget.coaching.amount,
				facilities: nextProps.t.budget.facilities.amount,
				health: nextProps.t.budget.health.amount,
				scouting: nextProps.t.budget.scouting.amount,
				ticketPrice: nextProps.t.budget.ticketPrice.amount,
			};
		}

		return null;
	}

	handleChange(name: keyof HandleChanges, e: ChangeEvent<HTMLInputElement>) {
		// @ts-ignore
		this.setState({
			dirty: true,
			[name]: e.target.value,
		});
	}

	async handleSubmit(e: FormEvent) {
		e.preventDefault();

		this.setState({ saving: true });

		const budgetAmounts = {
			// Convert from [millions of dollars] to [thousands of dollars] rounded to the nearest $10k
			coaching: helpers.bound(
				Math.round(parseFloat(this.state.coaching) * 100) * 10,
				0,
				Infinity,
			),
			facilities: helpers.bound(
				Math.round(parseFloat(this.state.facilities) * 100) * 10,
				0,
				Infinity,
			),
			health: helpers.bound(
				Math.round(parseFloat(this.state.health) * 100) * 10,
				0,
				Infinity,
			),
			scouting: helpers.bound(
				Math.round(parseFloat(this.state.scouting) * 100) * 10,
				0,
				Infinity,
			),

			// Already in [dollars]
			ticketPrice: helpers.bound(
				parseFloat(parseFloat(this.state.ticketPrice).toFixed(2)),
				0,
				Infinity,
			),
		};

		await toWorker("updateBudget", budgetAmounts);

		logEvent({
			type: "success",
			text: "Team finances updated.",
			saveToDb: false,
		});

		this.setState({
			dirty: false,
			saving: false,
		});
	}

	render() {
		const { gamesInProgress, t, tid, userTid } = this.props;

		const warningMessage = (
			<p className="text-danger">
				{gamesInProgress && tid === userTid
					? "Stop game simulation to edit."
					: null}
			</p>
		);

		const formDisabled = gamesInProgress || tid !== userTid;

		return (
			<form onSubmit={this.handleSubmit} className="mb-3">
				<h3>
					Revenue Settings{" "}
					<HelpPopover placement="bottom" title="Revenue Settings">
						Set your ticket price too high, and attendance will decrease and
						some fans will resent you for it. Set it too low, and you're not
						maximizing your profit.
					</HelpPopover>
				</h3>
				{warningMessage}
				<div className="row">
					<div className="float-left finances-settings-label">Ticket Price</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							disabled={formDisabled}
							onChange={this.handleChanges.ticketPrice}
							value={this.state.ticketPrice}
						/>
					</div>
					<div className="float-left finances-settings-text">
						Leaguewide rank: #{t.budget.ticketPrice.rank}
					</div>
				</div>
				<p />
				<h3>
					Expense Settings{" "}
					<HelpPopover placement="bottom" title="Expense Settings">
						<p>Scouting: Controls the accuracy of displayed player ratings.</p>
						<p>Coaching: Better coaches mean better player development.</p>
						<p>Health: A good team of doctors speeds recovery from injuries.</p>
						<p>
							Facilities: Better training facilities make your players happier
							and other players envious; stadium renovations increase
							attendance.
						</p>
					</HelpPopover>
				</h3>
				{warningMessage}
				<div className="row">
					<div className="float-left finances-settings-label">Scouting</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							disabled={formDisabled}
							onChange={this.handleChanges.scouting}
							value={this.state.scouting}
						/>
						<div className="input-group-append">
							<div className="input-group-text">M</div>
						</div>
					</div>
					<div className="float-left finances-settings-text-small">
						Current rate: #{t.budget.scouting.rank}
						<br />
						Spent this season: #{t.seasonAttrs.expenses.scouting.rank}
					</div>
				</div>
				<div className="row">
					<div className="float-left finances-settings-label">Coaching</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							disabled={formDisabled}
							onChange={this.handleChanges.coaching}
							value={this.state.coaching}
						/>
						<div className="input-group-append">
							<div className="input-group-text">M</div>
						</div>
					</div>
					<div className="float-left finances-settings-text-small">
						Current spending rate: #{t.budget.coaching.rank}
						<br />
						Spent this season: #{t.seasonAttrs.expenses.coaching.rank}
					</div>
				</div>
				<div className="row">
					<div className="float-left finances-settings-label">Health</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							disabled={formDisabled}
							onChange={this.handleChanges.health}
							value={this.state.health}
						/>
						<div className="input-group-append">
							<div className="input-group-text">M</div>
						</div>
					</div>
					<div className="float-left finances-settings-text-small">
						Current spending rate: #{t.budget.health.rank}
						<br />
						Spent this season: #{t.seasonAttrs.expenses.health.rank}
					</div>
				</div>
				<div className="row">
					<div className="float-left finances-settings-label">Facilities</div>
					<div className="input-group input-group-sm float-left finances-settings-field">
						<div className="input-group-prepend">
							<div className="input-group-text">$</div>
						</div>
						<input
							type="text"
							className="form-control"
							disabled={formDisabled}
							onChange={this.handleChanges.facilities}
							value={this.state.facilities}
						/>
						<div className="input-group-append">
							<div className="input-group-text">M</div>
						</div>
					</div>
					<div className="float-left finances-settings-text-small">
						Current spending rate: #{t.budget.facilities.rank}
						<br />
						Spent this season: #{t.seasonAttrs.expenses.facilities.rank}
					</div>
				</div>
				<br />
				{tid === userTid ? (
					<div className="row">
						<div className="float-left finances-settings-label">&nbsp;</div>
						<div className="input-group input-group-sm float-left finances-settings-field">
							<button
								className="btn btn-large btn-primary"
								disabled={formDisabled || this.state.saving}
								style={{ lineHeight: "1.5em" }}
							>
								Save Revenue and Expense Settings
							</button>
						</div>
					</div>
				) : null}
			</form>
		);
	}
}

// @ts-ignore
FinancesForm.propTypes = {
	gamesInProgress: PropTypes.bool.isRequired,
	t: PropTypes.object.isRequired,
	tid: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

const PayrollInfo = ({
	hardCap,
	luxuryPayroll,
	luxuryTax,
	minContract,
	minPayroll,
	payroll,
	salaryCap,
}: Pick<
	View<"teamFinances">,
	| "hardCap"
	| "luxuryPayroll"
	| "luxuryTax"
	| "minContract"
	| "minPayroll"
	| "payroll"
	| "salaryCap"
>) => {
	return (
		<p>
			The current payroll (<b>{helpers.formatCurrency(payroll, "M")}</b>) is{" "}
			{payroll > minPayroll ? "above" : "below"} the minimum payroll limit (
			<b>{helpers.formatCurrency(minPayroll, "M")}</b>){hardCap ? " and" : ","}{" "}
			{payroll > salaryCap ? "above" : "below"} the salary cap (
			<b>{helpers.formatCurrency(salaryCap, "M")}</b>)
			{hardCap ? null : (
				<>
					, and {payroll > luxuryPayroll ? "above" : "below"} the luxury tax
					limit (<b>{helpers.formatCurrency(luxuryPayroll, "M")}</b>)
				</>
			)}
			.{" "}
			{hardCap ? (
				<HelpPopover placement="bottom" title="Payroll Limits">
					<p>
						The salary cap is a hard cap, meaning that you cannot exceed it,
						even when re-signing your own players or making trades. The only
						exception is that you can always sign players to minimum contracts
						($
						{minContract}
						k/year), so you are never stuck with a team too small to play.
					</p>
					<p>
						Teams with payrolls below the minimum payroll limit will be assessed
						a fine equal to the difference at the end of the season.
					</p>
				</HelpPopover>
			) : (
				<HelpPopover placement="bottom" title="Payroll Limits">
					<p>
						The salary cap is a soft cap, meaning that you can exceed it to
						re-sign your own players, to sign free agents to minimum contracts
						($
						{minContract}
						k/year), and when making certain trades; however, you cannot exceed
						the salary cap to sign a free agent for more than the minimum.
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
PayrollInfo.propTypes = {
	hardCap: PropTypes.bool.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	minPayroll: PropTypes.number.isRequired,
	payroll: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
};

const highlightZeroNegative = (amount: number) => {
	const formattedValue = helpers.formatCurrency(amount, "M");

	if (amount === 0) {
		return { classNames: "text-muted", value: formattedValue };
	}
	if (amount < 0) {
		return { classNames: "text-danger", value: formattedValue };
	}

	return formattedValue;
};

const TeamFinances = ({
	abbrev,
	barData,
	barSeasons,
	budget,
	contractTotals,
	contracts,
	gamesInProgress,
	hardCap,
	luxuryPayroll,
	luxuryTax,
	maxStadiumCapacity,
	minContract,
	minPayroll,
	numGames,
	payroll,
	salariesSeasons,
	salaryCap,
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

	const cols = getCols("Name").concat(
		salariesSeasons.map(season => {
			return {
				title: String(season),
				sortSequence: ["desc", "asc"],
				sortType: "currency",
			};
		}),
	);

	const rows = contracts.map((p, i) => {
		const data: ReactNode[] = [
			<PlayerNameLabels
				injury={p.injury}
				pid={p.pid}
				pos={p.pos}
				skills={p.skills}
				style={{ fontStyle: p.released ? "italic" : "normal" }}
				watch={p.watch}
			>
				{p.firstName} {p.lastName}
			</PlayerNameLabels>,
		];

		// Loop through the salaries for the next five years for this player.
		for (let j = 0; j < 5; j++) {
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
		["Totals"].concat(
			// @ts-ignore
			contractTotals.map(amount => highlightZeroNegative(amount)),
		),
		["Free Cap Space"].concat(
			// @ts-ignore
			contractTotals.map(amount => highlightZeroNegative(salaryCap - amount)),
		),
	];

	return (
		<>
			<p>
				More:{" "}
				{process.env.SPORT === "football" ? (
					<>
						<a href={helpers.leagueUrl(["depth", abbrev])}>Depth Chart</a> |{" "}
					</>
				) : null}
				<a href={helpers.leagueUrl(["roster", abbrev])}>Roster</a> |{" "}
				<a href={helpers.leagueUrl(["game_log", abbrev])}>Game Log</a> |{" "}
				<a href={helpers.leagueUrl(["team_history", abbrev])}>History</a> |{" "}
				<a href={helpers.leagueUrl(["transactions", abbrev])}>Transactions</a>
			</p>

			<PayrollInfo
				hardCap={hardCap}
				luxuryPayroll={luxuryPayroll}
				luxuryTax={luxuryTax}
				minContract={minContract}
				minPayroll={minPayroll}
				payroll={payroll}
				salaryCap={salaryCap}
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
							data={barData.won}
							labels={barSeasons}
							ylim={[0, numGames]}
						/>
					</div>
					<br />
					<br />
					<h3>
						Hype{" "}
						<HelpPopover placement="right" title="Hype">
							"Hype" refers to fans' interest in your team. If your team is
							winning or improving, then hype increases; if your team is losing
							or stagnating, then hype decreases. Hype influences attendance,
							various revenue sources such as merchandising, and the attitude
							players have towards your organization.
						</HelpPopover>
					</h3>
					<div id="bar-graph-hype" className="bar-graph-small">
						<BarGraph
							data={barData.hype}
							labels={barSeasons}
							tooltipCb={val =>
								typeof val === "number" ? val.toFixed(2) : val
							}
							ylim={[0, 1]}
						/>
					</div>
					<br />
					<br />
					<h3>Region Population</h3>
					<div id="bar-graph-pop" className="bar-graph-small">
						<BarGraph
							data={barData.pop}
							labels={barSeasons}
							tooltipCb={val =>
								typeof val === "number" ? `${val.toFixed(1)}M` : val
							}
							ylim={[0, 20]}
						/>
					</div>
					<br />
					<br />
					<h3>Average Attendance</h3>
					<div id="bar-graph-att" className="bar-graph-small">
						<BarGraph
							data={barData.att}
							labels={barSeasons}
							tooltipCb={val =>
								typeof val === "number"
									? helpers.numberWithCommas(Math.round(val))
									: val
							}
							ylim={[0, maxStadiumCapacity]}
						/>
					</div>
				</div>
				{budget ? (
					<div className="col-lg-4 col-md-3 col-sm-3 mb-3">
						<h3>Revenue</h3>
						<div id="bar-graph-revenue" className="bar-graph-large">
							<BarGraph
								data={[
									barData.revenues.nationalTv,
									barData.revenues.localTv,
									barData.revenues.ticket,
									barData.revenues.sponsor,
									barData.revenues.merch,
									barData.revenues.luxuryTaxShare,
								]}
								labels={[
									barSeasons,
									[
										"national TV revenue",
										"local TV revenue",
										"ticket revenue",
										"corporate sponsorship revenue",
										"merchandising revenue",
										"luxury tax share revenue",
									],
								]}
								tooltipCb={val =>
									typeof val === "number"
										? helpers.formatCurrency(val / 1000, "M", 1)
										: val
								}
							/>
						</div>
						<br />
						<br />
						<h3>Expenses</h3>
						<div id="bar-graph-expenses" className="bar-graph-large">
							<BarGraph
								data={[
									barData.expenses.salary,
									barData.expenses.minTax,
									barData.expenses.luxuryTax,
									barData.expenses.scouting,
									barData.expenses.coaching,
									barData.expenses.health,
									barData.expenses.facilities,
								]}
								labels={[
									barSeasons,
									[
										"player salaries",
										"minimum payroll tax",
										"luxury tax",
										"scouting",
										"coaching",
										"health",
										"facilities",
									],
								]}
								tooltipCb={val =>
									typeof val === "number"
										? helpers.formatCurrency(val / 1000, "M", 1)
										: val
								}
							/>
						</div>
						<br />
						<br />
						<h3>Cash (cumulative)</h3>
						<div id="bar-graph-cash" className="bar-graph-medium">
							<BarGraph
								data={barData.cash}
								labels={barSeasons}
								tooltipCb={val =>
									typeof val === "number"
										? helpers.formatCurrency(val, "M", 1)
										: val
								}
							/>
						</div>
					</div>
				) : null}
				{budget ? (
					<div className="col-lg-5 col-md-6 col-sm-7">
						<FinancesForm
							gamesInProgress={gamesInProgress}
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
				defaultSort={[1, "desc"]}
				name="TeamFinances"
				nonfluid
				footer={footer}
				rows={rows}
			/>
		</>
	);
};

TeamFinances.propTypes = {
	abbrev: PropTypes.string.isRequired,
	barData: PropTypes.object.isRequired,
	barSeasons: PropTypes.arrayOf(PropTypes.number).isRequired,
	budget: PropTypes.bool.isRequired,
	contractTotals: PropTypes.arrayOf(PropTypes.number).isRequired,
	contracts: PropTypes.arrayOf(PropTypes.object).isRequired,
	gamesInProgress: PropTypes.bool.isRequired,
	hardCap: PropTypes.bool.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	maxStadiumCapacity: PropTypes.number.isRequired,
	minContract: PropTypes.number.isRequired,
	minPayroll: PropTypes.number.isRequired,
	numGames: PropTypes.number.isRequired,
	payroll: PropTypes.number.isRequired,
	salariesSeasons: PropTypes.arrayOf(PropTypes.number).isRequired,
	salaryCap: PropTypes.number.isRequired,
	show: PropTypes.oneOf(["10", "all"]).isRequired,
	t: PropTypes.object.isRequired,
	tid: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default TeamFinances;
