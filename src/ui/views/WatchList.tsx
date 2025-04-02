import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { PHASE, PLAYER } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker, useLocalPartial } from "../util";
import { ActionButton, DataTable, WatchBlock } from "../components";
import type { View } from "../../common/types";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";
import { Flag } from "../components/WatchBlock";
import type { DataTableRow } from "../components/DataTable";
import Note from "./Player/Note";

const ClearButton = ({
	onClick,
	players,
	processing,
}: {
	onClick: (type: "all" | number) => void;
	players: any[];
	processing: boolean;
}) => {
	const watchNumbers = new Set<number>();
	for (const p of players) {
		if (p.watch !== undefined) {
			watchNumbers.add(p.watch);
		}
	}

	if (watchNumbers.size > 0) {
		const numbers = Array.from(watchNumbers).sort((a, b) => a - b);

		return (
			<Dropdown>
				<Dropdown.Toggle variant="danger" disabled={processing}>
					Clear Watch List
				</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item
						onClick={() => {
							onClick("all");
						}}
					>
						All{" "}
						{numbers.map((number) => {
							return <Flag key={number} watch={number} />;
						})}
					</Dropdown.Item>
					{numbers.map((number) => {
						return (
							<Dropdown.Item
								key={number}
								onClick={() => {
									onClick(number);
								}}
							>
								Only list {number} <Flag watch={number} />
							</Dropdown.Item>
						);
					})}
				</Dropdown.Menu>
			</Dropdown>
		);
	}

	return (
		<ActionButton
			onClick={() => {
				onClick("all");
			}}
			processing={processing}
			variant="danger"
		>
			Clear Watch List
		</ActionButton>
	);
};

export const getWatchListColsAndRows = ({
	challengeNoRatings,
	currentSeason,
	editableNote,
	phase,
	players,
	playoffs,
	statType,
	stats,
}: Pick<
	View<"watchList">,
	| "challengeNoRatings"
	| "currentSeason"
	| "phase"
	| "players"
	| "playoffs"
	| "statType"
	| "stats"
> & {
	editableNote: boolean;
}) => {
	const cols = getCols(
		[
			"",
			"Name",
			"Pos",
			"Age",
			"Team",
			"Ovr",
			"Pot",
			"Contract",
			"Exp",
			...stats.map((stat) => `stat:${stat}`),
			"Note",
		],
		{
			Note: {
				width: "100%",
			},
		},
	);

	const rows: DataTableRow[] = players.map((p) => {
		let contract;
		let exp = null;
		if (p.tid === PLAYER.RETIRED) {
			contract = "Retired";
		} else if (p.tid === PLAYER.UNDRAFTED && phase === PHASE.FANTASY_DRAFT) {
			contract = "Fantasy Draft Prospect";
		} else if (
			p.tid === PLAYER.UNDRAFTED ||
			p.tid === PLAYER.UNDRAFTED_FANTASY_TEMP
		) {
			contract = `${p.draft.year} Draft Prospect`;
		} else {
			contract = wrappedContractAmount(p);
			exp = wrappedContractExp(p);
		}

		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season: currentSeason,
				playoffs,
			},
			data: [
				{
					value: <WatchBlock pid={p.pid} watch={p.watch} />,
					searchValue: p.watch,
					sortValue: p.watch,
				},
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					skills: p.ratings.skills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				wrappedAgeAtDeath(p.age, p.ageAtDeath),
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
					{p.abbrev}
				</a>,
				showRatings ? p.ratings.ovr : null,
				showRatings ? p.ratings.pot : null,
				contract,
				exp,
				...stats.map((stat) =>
					helpers.roundStat(p.stats[stat], stat, statType === "totals"),
				),
				{
					value: editableNote ? (
						<Note
							note={p.note}
							info={{
								type: "player",
								pid: p.pid,
							}}
						/>
					) : (
						<div
							className="overflow-auto small-scrollbar"
							style={{
								maxHeight: 300,
								whiteSpace: "pre-line",
							}}
						>
							{p.note}
						</div>
					),
					searchValue: p.note,
					sortValue: p.note,
				},
			],
		};
	});

	return {
		cols,
		rows,
	};
};

const WatchList = ({
	challengeNoRatings,
	currentSeason,
	flagNote,
	phase,
	players,
	playoffs,
	statType,
	stats,
}: View<"watchList">) => {
	const [clearing, setClearing] = useState(false);

	useTitleBar({
		title: "Watch List",
		dropdownView: "watch_list",
		dropdownFields: {
			statTypes: statType,
			playoffsCombined: playoffs,
			flagNote,
		},
	});

	const { gender } = useLocalPartial(["gender"]);

	const { cols, rows } = getWatchListColsAndRows({
		challengeNoRatings,
		currentSeason,
		editableNote: false,
		phase,
		players,
		playoffs,
		statType,
		stats,
	});

	return (
		<>
			<Dropdown className="float-end my-1">
				<Dropdown.Toggle
					id="watch-list-other-reports"
					className="btn-light-bordered"
				>
					Other Reports
				</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item href={helpers.leagueUrl(["player_stats", "watch"])}>
						Player Stats
					</Dropdown.Item>
					<Dropdown.Item href={helpers.leagueUrl(["player_ratings", "watch"])}>
						Player Ratings
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>

			<p>
				Click the watch icon <span className="glyphicon glyphicon-flag" /> to
				add or remove a player from this list.
			</p>
			<p>
				On other pages, you can find the watch icon by clicking the info button{" "}
				<span className="glyphicon glyphicon-stats" /> next to a player's name.
			</p>
			<p>
				You can edit a player's note near the top of{" "}
				{helpers.pronoun(gender, "his")} profile page.
			</p>

			<ClearButton
				players={players}
				onClick={async (type) => {
					setClearing(true);
					await toWorker("main", "clearWatchList", type);
					setClearing(false);
				}}
				processing={clearing}
			/>

			<DataTable
				className="mt-3"
				cols={cols}
				defaultSort={[5, "desc"]}
				defaultStickyCols={window.mobile ? 1 : 2}
				name="WatchList"
				pagination
				rows={rows}
			/>
		</>
	);
};

export default WatchList;
