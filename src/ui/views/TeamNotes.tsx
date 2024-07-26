import { getCols, helpers, toWorker } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { ActionButton, DataTable, MoreLinks } from "../components";
import { wrappedTeamLogoAndName } from "../components/TeamLogoAndName";
import type { View } from "../../common/types";
import { useState } from "react";
import Note from "./Player/Note";

const TeamNotes = ({
	teams,
	ties,
	otl,
	usePts,
	userTid,
}: View<"teamNotes">) => {
	const [clearing, setClearing] = useState(false);

	useTitleBar({
		title: "Team Notes",
	});

	const colNames = ["Team", "W", "L"];
	if (otl) {
		colNames.push("OTL");
	}
	if (ties) {
		colNames.push("T");
	}
	if (usePts) {
		colNames.push("PTS");
		colNames.push("PTS%");
	} else {
		colNames.push("%");
	}
	colNames.push("Note");

	const cols = getCols(colNames, {
		Note: {
			width: "100%",
		},
	});

	const rows = teams.map(t => {
		return {
			key: JSON.stringify([t.tid, t.season]),
			data: [
				wrappedTeamLogoAndName(
					{
						tid: t.tid,
						seasonAttrs: t,
					},
					helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`, t.season]),
				),
				t.won,
				t.lost,
				...(otl ? [t.otl] : []),
				...(ties ? [t.tid] : []),
				...(usePts
					? [Math.round(t.pts), helpers.roundWinp(t.ptsPct)]
					: [helpers.roundWinp(t.winp)]),
				{
					value: (
						<Note
							note={t.note}
							info={{
								type: "teamSeason",
								tid: t.tid,
								season: t.season,
							}}
						/>
					),
					searchValue: t.note,
					sortValue: t.note,
				},
			],
			classNames: {
				"align-top": true,
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<MoreLinks type="league" page="team_notes" />

			<ActionButton
				className="mb-3"
				onClick={async () => {
					setClearing(true);
					await toWorker("main", "clearTeamNotes", undefined);
					setClearing(false);
				}}
				processing={clearing}
				variant="danger"
			>
				Clear Team Notes
			</ActionButton>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				defaultStickyCols={1}
				name="TeamNotes"
				rows={rows}
			/>
		</>
	);
};

export default TeamNotes;
