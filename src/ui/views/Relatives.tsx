import PropTypes from "prop-types";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, PlayerNameLabels } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

const Relatives = ({
	challengeNoRatings,
	pid,
	players,
	stats,
	userTid,
}: View<"relatives">) => {
	const target =
		pid !== undefined ? players.find(p => p.pid === pid) : undefined;

	const title = target === undefined ? "Relatives" : `${target.name}'s Family`;

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
		"# Fathers",
		"# Brothers",
		"# Sons",
		"Year",
		"Team",
		...stats.map(stat => `stat:${stat}`),
		...stats.map(stat => `stat:${stat}`),
	]);

	const rows = players.map(p => {
		const relationArray: string[] = [];
		if (target) {
			if (p.pid === pid) {
				relationArray.push("Self");
			} else {
				const relation = target.relatives.find((rel: any) => rel.pid === p.pid);
				if (relation) {
					relationArray.push(helpers.upperCaseFirstLetter(relation.type));
				} else {
					relationArray.push("???");
				}
			}
		}

		const showRatings = !challengeNoRatings || p.retiredYear !== Infinity;

		const college = p.college && p.college !== "" ? p.college : "None";

		return {
			key: p.pid,
			data: [
				<PlayerNameLabels pid={p.pid} jerseyNumber={p.jerseyNumber}>
					{p.name}
				</PlayerNameLabels>,
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
					for a player to see his relatives.
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
				name="Relatives"
				pagination
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

Relatives.propTypes = {
	pid: PropTypes.number,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Relatives;
