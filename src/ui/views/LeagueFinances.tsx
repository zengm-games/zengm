import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName";
import type { DataTableRow } from "../components/DataTable";

const LeagueFinances = ({
	budget,
	currentSeason,
	minPayroll,
	luxuryPayroll,
	luxuryTax,
	salaryCap,
	salaryCapType,
	season,
	teams,
	userTid,
}: View<"leagueFinances">) => {
	useTitleBar({
		title: "League Finances",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "league_finances",
		dropdownFields: { seasons: season },
	});

	const showCapSpaceForReal = salaryCapType !== "none";

	let capSpaceColNames: string[] = [];
	if (showCapSpaceForReal) {
		capSpaceColNames = ["Cap Space"];
	} else {
		capSpaceColNames = [];
	}

	// Same for ticket price
	const showTicketPrice = season === currentSeason && budget;

	const cols = budget
		? getCols([
				"Team",
				"Pop",
				"Avg Attendance",
				"Ticket Price",
				"Revenue (YTD)",
				"Profit (YTD)",
				"Cash",
				"Payroll",
				...capSpaceColNames,
				"Roster Spots",
				"Strategy",
				"Trade",
				"Scouting",
				"Coaching",
				"Health",
				"Facilities",
		  ])
		: getCols([
				"Team",
				"Pop",
				"Avg Attendance",
				"Payroll",
				...capSpaceColNames,
				"Roster Spots",
				"Strategy",
				"Trade",
		  ]);

	const rows = teams.map(t => {
		// Display the current actual payroll for this season, or the salary actually paid out for prior seasons
		const payroll =
			season === currentSeason
				? t.seasonAttrs.payroll
				: t.seasonAttrs.salaryPaid;

		const data: DataTableRow["data"] = [
			wrappedTeamLogoAndName(
				t,
				helpers.leagueUrl([
					"team_finances",
					`${t.seasonAttrs.abbrev}_${t.seasonAttrs.tid}`,
				]),
			),
			helpers.numberWithCommas(Math.round(t.seasonAttrs.pop * 1000000)),
			helpers.numberWithCommas(Math.round(t.seasonAttrs.att)),
			...(budget
				? [
						showTicketPrice
							? helpers.formatCurrency(t.budget.ticketPrice, "")
							: null,
						helpers.formatCurrency(t.seasonAttrs.revenue, "M"),
						helpers.formatCurrency(t.seasonAttrs.profit, "M"),
						helpers.formatCurrency(t.seasonAttrs.cash, "M"),
				  ]
				: []),
			helpers.formatCurrency(payroll, "M"),
		];

		// Since we don't store historical salary cap data, only show cap space for current season
		if (season === currentSeason) {
			if (showCapSpaceForReal) {
				data.push(helpers.formatCurrency(salaryCap - payroll, "M"));
			}
			data.push(t.rosterSpots);
			data.push(helpers.upperCaseFirstLetter(t.strategy));
		} else {
			if (showCapSpaceForReal) {
				data.push(null);
			}
			data.push(null, null);
		}

		data.push(
			<button
				className="btn btn-light-bordered btn-xs"
				onClick={async () => {
					await toWorker("actions", "tradeFor", { tid: t.seasonAttrs.tid });
				}}
			>
				Trade With
			</button>,
		);

		data.push(
			t.seasonAttrs.expenseLevels.scouting,
			t.seasonAttrs.expenseLevels.coaching,
			t.seasonAttrs.expenseLevels.health,
			t.seasonAttrs.expenseLevels.facilities,
		);

		return {
			key: t.tid,
			data,
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>
				{salaryCapType !== "none" ? (
					<>
						Salary cap: <b>{helpers.formatCurrency(salaryCap, "M")}</b> (teams
						over this amount cannot sign{" "}
						{salaryCapType === "hard" ? "players" : "free agents"} for more than
						the minimum contract)
						<br />
					</>
				) : null}
				Minimum payroll limit: <b>
					{helpers.formatCurrency(minPayroll, "M")}
				</b>{" "}
				(teams with payrolls below this limit will be assessed a fine equal to
				the difference at the end of the season)
				{salaryCapType !== "hard" ? (
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
				defaultStickyCols={1}
				name="LeagueFinances"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default LeagueFinances;
