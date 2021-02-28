import classNames from "classnames";
import PropTypes from "prop-types";
import { Fragment, useState } from "react";
import arrayMove from "array-move";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { MoreLinks, PlayerNameLabels, SortableTable } from "../components";
import type { View } from "../../common/types";
import { bySport, isSport } from "../../common";
import { NUM_LINES } from "../../common/constants.hockey";

const handleAutoSort = async (pos: string) => {
	await toWorker("main", "autoSortRoster", pos, undefined);
};

const handleAutoSortAll = async () => {
	await toWorker("main", "autoSortRoster", undefined, undefined);
};

const numStartersByPos = bySport<
	Record<string, number | Record<string, number>>
>({
	basketball: {},
	football: {
		QB: 1,
		RB: 1,
		WR: 3,
		TE: 1,
		OL: 5,
		DL: 4,
		LB: 3,
		CB: 2,
		S: 2,
		K: 1,
		P: 1,
		KR: 1,
		PR: 1,
	},
	hockey: {
		F: {
			C: 1,
			W: 2,
		},
		D: 2,
		G: 1,
	},
});

const posNames: Record<string, string> | undefined = isSport("hockey")
	? {
			F: "Forwards",
			D: "Defensemen",
			G: "Goalies",
	  }
	: undefined;

const numLinesByPos: Record<string, number> | undefined = isSport("hockey")
	? NUM_LINES
	: undefined;

const Depth = ({
	abbrev,
	challengeNoRatings,
	editable,
	keepRosterSorted,
	multiplePositionsWarning,
	players,
	pos,
	ratings,
	season,
	stats,
	tid,
}: View<"depth">) => {
	if (!isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	const [sortedPids, setSortedPids] = useState<number[] | undefined>();
	const [prevPos, setPrevPos] = useState(pos);
	const [prevPlayers, setPrevPlayers] = useState(players);

	useTitleBar({
		title: "Depth Chart",
		dropdownView: "depth",
		dropdownFields: { teams: abbrev, depth: pos },
		moreInfoAbbrev: abbrev,
		moreInfoSeason: season,
		moreInfoTid: tid,
	});

	if (pos !== prevPos) {
		setSortedPids(undefined);
		setPrevPos(pos);
	}
	if (players !== prevPlayers) {
		setSortedPids(undefined);
		setPrevPlayers(players);
	}

	let playersSorted;
	if (sortedPids !== undefined) {
		playersSorted = sortedPids.map(pid => {
			const p2 = players.find(p => p.pid === pid);
			if (!p2) {
				throw new Error("Player not found");
			}
			return p2;
		});
	} else {
		playersSorted = players;
	}

	const ratingCols = getCols(...ratings.map(rating => `rating:${rating}`));
	const statCols = getCols(...stats.map(stat => `stat:${stat}`));

	let numStarters = 0;
	let positions: string[];
	const entry = numStartersByPos[pos];
	if (typeof entry === "number") {
		numStarters = entry;
		positions = [pos];
	} else {
		for (const num of Object.values(entry)) {
			numStarters += num;
		}
		positions = Object.keys(entry);
	}

	const numLines = numLinesByPos ? numLinesByPos[pos] : 1;

	return (
		<>
			<MoreLinks type="team" page="depth" abbrev={abbrev} tid={tid} />
			<p style={{ clear: "both" }}>
				{isSport("football") ? (
					<>
						Click or drag row handles to move players between the starting
						lineup <span className="table-info legend-square" /> and the bench{" "}
						<span className="table-secondary legend-square" />.
					</>
				) : null}
				{isSport("hockey")
					? "There are four lines of forwards (centers and wings) and three lines of defensemen. The top lines play the most. All the players in a line will generally play together, but when injuries or other disruptions occur, a player will be moved up from below."
					: null}
			</p>

			{multiplePositionsWarning ? (
				<div className="alert alert-danger d-inline-block mb-3">
					{multiplePositionsWarning}
				</div>
			) : null}

			<ul className="nav nav-tabs mb-3 d-none d-sm-flex">
				{Object.keys(numStartersByPos).map(pos2 => (
					<li className="nav-item" key={pos2}>
						<a
							className={classNames("nav-link", {
								active: pos === pos2,
							})}
							href={helpers.leagueUrl(["depth", `${abbrev}_${tid}`, pos2])}
						>
							{posNames ? posNames[pos2] : pos2}
						</a>
					</li>
				))}
			</ul>

			{editable ? (
				<>
					<div className="btn-group mb-2">
						<button
							className="btn btn-light-bordered"
							onClick={() => handleAutoSort(pos)}
						>
							Auto sort {posNames ? posNames[pos].toLowerCase() : pos}
						</button>
						<button
							className="btn btn-light-bordered"
							onClick={handleAutoSortAll}
						>
							Auto sort all
						</button>
					</div>
					<div className="form-check mb-3">
						<input
							className="form-check-input"
							type="checkbox"
							checked={keepRosterSorted}
							id="ai-sort-user-roster"
							onChange={async () => {
								if (!keepRosterSorted) {
									await handleAutoSortAll();
								}
								await toWorker(
									"main",
									"updateKeepRosterSorted",
									tid,
									!keepRosterSorted,
								);
							}}
						/>
						<label className="form-check-label" htmlFor="ai-sort-user-roster">
							Keep all auto sorted
						</label>
					</div>
				</>
			) : null}

			{isSport("hockey") && pos === "F" ? (
				<p className="text-warning">
					Each line of forwards is made up of one center and two wings. The
					center is the first of the three players in each line.
				</p>
			) : null}

			<div className="clearfix" />

			<SortableTable
				disabled={!editable}
				values={playersSorted}
				highlightHandle={({ index }) => index < numStarters * numLines}
				rowClassName={({ index, isDragged }) =>
					classNames({
						separator:
							(index % numStarters) + 1 === numStarters &&
							index < numLines * numStarters &&
							!isDragged,
					})
				}
				onChange={async ({ oldIndex, newIndex }) => {
					const pids = players.map(p => p.pid);
					const newSortedPids = arrayMove(pids, oldIndex, newIndex);
					setSortedPids(newSortedPids);
					await toWorker("main", "reorderDepthDrag", pos, newSortedPids);
				}}
				onSwap={async (index1, index2) => {
					const newSortedPids = players.map(p => p.pid);
					newSortedPids[index1] = players[index2].pid;
					newSortedPids[index2] = players[index1].pid;
					setSortedPids(newSortedPids);
					await toWorker("main", "reorderDepthDrag", pos, newSortedPids);
				}}
				cols={() => (
					<>
						<th>Name</th>
						<th title="Position">Pos</th>
						<th>Age</th>
						{positions.map(position => (
							<Fragment key={position}>
								<th title={`Overall Rating (${[position]})`}>
									Ovr{[position]}
								</th>
								<th title={`Potential Rating (${[position]})`}>
									Pot{[position]}
								</th>
							</Fragment>
						))}
						{ratingCols.map(({ desc, title }, i) => (
							<th key={ratings[i]} className="table-accent" title={desc}>
								{title}
							</th>
						))}
						{statCols.map(({ desc, title }, i) => (
							<th key={stats[i]} title={desc}>
								{title}
							</th>
						))}
					</>
				)}
				row={({ index, value: p }) => {
					let highlightPosOvr: string | undefined;
					if (
						isSport("hockey") &&
						pos === "F" &&
						index < numLines * numStarters
					) {
						highlightPosOvr = index % numStarters === 0 ? "C" : "W";
					}
					return (
						<>
							<td>
								<PlayerNameLabels
									pid={p.pid}
									injury={p.injury}
									jerseyNumber={p.stats.jerseyNumber}
									skills={p.ratings.skills}
									watch={p.watch}
								>
									{p.name}
								</PlayerNameLabels>
							</td>
							<td
								className={classNames({
									"text-danger":
										pos !== "KR" &&
										pos !== "PR" &&
										!positions.includes(p.ratings.pos),
								})}
							>
								{p.ratings.pos}
							</td>
							<td>{p.age}</td>
							{positions.map(position => (
								<Fragment key={position}>
									<td
										className={
											highlightPosOvr === position ? "table-primary" : undefined
										}
									>
										{!challengeNoRatings ? p.ratings.ovrs[position] : null}
									</td>
									<td>
										{!challengeNoRatings ? p.ratings.pots[position] : null}
									</td>
								</Fragment>
							))}
							{ratings.map(rating => (
								<td key={rating} className="table-accent">
									{!challengeNoRatings ? p.ratings[rating] : null}
								</td>
							))}
							{stats.map(stat => (
								<td key={stat}>{helpers.roundStat(p.stats[stat], stat)}</td>
							))}
						</>
					);
				}}
			/>
		</>
	);
};

Depth.propTypes = {
	abbrev: PropTypes.string.isRequired,
	editable: PropTypes.bool.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	pos: PropTypes.string.isRequired,
	season: PropTypes.number.isRequired,
	ratings: PropTypes.arrayOf(PropTypes.string).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Depth;
