import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import ago from "s-ago";
import { DIFFICULTY } from "../../common";
import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, getCols, toWorker } from "../util";
import { League } from "../../common/types";

const difficultyText = (difficulty: number) => {
	let prevText: string | undefined;

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
	children: number | undefined;
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
	disabled,
	throbbing,
	onClick,
}: {
	lid: number;
	disabled: boolean;
	throbbing: boolean;
	onClick: () => void;
}) => {
	if (!disabled && !throbbing) {
		return (
			<a
				className="btn btn-lg btn-success"
				href={`/l/${lid}`}
				onClick={onClick}
			>
				Play
			</a>
		);
	}

	if (throbbing) {
		return (
			<button className="btn btn-lg btn-success dashboard-play-loading">
				Play
			</button>
		);
	}

	return (
		<button className="btn btn-lg btn-success" disabled>
			Play
		</button>
	);
};

const glyphiconStyle = {
	cursor: "pointer",
	fontSize: "larger",
};

const Star = ({ lid, starred }: { lid: number; starred?: boolean }) => {
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
				className="glyphicon glyphicon-star p-1 text-primary"
				data-no-row-highlight="true"
				onClick={toggle}
				style={glyphiconStyle}
			/>
		);
	}

	return (
		<span
			className="glyphicon glyphicon-star-empty p-1 text-muted"
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
	disabled,
	onClick,
}: {
	lid: number;
	children: string;
	starred?: boolean;
	disabled: boolean;
	onClick: () => void;
}) => {
	return (
		<div className="d-flex align-items-center">
			<div className="mr-1">
				{!disabled ? (
					<a href={`/l/${lid}`} onClick={onClick}>
						{name}
					</a>
				) : (
					name
				)}
			</div>
			<Star lid={lid} starred={starred} />
		</div>
	);
};

const Ago = ({ date }: { date?: Date }) => {
	if (date) {
		return <span title={date}>{ago(date)}</span>;
	}

	return null;
}; // https://stackoverflow.com/a/47417545/786644 hack because of overflow-x in table-responsive, otherwise menu gets chopped off if table has few rows

const dropdownStyle = {
	position: "static",
};
type Props = {
	leagues: League[];
};

const Dashboard = ({ leagues }: Props) => {
	const [loadingLID, setLoadingLID] = useState<number | undefined>();
	const [deletingLID, setDeletingLID] = useState<number | undefined>();
	useTitleBar();
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
		const disabled = deletingLID !== undefined || loadingLID !== undefined;
		const throbbing = loadingLID === league.lid;
		return {
			key: league.lid,
			data: [
				<PlayButton
					lid={league.lid}
					disabled={disabled}
					throbbing={throbbing}
					onClick={() => setLoadingLID(league.lid)}
				/>,
				<LeagueName
					lid={league.lid}
					starred={league.starred}
					disabled={disabled}
					onClick={() => setLoadingLID(league.lid)}
				>
					{league.name}
				</LeagueName>,
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
				<UncontrolledDropdown style={dropdownStyle}>
					<DropdownToggle style={glyphiconStyle} tag="span" title="Actions">
						<span
							className="glyphicon glyphicon-option-vertical text-muted p-2"
							data-no-row-highlight="true"
						/>
					</DropdownToggle>
					{!disabled ? (
						<DropdownMenu right>
							<DropdownItem href={`/new_league/${league.lid}`}>
								Import
							</DropdownItem>
							<DropdownItem
								href={`/l/${league.lid}/export_league`}
								onClick={() => setLoadingLID(league.lid)}
							>
								Export
							</DropdownItem>
							<DropdownItem
								onClick={async () => {
									const newName = await confirm("League name:", {
										defaultValue: league.name,
										okText: "Rename League",
									});

									if (typeof newName === "string") {
										await toWorker("updateLeague", league.lid, {
											name: newName,
										});
									}
								}}
							>
								Rename
							</DropdownItem>
							<DropdownItem
								onClick={async () => {
									const proceed = await confirm(
										`Are you absolutely sure you want to delete "${league.name}"? You will permanently lose any record of all seasons, players, and games from this league.`,
										{
											okText: "Delete League",
										},
									);

									if (proceed) {
										setDeletingLID(league.lid);
										await toWorker("removeLeague", league.lid);
										setDeletingLID();
									}
								}}
							>
								Delete
							</DropdownItem>
						</DropdownMenu>
					) : null}
				</UncontrolledDropdown>,
			],
		};
	});
	const pagination = rows.length > 100;
	return (
		<>
			<a
				href="/new_league"
				className="btn btn-primary dashboard-top-link dashboard-top-link-new mr-3"
				style={{
					height: 94,
				}}
			>
				Create new
				<br />
				league
			</a>
			<div
				className="btn-group-vertical dashboard-top-link"
				style={{
					height: 94,
				}}
			>
				<a
					href={`https://play.${
						process.env.SPORT === "football" ? "basketball" : "football"
					}-gm.com/`}
					className="btn btn-light-bordered dashboard-top-link dashboard-top-link-other"
					style={{
						backgroundImage: `url("https://play.${
							process.env.SPORT === "football" ? "basketball" : "football"
						}-gm.com/ico/icon70.png")`,
						backgroundRepeat: "no-repeat",
						backgroundPosition:
							process.env.SPORT === "football" ? "115px 27px" : "100px 25px",
						backgroundSize: 35,
						width: 151,
					}}
				>
					{process.env.SPORT === "football"
						? "Try our other game, Basketball GM"
						: "Try our other game, Football GM"}
				</a>
				<a
					href="http://zengm.com/"
					className="btn btn-light-bordered dashboard-top-link dashboard-top-link-other"
					style={{
						width: 151,
					}}
				>
					Play even more sports at Zen GM
				</a>
			</div>

			{rows.length > 0 ? (
				<>
					<div
						className={classNames("clearfix mb-3", {
							"mb-sm-0": !pagination,
						})}
					/>

					<DataTable
						bordered={false}
						cols={cols}
						className="dashboard-table"
						disableSettingsCache
						defaultSort={[6, "desc"]}
						name="Dashboard"
						pagination={pagination}
						small={false}
						rows={rows}
					/>
				</>
			) : null}
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
