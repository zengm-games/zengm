import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useState } from "react";
import arrayMove from "array-move";
import useTitleBar from "../../../deion/ui/hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../../../deion/ui/util";
import { PlayerNameLabels, SortableTable } from "../../../deion/ui/components";
import { POSITIONS } from "../../common/constants";

const handleAutoSort = async pos => {
	await toWorker("autoSortRoster", pos);
};

const handleAutoSortAll = async () => {
	await toWorker("autoSortRoster");
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

const Depth = ({ abbrev, editable, players, pos, ratings, season, stats }) => {
	const [sortedPids, setSortedPids] = useState();
	const [prevPos, setPrevPos] = useState(pos);
	const [prevPlayers, setPrevPlayers] = useState(players);

	useTitleBar({
		title: "Depth Chart",
		dropdownView: "depth",
		dropdownFields: { teams: abbrev, positions: pos },
		moreInfoAbbrev: abbrev,
		moreInfoSeason: season,
	});

	if (pos !== prevPos) {
		setSortedPids();
		setPrevPos(pos);
	}
	if (players !== prevPlayers) {
		setSortedPids();
		setPrevPlayers(players);
	}

	let playersSorted;
	if (sortedPids !== undefined) {
		playersSorted = sortedPids.map(pid => {
			return players.find(p => p.pid === pid);
		});
	} else {
		playersSorted = players;
	}

	const ratingCols = getCols(...ratings.map(rating => `rating:${rating}`));
	const statCols = getCols(...stats.map(stat => `stat:${stat}`));

	return (
		<>
			<p>
				More: <a href={helpers.leagueUrl(["roster", abbrev])}>Roster</a> |{" "}
				<a href={helpers.leagueUrl(["team_finances", abbrev])}>Finances</a> |{" "}
				<a href={helpers.leagueUrl(["game_log", abbrev])}>Game Log</a> |{" "}
				<a href={helpers.leagueUrl(["team_history", abbrev])}>History</a> |{" "}
				<a href={helpers.leagueUrl(["transactions", abbrev])}>Transactions</a>
			</p>
			<p style={{ clear: "both" }}>
				Drag row handles to move players between the starting lineup{" "}
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
							href={helpers.leagueUrl(["depth", abbrev, pos2])}
						>
							{pos2}
						</a>
					</li>
				))}
			</ul>

			{editable ? (
				<div className="btn-group mb-3">
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
			) : null}

			<div className="clearfix" />

			<SortableTable
				disabled={!editable}
				values={playersSorted}
				highlightHandle={({ index }) => index < numStartersByPos[pos]}
				rowClassName={({ index, isDragged }) =>
					classNames({
						separator: index === numStartersByPos[pos] - 1 && !isDragged,
					})
				}
				onChange={async ({ oldIndex, newIndex }) => {
					const pids = players.map(p => p.pid);
					const newSortedPids = arrayMove(pids, oldIndex, newIndex);
					setSortedPids(newSortedPids);
					await toWorker("reorderDepthDrag", pos, newSortedPids);
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
						<td>{p.ratings.ovrs[pos]}</td>
						<td>{p.ratings.pots[pos]}</td>
						{ratings.map(rating => (
							<td key={rating} className="table-accent">
								{p.ratings[rating]}
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
