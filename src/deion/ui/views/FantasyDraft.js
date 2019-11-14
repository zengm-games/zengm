import PropTypes from "prop-types";
import React from "react";
import arrayMove from "array-move";
import { PHASE } from "../../common";
import { NewWindowLink, SortableTable } from "../components";
import { helpers, setTitle, toWorker } from "../util";

// Copied from worker/util/random lol
const randInt = (a: number, b: number): number => {
	return Math.floor(Math.random() * (1 + b - a)) + a;
};
const shuffle = (list: any[]) => {
	const l = list.length;
	for (let i = 1; i < l; i++) {
		const j = randInt(0, i);
		if (j !== i) {
			const t = list[i]; // swap list[i] and list[j]
			list[i] = list[j];
			list[j] = t;
		}
	}
};

class FantasyDraft extends React.Component {
	constructor(props) {
		super(props);
		this.startDraft = this.startDraft.bind(this);
		this.randomize = this.randomize.bind(this);

		this.state = {
			sortedTids: props.teams.map(t => t.tid),
			starting: false,
		};
	}

	randomize() {
		this.setState(prevState => {
			const sortedTids = [...prevState.sortedTids];
			shuffle(sortedTids);
			return {
				sortedTids,
			};
		});
	}

	startDraft() {
		this.setState({ starting: true });
		toWorker("startFantasyDraft", this.state.sortedTids);
	}

	render() {
		setTitle("Fantasy Draft");

		if (this.props.phase === PHASE.DRAFT) {
			return (
				<>
					<h1>Error</h1>
					<p>
						You can't start a fantasy draft while a regular draft is already in
						progress.
					</p>
				</>
			);
		}

		// Use the result of drag and drop to sort players, before the "official" order comes back as props
		const teamsSorted = this.state.sortedTids.map(tid => {
			return this.props.teams.find(t => t.tid === tid);
		});

		return (
			<>
				<h1>
					Fantasy Draft <NewWindowLink />
				</h1>

				<p>
					In a "fantasy draft", all non-retired players are put into one big
					pool and teams take turns drafting players, similar to a fantasy{" "}
					{process.env.SPORT} draft. At the beginning of the draft, the order of
					picks is randomized. During the draft, the order of picks snakes
					(reverses every other round). For example, the team that picks first
					in the first round picks last in the second round.
				</p>

				<p>
					To make things as fair as possible, all traded draft picks will be
					returned to their original owners after the fantasy draft.
				</p>

				<h2>Draft Order</h2>

				<button
					className="btn btn-light-bordered mb-3"
					disabled={this.state.starting}
					onClick={this.randomize}
				>
					Randomize
				</button>

				<div className="clearfix" />

				<SortableTable
					values={teamsSorted}
					highlightHandle={({ value }) =>
						this.props.userTids.includes(value.tid)
					}
					onChange={({ oldIndex, newIndex }) => {
						this.setState(prevState => {
							const sortedTids = arrayMove(
								prevState.sortedTids,
								oldIndex,
								newIndex,
							);
							return {
								sortedTids,
							};
						});
					}}
					cols={() => (
						<>
							<th>#</th>
							<th>Team</th>
						</>
					)}
					row={({ index, style, value }) => (
						<>
							<td style={style(1)}>{index + 1}</td>
							<td style={style(2)}>
								<a href={helpers.leagueUrl(["roster", value.abbrev])}>
									{value.region} {value.name}
								</a>
							</td>
						</>
					)}
				/>

				<p>
					<button
						className="btn btn-large btn-success"
						disabled={this.state.starting}
						onClick={this.startDraft}
					>
						Start Fantasy Draft
					</button>
				</p>

				<span className="text-danger">
					<b>Warning:</b> Once you start a fantasy draft, there is no going
					back!
				</span>
			</>
		);
	}
}

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
