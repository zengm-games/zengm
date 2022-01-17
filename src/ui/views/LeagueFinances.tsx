import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import type { ReactNode } from "react";

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

	// Since we don't store historical salary cap data, only show cap space for current season
	const showCapSpace = season === currentSeason;
	const showCapSpaceForReal = salaryCapType !== "none";

	let capSpaceColNames: string[] = [];
	if (showCapSpace && showCapSpaceForReal) {
		capSpaceColNames = ["Cap Space", "Roster Spots", "Strategy", "Trade"];
	} else if (showCapSpace) {
		capSpaceColNames = ["Roster Spots", "Strategy", "Trade"];
	}

	// Same for ticket price
	const showTicketPrice = season === currentSeason && budget;

	const cols = budget
		? getCols([
				"Team",
				"Pop",
				"Avg Attendance",
				...(showTicketPrice ? ["Ticket Price"] : []),
				"Revenue (YTD)",
				"Profit (YTD)",
				"Cash",
				"Payroll",
				...capSpaceColNames,
		  ])
		: getCols([
				"Team",
				"Pop",
				"Avg Attendance",
				"Payroll",
				...capSpaceColNames,
		  ]);

	const rows = teams.map(t => {
		// Display the current actual payroll for this season, or the salary actually paid out for prior seasons
		const payroll =
			season === currentSeason
				? t.seasonAttrs.payroll
				: t.seasonAttrs.salaryPaid;

		const data: ReactNode[] = [
			<a
				href={helpers.leagueUrl([
					"team_finances",
					`${t.seasonAttrs.abbrev}_${t.seasonAttrs.tid}`,
				])}
			>
				{t.seasonAttrs.region} {t.seasonAttrs.name}
			</a>,
			helpers.numberWithCommas(Math.round(t.seasonAttrs.pop * 1000000)),
			helpers.numberWithCommas(Math.round(t.seasonAttrs.att)),
			...(showTicketPrice
				? [helpers.formatCurrency(t.budget.ticketPrice.amount, "", 2)]
				: []),
			...(budget
				? [
						helpers.formatCurrency(t.seasonAttrs.revenue, "M"),
						helpers.formatCurrency(t.seasonAttrs.profit, "M"),
						helpers.formatCurrency(t.seasonAttrs.cash, "M"),
				  ]
				: []),
			helpers.formatCurrency(payroll, "M"),
		];

		if (showCapSpace) {
			if (showCapSpaceForReal) {
				data.push(helpers.formatCurrency(salaryCap - payroll, "M"));
			}
			data.push(t.rosterSpots);
			data.push(helpers.upperCaseFirstLetter(t.strategy));
			data.push(
				<button
					className="btn btn-light-bordered btn-xs"
					onClick={async () => {
						console.log("click");
						await toWorker("actions", "tradeFor", { tid: t.seasonAttrs.tid });
					}}
				>
					Trade With
				</button>,
			);
		}

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
				name="LeagueFinances"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default LeagueFinances;
