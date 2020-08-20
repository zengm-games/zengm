import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import arrayMove from "array-move";
import { PHASE } from "../../common";
import { SortableTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util"; // Copied from worker/util/random lol
import type { View } from "../../common/types";

const randInt = (a: number, b: number): number => {
	return Math.floor(Math.random() * (1 + b - a)) + a;
};

const shuffle = (list: any[]) => {
	const l = list.length;

	for (let i = 1; i < l; i++) {
		const j = randInt(0, i);

		if (j !== i) {
			// swap list[i] and list[j]
			const temp = list[i];
			list[i] = list[j];
			list[j] = temp;
		}
	}
};

const FantasyDraft = ({ phase, teams, userTids }: View<"fantasyDraft">) => {
	const [sortedTids, setSortedTids] = useState(teams.map(t => t.tid));
	const [starting, setStarting] = useState(false);
	const randomize = useCallback(() => {
		const newSortedTids = [...sortedTids];
		shuffle(newSortedTids);
		setSortedTids(newSortedTids);
	}, [sortedTids]);
	const startDraft = useCallback(() => {
		setStarting(true);
		toWorker("main", "startFantasyDraft", sortedTids);
	}, [sortedTids]);
	useTitleBar({
		title: "Fantasy Draft",
	});

	if (phase === PHASE.DRAFT) {
		return (
			<>
				<h2>Error</h2>
				<p>
					You can't start a fantasy draft while a regular draft is already in
					progress.
				</p>
			</>
		);
	}

	// Use the result of drag and drop to sort players, before the "official" order comes back as props
	const teamsSorted = sortedTids.map(tid => {
		const found = teams.find(t => t.tid === tid);
		if (!found) {
			throw new Error("Should never happen");
		}
		return found;
	});
	return (
		<>
			<p>
				In a "fantasy draft", all non-retired players are put into one big pool
				and teams take turns drafting players, similar to a fantasy{" "}
				{process.env.SPORT} draft. At the beginning of the draft, the order of
				picks is randomized. During the draft, the order of picks snakes
				(reverses every other round). For example, the team that picks first in
				the first round picks last in the second round.
			</p>

			<p>
				To make things as fair as possible, all traded draft picks will be
				returned to their original owners after the fantasy draft.
			</p>

			<button
				className="btn btn-light-bordered mb-3"
				disabled={starting}
				onClick={randomize}
			>
				Randomize order
			</button>

			<div className="clearfix" />

			<SortableTable
				values={teamsSorted}
				highlightHandle={({ value }) => userTids.includes(value.tid)}
				onChange={({ oldIndex, newIndex }) => {
					const newSortedTids = arrayMove(sortedTids, oldIndex, newIndex);
					setSortedTids(newSortedTids);
				}}
				onSwap={async (index1, index2) => {
					const newSortedTids = [...sortedTids];
					newSortedTids[index1] = sortedTids[index2];
					newSortedTids[index2] = sortedTids[index1];
					setSortedTids(newSortedTids);
				}}
				cols={() => (
					<>
						<th>#</th>
						<th>Team</th>
					</>
				)}
				row={({ index, value }) => (
					<>
						<td>{index + 1}</td>
						<td>
							<a
								href={helpers.leagueUrl([
									"roster",
									`${value.abbrev}_${value.tid}`,
								])}
							>
								{value.region} {value.name}
							</a>
						</td>
					</>
				)}
			/>

			<p>
				<button
					className="btn btn-large btn-success"
					disabled={starting}
					onClick={startDraft}
				>
					Start Fantasy Draft
				</button>
			</p>

			<span className="text-danger">
				<b>Warning:</b> Once you start a fantasy draft, there is no going back!
			</span>
		</>
	);
};

FantasyDraft.propTypes = {
	phase: PropTypes.number.isRequired,
	userTids: PropTypes.arrayOf(PropTypes.number).isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			abbrev: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			region: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
};

export default FantasyDraft;
