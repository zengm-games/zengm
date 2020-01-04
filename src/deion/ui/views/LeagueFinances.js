import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitleBar } from "../util";
import { DataTable, Dropdown, JumpTo, NewWindowLink } from "../components";

const LeagueFinances = ({
	budget,
	currentSeason,
	hardCap,
	minPayroll,
	luxuryPayroll,
	luxuryTax,
	salaryCap,
	season,
	teams,
	userTid,
}) => {
	setTitleBar({ title: "League Finances" });

	const cols = budget
		? getCols(
				"Team",
				"Pop",
				"Avg Attendance",
				"Revenue (YTD)",
				"Profit (YTD)",
				"Cash",
				"Payroll",
				"Cap Space",
		  )
		: getCols("Team", "Pop", "Avg Attendance", "Payroll", "Cap Space");

	const rows = teams.map(t => {
		// Display the current actual payroll for this season, or the salary actually paid out for prior seasons
		const payroll =
			season === currentSeason
				? t.seasonAttrs.payroll
				: t.seasonAttrs.salaryPaid;

		return {
			key: t.tid,
			data: [
				<a href={helpers.leagueUrl(["team_finances", t.abbrev])}>
					{t.region} {t.name}
				</a>,
				helpers.numberWithCommas(Math.round(t.seasonAttrs.pop * 1000000)),
				helpers.numberWithCommas(Math.round(t.seasonAttrs.att)),
				...(budget
					? [
							helpers.formatCurrency(t.seasonAttrs.revenue, "M"),
							helpers.formatCurrency(t.seasonAttrs.profit, "M"),
							helpers.formatCurrency(t.seasonAttrs.cash, "M"),
					  ]
					: []),
				helpers.formatCurrency(payroll, "M"),
				helpers.formatCurrency(salaryCap - payroll, "M"),
			],
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<Dropdown view="league_finances" fields={["seasons"]} values={[season]} />
			<JumpTo season={season} />

			<p>
				Salary cap: <b>{helpers.formatCurrency(salaryCap, "M")}</b> (teams over
				this amount cannot sign {hardCap ? "players" : "free agents"} for more
				than the minimum contract)
				<br />
				Minimum payroll limit: <b>
					{helpers.formatCurrency(minPayroll, "M")}
				</b>{" "}
				(teams with payrolls below this limit will be assessed a fine equal to
				the difference at the end of the season)
				{!hardCap ? (
					<>
						<br />
						Luxury tax limit:{" "}
						<b>{helpers.formatCurrency(luxuryPayroll, "M")}</b> (teams with
						payrolls above this limit will be assessed a fine equal to{" "}
						{luxuryTax} times the difference at the end of the season)
					</>
				) : null}
			</p>

			<DataTable
				cols={cols}
				defaultSort={[5, "desc"]}
				name="LeagueFinances"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

LeagueFinances.propTypes = {
	budget: PropTypes.bool.isRequired,
	currentSeason: PropTypes.number.isRequired,
	hardCap: PropTypes.bool.isRequired,
	minPayroll: PropTypes.number.isRequired,
	luxuryPayroll: PropTypes.number.isRequired,
	luxuryTax: PropTypes.number.isRequired,
	salaryCap: PropTypes.number.isRequired,
	season: PropTypes.number.isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			abbrev: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			seasonAttrs: PropTypes.shape({
				att: PropTypes.number.isRequired,
				cash: PropTypes.number.isRequired,
				payroll: PropTypes.number, // Not required for past seasons
				profit: PropTypes.number.isRequired,
				revenue: PropTypes.number.isRequired,
				salaryPaid: PropTypes.number.isRequired,
			}).isRequired,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default LeagueFinances;
