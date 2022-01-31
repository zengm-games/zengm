import classNames from "classnames";
import { useCallback, useState, CSSProperties } from "react";
import { Dropdown } from "react-bootstrap";

import ago from "s-ago";
import {
	bySport,
	DIFFICULTY,
	SPORT_HAS_LEGENDS,
	SPORT_HAS_REAL_PLAYERS,
	WEBSITE_PLAY,
} from "../../common";
import { DataTable, TeamLogoInline } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, getCols, logEvent, toWorker } from "../util";
import type { View } from "../../common/types";

// Re-rendering caused this to run multiple times after "Play" click, even with useRef or useMemo
const randomOtherSport = bySport({
	basketball: Math.random() < 0.5 ? "football" : "hockey",
	football: Math.random() < 0.5 ? "basketball" : "hockey",
	hockey: Math.random() < 0.5 ? "basketball" : "football",
});

const difficultyText = (difficulty: number | undefined) => {
	let prevText: string | undefined;

	if (difficulty === undefined) {
		return "???";
	}

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
				"fw-bold": difficulty > DIFFICULTY.Insane,
				"text-danger": difficulty >= DIFFICULTY.Insane,
			})}
		>
			{difficultyText(difficulty)}
		</span>
	);
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
		await toWorker("main", "updateLeague", {
			lid,
			obj: {
				starred: !actuallyStarred,
			},
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
			<div className="me-1">
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
		return <span title={date.toLocaleString()}>{ago(date)}</span>;
	}

	return null;
};

// https://stackoverflow.com/a/47417545/786644 hack because of overflow-x in table-responsive, otherwise menu gets chopped off if table has few rows
const dropdownStyle: CSSProperties = {
	position: "static",
};

const Dashboard = ({ leagues }: View<"dashboard">) => {
	const [loadingLID, setLoadingLID] = useState<number | undefined>();
	const [deletingLID, setDeletingLID] = useState<number | undefined>();
	const [cloningLID, setCloningLID] = useState<number | undefined>();
	useTitleBar();

	const cols = getCols(
		[
			"",
			"League",
			"Team",
			"Phase",
			"# Seasons",
			"Difficulty",
			"Created",
			"Last Played",
			"",
		],
		{
			"": {
				width: "1%",
			},
		},
	);

	const rows = leagues.map(league => {
		const disabled =
			deletingLID !== undefined ||
			loadingLID !== undefined ||
			cloningLID !== undefined;
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
				{
					value: (
						<div className="d-flex align-items-center">
							<TeamLogoInline
								imgURL={league.imgURL}
								size={48}
								className="me-2"
							/>
							<div>
								{league.teamRegion} {league.teamName}
							</div>
						</div>
					),
					sortValue: `${league.teamRegion} ${league.teamName}`,
					classNames: "py-0",
				},
				league.phaseText,
				league.startingSeason !== undefined && league.season !== undefined
					? 1 + league.season - league.startingSeason
					: undefined,
				{
					searchValue: difficultyText(league.difficulty),
					sortValue: league.difficulty,
					value: <DifficultyText>{league.difficulty}</DifficultyText>,
				},
				{
					searchValue: league.created ? ago(league.created) : "",
					sortValue:
						league.created && league.created.getTime
							? league.created.getTime()
							: 0,
					value: <Ago date={league.created} />,
				},
				{
					searchValue: league.lastPlayed ? ago(league.lastPlayed) : "",
					sortValue:
						league.lastPlayed && league.lastPlayed.getTime
							? league.lastPlayed.getTime()
							: 0,
					value: <Ago date={league.lastPlayed} />,
				},
				<Dropdown
					style={dropdownStyle}
					className={window.mobile ? "dropdown-mobile" : undefined}
				>
					<Dropdown.Toggle
						as="span"
						bsPrefix="no-caret"
						id={`dashboard-actions-${league.lid}`}
						style={glyphiconStyle}
						title="Actions"
					>
						<span
							className="glyphicon glyphicon-option-vertical text-muted p-2"
							data-no-row-highlight="true"
						/>
					</Dropdown.Toggle>
					{!disabled ? (
						<Dropdown.Menu>
							<Dropdown.Item href={`/new_league/${league.lid}`}>
								Import
							</Dropdown.Item>
							<Dropdown.Item
								href={`/l/${league.lid}/export_league`}
								onClick={() => setLoadingLID(league.lid)}
							>
								Export
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									const newName = await confirm("League name:", {
										defaultValue: league.name,
										okText: "Rename League",
									});

									if (typeof newName === "string") {
										await toWorker("main", "updateLeague", {
											lid: league.lid,
											obj: {
												name: newName,
											},
										});
									}
								}}
							>
								Rename
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									try {
										logEvent({
											type: "info",
											text: `Cloning league "${league.name}". This may take a little while if it's a large league.`,
											saveToDb: false,
											showNotification: true,
										});

										setCloningLID(league.lid);
										const name = await toWorker(
											"main",
											"cloneLeague",
											league.lid,
										);
										setCloningLID(undefined);

										logEvent({
											type: "info",
											text: `Clone complete! Your new league is named "${name}".`,
											saveToDb: false,
											showNotification: true,
										});
									} catch (error) {
										logEvent({
											type: "error",
											text: error.message,
											saveToDb: false,
										});
									}
								}}
							>
								Clone
							</Dropdown.Item>
							<Dropdown.Item
								onClick={async () => {
									const proceed = await confirm(
										`Are you absolutely sure you want to delete "${league.name}"? You will permanently lose any record of all seasons, players, and games from this league.`,
										{
											okText: "Delete League",
										},
									);

									if (proceed) {
										setDeletingLID(league.lid);
										await toWorker("main", "removeLeague", league.lid);
										setDeletingLID(undefined);
									}
								}}
							>
								Delete
							</Dropdown.Item>
						</Dropdown.Menu>
					) : null}
				</Dropdown>,
			],
		};
	});

	const pagination = rows.length > 100;

	const otherSportsText = bySport({
		basketball: "football and hockey",
		football: "basketball and hockey",
		hockey: "basketball and football",
	});

	return (
		<>
			{location.host.indexOf("beta") === 0 ? (
				<p
					className="alert alert-warning d-inline-block"
					style={{ maxWidth: 840 }}
				>
					You are on the beta site. Sometimes new features are tested on the
					beta site, but most of the time it gets updated less frequently than{" "}
					<a href={`https://${WEBSITE_PLAY}/`}>the main site</a>. So unless
					you're testing some specific thing, you probably should be playing on{" "}
					<a href={`https://${WEBSITE_PLAY}/`}>the main site</a>.
				</p>
			) : null}
			<div
				className={
					SPORT_HAS_REAL_PLAYERS ? "mt-2 dashboard-top-wrapper" : "mt-2"
				}
			>
				{SPORT_HAS_REAL_PLAYERS ? (
					<>
						<a
							href="/new_league/real"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Real players</span>
						</a>
						<a
							href="/new_league/random"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Random players</span>
						</a>
						<div className="d-sm-none" />
						{SPORT_HAS_LEGENDS ? (
							<a
								href="/new_league/legends"
								className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
							>
								New league
								<br />
								<span className="dashboard-top-link-small">» Legends</span>
							</a>
						) : null}
						<a
							href="/new_league"
							className="btn btn-primary dashboard-top-link dashboard-top-link-new me-sm-3 mb-3"
						>
							New league
							<br />
							<span className="dashboard-top-link-small">» Custom</span>
						</a>
						<div className="d-sm-none" />
					</>
				) : (
					<a
						href="/new_league"
						className="btn btn-primary dashboard-top-link dashboard-top-link-new me-3 mb-3"
					>
						Create new
						<br />
						league
					</a>
				)}

				<a
					href="https://zengm.com/"
					className={`btn btn-light-bordered dashboard-top-link dashboard-top-link-other mb-3 dashboard-top-link-other-${randomOtherSport}`}
				>
					Try our {otherSportsText} games!
				</a>
			</div>

			{rows.length > 0 ? (
				<>
					<div className="clearfix" />

					<DataTable
						bordered={false}
						cols={cols}
						className="dashboard-table align-middle"
						disableSettingsCache
						defaultSort={["col8", "desc"]}
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

export default Dashboard;
