// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import ago from "s-ago";
import { DIFFICULTY } from "../../common";
import { DataTable } from "../components";
import { confirm, getCols, setTitle, toWorker } from "../util";
import type { League } from "../../common/types";

const difficultyText = (difficulty: number) => {
	let prevText: string | void;
	for (const [text, numeric] of Object.entries(DIFFICULTY)) {
		if (typeof numeric !== "number") {
			throw new Error("Should never happen");
		}

		if (difficulty === numeric) {
			return text;
		}

		// Iteration is in order, so if we're below the value, there will be no direct hit
		if (difficulty < numeric) {
			if (prevText !== undefined) {
				return `${prevText}+`;
			}
			return `${text}-`;
		}

		prevText = text;
	}

	if (prevText !== undefined) {
		return `${prevText}+`;
	}

	return "???";
};

const DifficultyText = ({
	children: difficulty,
}: {
	children: number | void,
}) => {
	if (difficulty === undefined) {
		return null;
	}

	return (
		<span
			className={classNames({
				"font-weight-bold": difficulty > DIFFICULTY.Insane,
				"text-danger": difficulty >= DIFFICULTY.Insane,
			})}
		>
			{difficultyText(difficulty)}
		</span>
	);
};

DifficultyText.propTypes = {
	children: PropTypes.number,
};

const PlayButton = ({
	lid,
	loadingLID,
	setLoadingLID,
}: {
	lid: number,
	loadingLID?: number,
	setLoadingLID: (number | void) => void,
}) => {
	if (loadingLID === undefined) {
		return (
			<a
				className="btn btn-success"
				href={`/l/${lid}`}
				onClick={() => setLoadingLID(lid)}
			>
				Play
			</a>
		);
	}

	if (loadingLID === lid) {
		return (
			<button className="btn btn-success dashboard-play-loading">Play</button>
		);
	}

	return (
		<button className="btn btn-success" disabled>
			Play
		</button>
	);
};

const glyphiconStyle = {
	cursor: "pointer",
	fontSize: "larger",
};
const Star = ({ lid, starred }: { lid: number, starred?: boolean }) => {
	const [actuallyStarred, setActuallyStarred] = useState<boolean>(!!starred);

	const toggle = useCallback(async () => {
		setActuallyStarred(!actuallyStarred);

		await toWorker("updateLeague", lid, {
			starred: !actuallyStarred,
		});
	}, [actuallyStarred, lid]);

	if (actuallyStarred) {
		return (
			<span
				className="glyphicon glyphicon-star text-primary"
				data-no-row-highlight="true"
				onClick={toggle}
				style={glyphiconStyle}
			/>
		);
	}

	return (
		<span
			className="glyphicon glyphicon-star-empty text-muted"
			data-no-row-highlight="true"
			onClick={toggle}
			style={glyphiconStyle}
			title="Star"
		/>
	);
};

const LeagueName = ({
	lid,
	children: name,
	starred,
	loadingLID,
	setLoadingLID,
}: {
	lid: number,
	children: string,
	starred?: boolean,
	loadingLID?: number,
	setLoadingLID: (number | void) => void,
}) => {
	const handleEdit = useCallback(async () => {
		const newName = await confirm("League name:", name);
		if (typeof newName === "string") {
			await toWorker("updateLeague", lid, {
				name: newName,
			});
		}
	}, [lid, name]);

	return (
		<div className="d-flex align-items-center">
			<Star lid={lid} starred={starred} />
			<div className="flex-grow-1 mx-2">
				{loadingLID === undefined ? (
					<a href={`/l/${lid}`} onClick={() => setLoadingLID(lid)}>
						{name}
					</a>
				) : (
					name
				)}
			</div>
			<span
				className="glyphicon glyphicon-edit text-muted"
				data-no-row-highlight="true"
				style={glyphiconStyle}
				onClick={handleEdit}
				title="Edit Name"
			/>
		</div>
	);
};

const Ago = ({ date }: { date?: Date }) => {
	if (date) {
		return ago(date);
	}

	return null;
};

type Props = {
	leagues: League[],
};

const Dashboard = ({ leagues }: Props) => {
	const [loadingLID, setLoadingLID] = useState<number | void>();

	setTitle("Dashboard");

	const cols = getCols(
		"",
		"League",
		"Team",
		"Phase",
		"Difficulty",
		"Created",
		"Last Played",
		"",
	);
	cols[0].width = "1%";
	cols[7].width = "1%";

	const rows = leagues.map(league => {
		return {
			key: league.lid,
			data: [
				{
					classNames: "dashboard-controls",
					value: (
						<PlayButton
							lid={league.lid}
							loadingLID={loadingLID}
							setLoadingLID={setLoadingLID}
						/>
					),
				},
				{
					classNames: "dashboard-controls",
					value: (
						<LeagueName
							lid={league.lid}
							starred={league.starred}
							loadingLID={loadingLID}
							setLoadingLID={setLoadingLID}
						>
							{league.name}
						</LeagueName>
					),
				},
				`${league.teamRegion} ${league.teamName}`,
				league.phaseText,
				<DifficultyText>{league.difficulty}</DifficultyText>,
				<Ago date={league.created}>
					{league.created && league.created.getTime
						? league.created.getTime()
						: 0}
				</Ago>,
				<Ago date={league.lastPlayed}>
					{league.lastPlayed && league.lastPlayed.getTime
						? league.lastPlayed.getTime()
						: 0}
				</Ago>,
				{
					classNames: "dashboard-controls",
					value: (
						<div className="btn-group btn-group-sm">
							<a
								className={classNames("btn btn-light-bordered", {
									disabled: loadingLID !== undefined,
								})}
								href={`/new_league/${league.lid}`}
							>
								Import
							</a>
							<a
								className={classNames("btn btn-light-bordered", {
									disabled: loadingLID !== undefined,
								})}
								href={`/l/${league.lid}/export_league`}
								onClick={() => setLoadingLID(league.lid)}
							>
								Export
							</a>
							<a
								className={classNames("btn btn-light-bordered", {
									disabled: loadingLID !== undefined,
								})}
								href={`/delete_league/${league.lid}`}
							>
								Delete
							</a>
						</div>
					),
				},
			],
		};
	});

	return (
		<>
			<ul className="dashboard-boxes">
				<li className="dashboard-box-new">
					<a href="/new_league" className="btn btn-primary league">
						<h2>
							Create new
							<br />
							league
						</h2>
					</a>
				</li>
				<li>
					<a
						href={`https://play.${
							process.env.SPORT === "football" ? "basketball" : "football"
						}-gm.com/`}
						className="btn btn-light-bordered league"
						style={{
							backgroundImage: `url("https://play.${
								process.env.SPORT === "football" ? "basketball" : "football"
							}-gm.com/ico/icon70.png")`,
							backgroundRepeat: "no-repeat",
							backgroundPosition:
								process.env.SPORT === "football" ? "100px 41px" : "75px 41px",
							fontSize: "16px",
						}}
					>
						{process.env.SPORT === "football"
							? "Play the original, Basketball GM!"
							: "Try the brand new Football GM!"}
					</a>
				</li>
			</ul>

			<div className="clearfix" />

			<DataTable
				bordered={false}
				cols={cols}
				defaultSort={[6, "desc"]}
				name="Dashboard"
				small={false}
				rows={rows}
			/>
		</>
	);
};

Dashboard.propTypes = {
	leagues: PropTypes.arrayOf(
		PropTypes.shape({
			created: PropTypes.instanceOf(Date),
			lastPlayed: PropTypes.instanceOf(Date),
			difficulty: PropTypes.number,
			lid: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			phaseText: PropTypes.string.isRequired,
			starred: PropTypes.bool,
			teamName: PropTypes.string.isRequired,
			teamRegion: PropTypes.string.isRequired,
		}),
	).isRequired,
};

export default Dashboard;
