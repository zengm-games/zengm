import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import arrayMove from "array-move";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { MoreLinks, PlayerNameLabels, SortableTable } from "../components";
import { POSITIONS } from "../../common/constants.football";
import type { View } from "../../common/types";

const handleAutoSort = async (pos: string) => {
	await toWorker("main", "autoSortRoster", pos, undefined);
};

const handleAutoSortAll = async () => {
	await toWorker("main", "autoSortRoster", undefined, undefined);
};

const numStartersByPos = {
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
};

const Depth = ({
	abbrev,
	challengeNoRatings,
	editable,
	keepRosterSorted,
	players,
	pos,
	ratings,
	season,
	stats,
	tid,
}: View<"depthFootball">) => {
	if (process.env.SPORT !== "football") {
		throw new Error("Not implemented");
	}

	const [sortedPids, setSortedPids] = useState<number[] | undefined>();
	const [prevPos, setPrevPos] = useState(pos);
	const [prevPlayers, setPrevPlayers] = useState(players);

	useTitleBar({
		title: "Depth Chart",
		dropdownView: "depth",
		dropdownFields: { teams: abbrev, positions: pos },
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

	const numStarters = numStartersByPos.hasOwnProperty(pos)
		? // https://github.com/microsoft/TypeScript/issues/21732
		  // @ts-ignore
		  numStartersByPos[pos]
		: 0;

	return (
		<>
			<MoreLinks type="team" page="depth" abbrev={abbrev} tid={tid} />
			<p style={{ clear: "both" }}>
				Click or drag row handles to move players between the starting lineup{" "}
				<span className="table-info legend-square" /> and the bench{" "}
				<span className="table-secondary legend-square" />.
			</p>

			<ul className="nav nav-tabs mb-3 d-none d-sm-flex">
				{POSITIONS.map(pos2 => (
					<li className="nav-item" key={pos2}>
						<a
							className={classNames("nav-link", {
								active: pos === pos2,
							})}
							href={helpers.leagueUrl(["depth", `${abbrev}_${tid}`, pos2])}
						>
							{pos2}
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
							Auto sort {pos}
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
								await toWorker("main", "updateGameAttributes", {
									keepRosterSorted: !keepRosterSorted,
								});
							}}
						/>
						<label className="form-check-label" htmlFor="ai-sort-user-roster">
							Keep all auto sorted
						</label>
					</div>
				</>
			) : null}

			<div className="clearfix" />

			<SortableTable
				disabled={!editable}
				values={playersSorted}
				highlightHandle={({ index }) => index < numStarters}
				rowClassName={({ index, isDragged }) =>
					classNames({
						separator: index === numStarters - 1 && !isDragged,
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
						<th title={`Overall Rating (${pos})`}>Ovr{pos}</th>
						<th title={`Potential Rating (${pos})`}>Pot{pos}</th>
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
				row={({ value: p }) => (
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
									pos !== "KR" && pos !== "PR" && pos !== p.ratings.pos,
							})}
						>
							{p.ratings.pos}
						</td>
						<td>{p.age}</td>
						<td>{!challengeNoRatings ? p.ratings.ovrs[pos] : null}</td>
						<td>{!challengeNoRatings ? p.ratings.pots[pos] : null}</td>
						{ratings.map(rating => (
							<td key={rating} className="table-accent">
								{!challengeNoRatings ? p.ratings[rating] : null}
							</td>
						))}
						{stats.map(stat => (
							<td key={stat}>{helpers.roundStat(p.stats[stat], stat)}</td>
						))}
					</>
				)}
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
