import React from "react";
import { PLAYER } from "../../../common";
import { DataTable, PlayerNameLabels } from "../../components";
import { helpers, getCols, toWorker } from "../../util";
import type { View } from "../../../common/types";
import playerRetireJerseyNumberDialog from "./playerRetireJerseyNumberDialog";

// The Partial<> ones are only required for TeamHistory, not GmHistory
const Players = ({
	gmHistory,
	godMode,
	players,
	season,
	stats,
	tid,
	userTid,
}: Pick<View<"teamHistory">, "players" | "stats" | "tid"> &
	Partial<Pick<View<"teamHistory">, "godMode" | "season" | "userTid">> & {
		gmHistory?: boolean;
	}) => {
	const includeRetireJerseyButton = (tid === userTid || godMode) && !gmHistory;

	const retireJerseyNumber = async (p: any) => {
		let number: string | undefined;
		const numbers = Object.keys(p.retirableJerseyNumbers);
		if (numbers.length === 1) {
			number = numbers[0];
		} else if (numbers.length > 1) {
			number = await playerRetireJerseyNumberDialog(p);
		}
		if (!number) {
			return;
		}

		const seasonTeamInfo =
			p.retirableJerseyNumbers[number] &&
			p.retirableJerseyNumbers[number].length > 0
				? p.retirableJerseyNumbers[number][
						p.retirableJerseyNumbers[number].length - 1
				  ]
				: season;

		await toWorker("main", "retiredJerseyNumberUpsert", tid, undefined, {
			number,
			seasonRetired: season,
			seasonTeamInfo,
			pid: p.pid,
			text: "",
		});
	};

	const cols = getCols(
		"Name",
		"Pos",
		...stats.map(stat => `stat:${stat}`),
		"Last Season",
		"Actions",
	);
	if (!includeRetireJerseyButton) {
		cols.pop();
	}

	const rows = players.map(p => {
		const canRetireJerseyNumber =
			!!p.retirableJerseyNumbers &&
			Object.keys(p.retirableJerseyNumbers).length > 0 &&
			p.tid !== tid;

		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.pos,
				...stats.map(stat => helpers.roundStat(p.careerStats[stat], stat)),
				p.lastYr,
				...(includeRetireJerseyButton
					? [
							<button
								className="btn btn-light-bordered btn-xs"
								disabled={!canRetireJerseyNumber}
								onClick={() => retireJerseyNumber(p)}
							>
								Retire Jersey
							</button>,
					  ]
					: []),
			],
			classNames: {
				// Highlight active and HOF players
				"table-danger": p.hof,
				"table-info": p.tid > PLAYER.RETIRED && p.tid !== tid, // On other team
				"table-success": p.tid === tid, // On this team
			},
		};
	});

	return (
		<>
			<h2>Players</h2>
			<p>
				Players currently on {gmHistory ? "your" : "this"} team are{" "}
				<span className="text-success">highlighted in green</span>. Other active
				players are <span className="text-info">highlighted in blue</span>.
				Players in the Hall of Fame are{" "}
				<span className="text-danger">highlighted in red</span>.
			</p>
			<DataTable
				cols={cols}
				defaultSort={[2, "desc"]}
				name="TeamHistory"
				rows={rows}
				pagination
			/>
		</>
	);
};

export default Players;
