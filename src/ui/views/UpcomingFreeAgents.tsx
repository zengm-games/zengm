import { PHASE } from "../../common/index.ts";
import { DataTable, MoreLinks } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, useLocalPartial } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { dataTableWrappedMood } from "../components/Mood.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedCurrency } from "../components/wrappedCurrency.ts";

const UpcomingFreeAgents = ({
	challengeNoRatings,
	currentSeason,
	phase,
	players,
	projectedCapSpace,
	season,
	stats,
	userTid,
}: View<"upcomingFreeAgents">) => {
	useTitleBar({
		title: "Upcoming Free Agents",
		dropdownView: "upcoming_free_agents",
		dropdownFields: { seasonsUpcoming: season },
	});

	const { gender } = useLocalPartial(["gender"]);

	const superCols = [
		{
			title: "",
			colspan: 6 + stats.length,
		},
		{
			title: "Projected Mood",
			colspan: 2,
		},
		{
			title: "",
			colspan: phase === PHASE.RESIGN_PLAYERS ? 1 : 2,
		},
	];

	const cols = getCols([
		"Name",
		"Pos",
		"Team",
		"Age",
		"Ovr",
		"Pot",
		...stats.map((stat) => `stat:${stat}`),
		"Mood",
		"Mood",
		...(phase === PHASE.RESIGN_PLAYERS ? [] : ["Current Contract"]),
		"Projected Contract",
	]);
	cols[6 + stats.length]!.title = "Your Team";
	cols[7 + stats.length]!.title = "Current Team";

	const rows: DataTableRow[] = players.map((p) => {
		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season: currentSeason,
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					pid: p.pid,
					skills: p.ratings.skills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
					{p.abbrev}
				</a>,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
				dataTableWrappedMood({
					defaultType: "user",
					maxWidth: true,
					p,
				}),
				dataTableWrappedMood({
					defaultType: "current",
					maxWidth: true,
					p,
				}),
				...(phase === PHASE.RESIGN_PLAYERS
					? []
					: [wrappedCurrency(p.contract.amount, "M")]),
				wrappedCurrency(p.contractDesired.amount, "M"),
			],
			classNames: {
				"table-info": p.tid === userTid,
			},
		};
	});

	return (
		<>
			<MoreLinks type="freeAgents" page="upcoming_free_agents" />

			<p>
				Projected {season} cap space:{" "}
				{helpers.formatCurrency(projectedCapSpace / 1000, "M")}
			</p>

			{phase !== PHASE.RESIGN_PLAYERS ? (
				<p>
					Keep in mind that many of these players will choose to re-sign with
					their current team rather than become free agents. Also, even if a
					player is &gt;99% willing to re-sign with{" "}
					{helpers.pronoun(gender, "his")} team, {helpers.pronoun(gender, "he")}{" "}
					still may become a free agent if {helpers.pronoun(gender, "his")} team
					does not want {helpers.pronoun(gender, "him")}.
				</p>
			) : null}

			<p>
				"Projected mood" is based on projected salary demands, not on projected
				future team performance or any other factors.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[3, "desc"]}
				name="UpcomingFreeAgents"
				rows={rows}
				pagination
				superCols={superCols}
			/>
		</>
	);
};

export default UpcomingFreeAgents;
