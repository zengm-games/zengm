import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { List, arrayMove } from "react-movable";
import { PHASE } from "../../common";
import { NewWindowLink, ResponsiveTableWrapper } from "../components";
import { helpers, setTitle, toWorker } from "../util";

const Row = React.forwardRef(
	({ highlight, i, isDragged, t, widths, ...props }, ref) => {
		return (
			<tr ref={ref} {...props}>
				<td
					className={classNames("roster-handle", {
						"table-info": highlight,
						"table-secondary": !highlight,
					})}
					data-movable-handle
					style={{
						cursor: isDragged ? "grabbing" : "grab",
						padding: 5,
						width: widths[0],
					}}
				/>
				<td style={{ padding: 5, width: widths[1] }}>{i + 1}</td>
				<td style={{ padding: 5, width: widths[2] }}>
					<a href={helpers.leagueUrl(["roster", t.abbrev])}>
						{t.region} {t.name}
					</a>
				</td>
			</tr>
		);
	},
);

Row.propTypes = {
	highlight: PropTypes.bool.isRequired,
	i: PropTypes.number.isRequired,
	isDragged: PropTypes.bool.isRequired,
	t: PropTypes.shape({
		abbrev: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		region: PropTypes.string.isRequired,
		tid: PropTypes.number.isRequired,
	}),
	widths: PropTypes.arrayOf(PropTypes.string).isRequired,
};

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
			widths: [],
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

				<List
					values={teamsSorted}
					beforeDrag={({ elements, index }) => {
						const cells = Array.from(elements[index].children);
						const widths = cells.map(
							cell => window.getComputedStyle(cell).width,
						);
						this.setState({ widths });
					}}
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
					renderList={({ children, props }) => (
						<ResponsiveTableWrapper nonfluid>
							<table className="table table-striped table-bordered table-sm table-hover">
								<thead>
									<tr>
										<th />
										<th>#</th>
										<th>Team</th>
									</tr>
								</thead>
								<tbody {...props}>{children}</tbody>
							</table>
						</ResponsiveTableWrapper>
					)}
					renderItem={({ index, isDragged, props, value }) => {
						const widths = isDragged ? this.state.widths : [];
						const highlight = this.props.userTids.includes(value.tid);

						const row = (
							<Row
								{...props}
								highlight={highlight}
								isDragged={isDragged}
								i={index}
								t={value}
								widths={widths}
							/>
						);

						return isDragged ? (
							<table>
								<tbody>{row}</tbody>
							</table>
						) : (
							row
						);
					}}
					transitionDuration={100}
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
