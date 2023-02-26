import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";

const Relatives = ({
	challengeNoRatings,
	gender,
	pid,
	players,
	stats,
	userTid,
}: View<"relatives">) => {
	const target =
		pid !== undefined ? players.find(p => p.pid === pid) : undefined;

	let title;
	if (target === undefined) {
		title = "Relatives";
	} else {
		let name = target.firstName;
		if (target.lastName) {
			name += ` ${target.lastName}`;
		}
		title = `${name}'s Family`;
	}

	useTitleBar({ title, customMenu: frivolitiesMenu });

	const superCols = [
		{
			title: "",
			colspan: 7,
		},
		{
			title: "Relatives",
			colspan: target ? 5 : 4,
		},
		{
			title: "Best Season",
			colspan: 2 + stats.length,
		},
		{
			title: "Career Stats",
			colspan: stats.length,
		},
	];

	const cols = getCols([
		"Name",
		"Pos",
		"Drafted",
		"Retired",
		"College",
		"Pick",
		"Peak Ovr",
		...(target !== undefined ? ["Relation"] : []),
		"Details",
		gender === "male" ? "# Fathers" : "# Mothers",
		gender === "male" ? "# Brothers" : "# Sisters",
		gender === "male" ? "# Sons" : "# Daughters",
		"Year",
		"Team",
		...stats.map(stat => `stat:${stat}`),
		...stats.map(stat => `stat:${stat}`),
	]);

	const rows = players.map(p => {
		const relationArray: string[] = [];
		if (target) {
			relationArray.push(p.relationText);
		}

		const showRatings = !challengeNoRatings || p.retiredYear !== Infinity;

		const college = p.college && p.college !== "" ? p.college : "None";

		return {
			key: p.pid,
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					jerseyNumber: p.jerseyNumber,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.at(-1).pos,
				p.draft.year,
				p.retiredYear === Infinity ? null : p.retiredYear,
				<a
					href={helpers.leagueUrl([
						"frivolities",
						"most",
						"college",
						window.encodeURIComponent(college),
					])}
				>
					{college}
				</a>,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
				showRatings ? p.peakOvr : null,
				...relationArray,
				p.pid !== pid ? (
					<a href={helpers.leagueUrl(["frivolities", "relatives", p.pid])}>
						Details
					</a>
				) : null,
				p.numFathers,
				p.numBrothers,
				p.numSons,
				p.bestStats.season,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.bestStats.abbrev}_${p.bestStats.tid}`,
						p.bestStats.season,
					])}
				>
					{p.bestStats.abbrev}
				</a>,
				...stats.map(stat => helpers.roundStat(p.bestStats[stat], stat)),
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
			],
			classNames: {
				"table-danger": p.hof,
				"table-success": p.retiredYear === Infinity,
				"table-info": p.statsTids.includes(userTid),
			},
		};
	});

	return (
		<>
			{target ? (
				<p>
					More:{" "}
					<a href={helpers.leagueUrl(["frivolities", "relatives"])}>
						All Players With Relatives
					</a>
				</p>
			) : (
				<p>
					These are the players with a relative in the league. Click "Details"
					for a player to see {helpers.pronoun(gender, "his")} relatives.
				</p>
			)}

			<p>
				Players who have played for your team are{" "}
				<span className="text-info">highlighted in blue</span>. Active players
				are <span className="text-success">highlighted in green</span>. Hall of
				Famers are <span className="text-danger">highlighted in red</span>.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[20, "desc"]}
				defaultStickyCols={window.mobile ? 0 : 1}
				name="Relatives"
				pagination
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default Relatives;
