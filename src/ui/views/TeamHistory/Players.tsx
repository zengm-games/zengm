import { PLAYER } from "../../../common/index.ts";
import { DataTable } from "../../components/index.tsx";
import { helpers, getCols, toWorker } from "../../util/index.ts";
import type { View } from "../../../common/types.ts";
import playerRetireJerseyNumberDialog from "./playerRetireJerseyNumberDialog.tsx";
import { wrappedPlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../../components/DataTable/index.tsx";
import { styleGrid11 } from "../../components/ActionButton.tsx";

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

		const seasonTeamInfo = p.retirableJerseyNumbers[number]?.at(-1) ?? season;

		await toWorker("main", "retiredJerseyNumberUpsert", {
			tid,
			info: {
				number,
				// Season can only can be undefined if gmHistory is true, but then there are no jersey retirements
				seasonRetired: season!,
				seasonTeamInfo,
				pid: p.pid,
				text: "",
			},
		});
	};

	const cols = getCols(
		[
			"Name",
			"Pos",
			...stats.map((stat) => `stat:${stat}`),
			"Titles",
			"Last Season",
			"Actions",
		],
		{
			Titles: {
				titleReact: <span className="ring" />,
			},
		},
	);
	if (!includeRetireJerseyButton) {
		cols.pop();
	}

	const rows: DataTableRow[] = players.map((p) => {
		const canRetireJerseyNumber =
			!!p.retirableJerseyNumbers &&
			Object.keys(p.retirableJerseyNumbers).length > 0 &&
			p.tid !== tid;

		const hasMultipleNumbers =
			!!p.retirableJerseyNumbers &&
			Object.keys(p.retirableJerseyNumbers).length > 1;

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season: "career",
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					pid: p.pid,
					defaultWatch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.pos,
				...stats.map((stat) => helpers.roundStat(p.careerStats[stat], stat)),
				p.numRings,
				p.lastYr,
				...(includeRetireJerseyButton
					? [
							// d-inline-grid stuff is from https://x.com/wesbos/status/1834242925401694490
							<button
								className="btn btn-light-bordered btn-xs d-inline-grid text-start"
								disabled={!canRetireJerseyNumber}
								onClick={() => retireJerseyNumber(p)}
							>
								<span
									style={styleGrid11}
									className={hasMultipleNumbers ? "opacity-0" : "opacity-100"}
								>
									Retire jersey
								</span>
								<span
									style={styleGrid11}
									className={hasMultipleNumbers ? "opacity-100" : "opacity-0"}
								>
									Retire jersey...
								</span>
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
