import orderBy from "lodash/orderBy";
import range from "lodash/range";
import PropTypes from "prop-types";
import React, { useCallback, useState, useRef } from "react";
import { DIFFICULTY } from "../../common";
import { LeagueFileUpload } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import type { View } from "../../common/types";
import league2020 from "../../../../public/basketball/leagues/2020.json";
import api from "../api";
import classNames from "classnames";

type NewLeagueTeam = {
	tid: number;
	region: string;
	name: string;
	pop?: number;
	popRank: number;
};

const teamsDefault: NewLeagueTeam[] = helpers.addPopRank(
	helpers.getTeamsDefault(),
);

const teams2020: NewLeagueTeam[] =
	process.env.SPORT === "basketball"
		? helpers.addPopRank(league2020.teams)
		: [];

const PopText = ({
	teams,
	tid,
}: {
	teams: typeof teamsDefault;
	tid: number;
}) => {
	if (tid >= 0) {
		const t = teams.find(t2 => t2.tid === tid);
		if (t) {
			let size;
			if (t.popRank <= 3) {
				size = "very large";
			} else if (t.popRank <= 8) {
				size = "large";
			} else if (t.popRank <= 16) {
				size = "normal";
			} else if (t.popRank <= 24) {
				size = "small";
			} else {
				size = "very small";
			}

			return (
				<span className="text-muted">
					Region population: {t.pop} million (#
					{t.popRank})<br />
					Size: {size}
				</span>
			);
		}
	}

	return (
		<span className="text-muted">
			Region population: ?<br />
			Difficulty: ?
		</span>
	);
};

PopText.propTypes = {
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			// pop and popRank not required for Random Team
			pop: PropTypes.number,
			popRank: PropTypes.number,
			tid: PropTypes.number.isRequired,
		}),
	).isRequired,
	tid: PropTypes.number.isRequired,
};

const leaguePartDescriptions: { [key: string]: string } = {
	gameAttributes: "League settings",
	startingSeason: "Starting season",
	players: "Players, including ratings and stats",
	teams: "Teams",
	teamSeason: "Team seasons history",
	teamStats: "Team stats history",
	allStars: "All-Star Game history",
	awards: "Awards history",
	games: "Box scores",
	releasedPlayers: "Contracts owed to released players",
	draftLotteryResults: "Draft lottery history",
	events: "Event log",
	negotiations: "In-progress contract negotiations",
	trade: "In-progress trade negotiations",
	meta: "League metadata, like league name",
	messages: "Messages from the owner",
	playerFeats: "Statistical feats",
	playoffSeries: "Upcoming and historical playoff series",
	schedule: "Upcoming schedule",
	draftPicks: "Traded future draft picks",
	scheduledEvents: "Scheduled events, like expansion and league rule changes",
};

const initKeptKeys = (leagueFile: any) =>
	leagueFile ? Object.keys(leagueFile).filter(key => key !== "version") : [];

const LeaguePartPicker = ({
	leagueFile,
	keptKeys,
	setKeptKeys,
}: {
	leagueFile: any;
	keptKeys: string[];
	setKeptKeys: (keys: string[]) => void;
}) => {
	if (!leagueFile) {
		return null;
	}

	const allKeys = initKeptKeys(leagueFile);

	const keysSorted = Object.keys(leaguePartDescriptions).filter(key =>
		allKeys.includes(key),
	);
	keysSorted.push(...allKeys.filter(key => !keysSorted.includes(key)));

	return (
		<div className="form-group">
			<label>Use from selected league:</label>

			{keysSorted.map(key => (
				<div key={key} className="form-check">
					<label className="form-check-label">
						<input
							className="form-check-input"
							onChange={event => {
								if (!event.target.checked) {
									setKeptKeys(keptKeys.filter(key2 => key2 !== key));
								} else {
									setKeptKeys([...keptKeys, key]);
								}
							}}
							type="checkbox"
							checked={keptKeys.includes(key)}
						/>
						{leaguePartDescriptions[key] ? leaguePartDescriptions[key] : key}
					</label>
				</div>
			))}

			<div className="mt-1">
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([...allKeys]);
					}}
				>
					All
				</button>{" "}
				|{" "}
				<button
					className="btn btn-link p-0"
					onClick={event => {
						event.preventDefault();
						setKeptKeys([]);
					}}
				>
					None
				</button>
			</div>

			<p className="alert alert-warning my-3">
				Warning: selecting a weird combination of things may result in a
				partially or completely broken league.
			</p>
		</div>
	);
};

const SeasonsMenu = ({
	onDone,
	onLoading,
	value,
}: {
	onDone: (season: number, leagueFile: any) => void;
	onLoading: (season: number) => void;
	value: number;
}) => {
	const waitingForSeason = useRef<number | undefined>(value);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const seasons = range(2020, 1955);

	const handleNewSeason = async (season: number) => {
		waitingForSeason.current = season;
		onLoading(season);
		setErrorMessage(undefined);

		if (process.env.SPORT === "basketball" && season === 2020) {
			onDone(2020, helpers.deepCopy(league2020));
			waitingForSeason.current = undefined;
		} else {
			try {
				const response = await fetch(`/leagues/${season}.json`);
				if (waitingForSeason.current === season) {
					const leagueFile = await response.json();
					if (waitingForSeason.current === season) {
						onDone(season, leagueFile);
						waitingForSeason.current = undefined;
					}
				}
			} catch (error) {
				setErrorMessage(error.message);
				throw error;
			}
		}
	};

	return (
		<div className="form-group">
			<label htmlFor="new-league-season">Season</label>
			<div className="input-group mb-1">
				<select
					id="new-league-season"
					className="form-control"
					value={value}
					onChange={async event => {
						const season = parseInt(event.target.value, 10);
						await handleNewSeason(season);
					}}
				>
					{seasons.map(season => {
						return (
							<option key={season} value={season}>
								{season}
							</option>
						);
					})}
				</select>
				<div className="input-group-append">
					<button
						className="btn btn-secondary"
						type="button"
						onClick={() => {
							const randomSeason =
								seasons[Math.floor(Math.random() * seasons.length)];
							handleNewSeason(randomSeason);
						}}
					>
						Random
					</button>
				</div>
			</div>
			{errorMessage ? (
				<span className="text-danger">Error: {errorMessage}</span>
			) : null}
		</div>
	);
};

const NewLeague = (props: View<"newLeague">) => {
	const [creating, setCreating] = useState(false);
	const [customize, setCustomize] = useState<
		"custom-rosters" | "custom-url" | "default" | "real"
	>(() => {
		if (props.lid !== undefined) {
			return "custom-rosters";
		}

		if (props.type === "real") {
			return "real";
		}

		return "default";
	});
	const [realSeason, setRealSeason] = useState(2020);
	const [difficulty, setDifficulty] = useState(
		props.difficulty !== undefined ? props.difficulty : DIFFICULTY.Normal,
	);
	const [leagueFile, setLeagueFile] = useState<any>(
		customize === "real" && process.env.SPORT === "basketball"
			? league2020
			: null,
	);
	const [loadingLeagueFile, setLoadingLeagueFile] = useState(false);
	const [name, setName] = useState(props.name);
	const [randomizeRosters, setRandomizeRosters] = useState(false);
	const [teams, setTeams] = useState(
		customize === "real" ? teams2020 : teamsDefault,
	);
	const [tid, setTid] = useState(props.lastSelectedTid);
	const [keptKeys, setKeptKeys] = useState<string[]>(initKeptKeys(leagueFile));

	let title: string;
	if (props.lid !== undefined) {
		title = "Import League";
	} else if (props.type === "custom") {
		title =
			process.env.SPORT === "basketball" ? "New Custom League" : "New League";
	} else if (props.type === "random") {
		title = "New Random Players League";
	} else {
		title = "New Real Players League";
	}

	const handleSubmit = useCallback(
		async event => {
			event.preventDefault();

			if (props.lid !== undefined) {
				const result = await confirm(
					`Are you sure you want to import this league? All the data currently in "${props.name}" will be overwritten.`,
					{
						okText: title,
					},
				);
				if (!result) {
					return;
				}
			}

			setCreating(true);

			const actualLeagueFile: any = {};
			for (const key of [...keptKeys, "version"]) {
				if (leagueFile && leagueFile[key]) {
					actualLeagueFile[key] = leagueFile[key];
				}
			}

			if (actualLeagueFile.startingSeason === undefined) {
				actualLeagueFile.startingSeason = new Date().getFullYear();
			}

			const actualRandomizeRosters = keptKeys.includes("players")
				? randomizeRosters
				: false;

			const actualDifficulty = Object.values(DIFFICULTY).includes(difficulty)
				? difficulty
				: DIFFICULTY.Normal;

			try {
				const lid = await toWorker(
					"main",
					"createLeague",
					name,
					tid,
					actualLeagueFile,
					actualRandomizeRosters,
					actualDifficulty,
					props.lid,
				);

				let type: string = customize;
				if (type === "real") {
					type = String(realSeason);
				}
				api.bbgmPing("league", [lid, type]);
				realtimeUpdate([], `/l/${lid}`);
			} catch (err) {
				setCreating(false);
				console.log(err);
				logEvent({
					type: "error",
					text: err.message,
					persistent: true,
					saveToDb: false,
				});
			}
		},
		[
			customize,
			difficulty,
			keptKeys,
			leagueFile,
			name,
			props.lid,
			props.name,
			randomizeRosters,
			realSeason,
			tid,
			title,
		],
	);

	const handleNewLeagueFile = useCallback(
		(err, newLeagueFile) => {
			if (err) {
				setTeams(teamsDefault);
				setLeagueFile(null);
				setLoadingLeagueFile(false);
				setKeptKeys(initKeptKeys(null));
				return;
			}

			setLeagueFile(newLeagueFile);
			setLoadingLeagueFile(false);
			setKeptKeys(initKeptKeys(newLeagueFile));

			let newTeams = helpers.deepCopy(newLeagueFile.teams);
			if (newTeams) {
				for (const t of newTeams) {
					// Is pop hidden in season, like in manageTeams import?
					if (!t.hasOwnProperty("pop") && t.hasOwnProperty("seasons")) {
						t.pop = t.seasons[t.seasons.length - 1].pop;
					}

					// God, I hate being permissive...
					if (typeof t.pop !== "number") {
						t.pop = parseFloat(t.pop);
					}
					if (Number.isNaN(t.pop)) {
						t.pop = 1;
					}

					t.pop = parseFloat(t.pop.toFixed(2));
				}

				newTeams = helpers.addPopRank(newTeams);

				// Might get overwritten from gameAttributes of uploaded file, but that's ok
				if (tid >= newTeams.length) {
					setTid(-1);
				}

				setTeams(newTeams);
			} else {
				setTeams(teamsDefault);
			}

			// Need to update team and difficulty dropdowns?
			if (newLeagueFile.hasOwnProperty("gameAttributes")) {
				for (const ga of newLeagueFile.gameAttributes) {
					if (
						ga.key === "userTid" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						setTid(ga.value);
					} else if (
						ga.key === "difficulty" &&
						typeof ga.value === "number" &&
						!Number.isNaN(ga.value)
					) {
						setDifficulty(ga.value);
					}
				}
			}
		},
		[tid],
	);

	useTitleBar({ title, hideNewWindow: true });

	const displayedTeams = keptKeys.includes("teams") ? teams : teamsDefault;

	const disableWhileLoadingLeagueFile =
		(customize === "custom-rosters" ||
			customize === "custom-url" ||
			customize === "real") &&
		(leagueFile === null || loadingLeagueFile);

	return (
		<form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
			{props.lid !== undefined ? (
				<>
					<p>
						Here you can create a new league that overwrites one of your
						existing leagues. This is no different than deleting the existing
						league and creating a new one, it's just a little more convenient
						for people who do that a lot.
					</p>
					<p>
						If you just want to create a new league,{" "}
						<a href="/new_league">click here</a>.
					</p>
				</>
			) : null}
			<div className="row">
				<div className="col-sm-6">
					<div className="form-group">
						<label htmlFor="new-league-name">League name</label>
						<input
							id="new-league-name"
							className="form-control"
							type="text"
							value={name}
							onChange={event => {
								setName(event.target.value);
							}}
						/>
					</div>

					{customize === "real" ? (
						<SeasonsMenu
							value={realSeason}
							onLoading={season => {
								setRealSeason(season);
								if (season !== 2020) {
									setLoadingLeagueFile(true);
								}
							}}
							onDone={(season, leagueFile) => {
								if (season === 2020) {
									setTeams(teams2020);
									setLeagueFile(leagueFile);
									setLoadingLeagueFile(false);
									setKeptKeys(initKeptKeys(leagueFile));
								} else {
									handleNewLeagueFile(null, leagueFile);
								}
							}}
						/>
					) : null}

					<div className="form-group">
						<label htmlFor="new-league-team">Pick your team</label>
						<div className="input-group mb-1">
							<select
								id="new-league-team"
								className="form-control"
								disabled={disableWhileLoadingLeagueFile}
								value={tid}
								onChange={event => {
									setTid(parseInt(event.target.value, 10));
								}}
							>
								{orderBy(displayedTeams, ["region", "name"]).map(t => {
									return (
										<option key={t.tid} value={t.tid}>
											{t.region} {t.name}
										</option>
									);
								})}
							</select>
							<div className="input-group-append">
								<button
									className="btn btn-secondary"
									disabled={disableWhileLoadingLeagueFile}
									type="button"
									onClick={() => {
										const t =
											displayedTeams[
												Math.floor(Math.random() * displayedTeams.length)
											];
										setTid(t.tid);
									}}
								>
									Random
								</button>
							</div>
						</div>
						<PopText tid={tid} teams={displayedTeams} />
					</div>

					<div className="form-group">
						<label htmlFor="new-league-difficulty">Difficulty</label>
						<select
							id="new-league-difficulty"
							className="form-control mb-1"
							onChange={event => {
								setDifficulty(parseFloat(event.target.value));
							}}
							value={difficulty}
						>
							{Object.entries(DIFFICULTY).map(([text, numeric]) => (
								<option key={numeric} value={numeric}>
									{text}
								</option>
							))}
							{!Object.values(DIFFICULTY).includes(difficulty) ? (
								<option value={difficulty}>Custom (from league file)</option>
							) : null}
						</select>
						<span className="text-muted">
							Increasing difficulty makes AI teams more reluctant to trade with
							you, makes players less likely to sign with you, and makes it
							harder to turn a profit.
						</span>
					</div>

					{keptKeys.includes("players") ? (
						<div className="form-group">
							<label>Options</label>

							<div className="form-check">
								<label className="form-check-label">
									<input
										className="form-check-input"
										onChange={event => {
											setRandomizeRosters(event.target.checked);
										}}
										type="checkbox"
										checked={randomizeRosters}
									/>
									Shuffle rosters
								</label>
							</div>
						</div>
					) : null}

					<div className="text-center">
						<button
							type="submit"
							className="btn btn-lg btn-primary mt-3"
							disabled={creating || disableWhileLoadingLeagueFile}
						>
							{props.lid !== undefined ? "Import League" : "Create League"}
						</button>
					</div>
				</div>

				{props.type === "custom" || props.type === "real" ? (
					<div
						className={classNames(
							"col-sm-6 order-first order-sm-last mb-3 mb-sm-0",
							{
								"d-none d-sm-block": props.type === "real",
							},
						)}
					>
						<div className="card bg-light mt-1">
							{props.type === "real" ? (
								<>
									<ul className="list-group list-group-flush">
										<li className="list-group-item bg-light">
											<h3>Start in any season back to 1956</h3>
											<p className="mb-0">
												Players, teams, rosters, and contracts are generated
												from real data. Draft classes are included up to today.
											</p>
										</li>
										<li className="list-group-item bg-light">
											<h3>Watch your league evolve over time</h3>
											<p className="mb-0">
												There were only 8 teams in 1956, playing a very
												different brand of basketball than today. Live through
												expansion drafts, league rule changes, team relocations,
												economic growth, and changes in style of play.
											</p>
										</li>
										<li className="list-group-item bg-light">
											<h3>Every league is different</h3>
											<p className="mb-0">
												Rookies always start the same, but they have different
												career arcs in every league. See busts meet their
												potentials, see injury-shortened careers play out in
												full, and see new combinations of players lead to
												dynasties.
											</p>
										</li>
									</ul>
								</>
							) : null}
							{props.type === "custom" ? (
								<div className="card-body" style={{ marginBottom: "-1rem" }}>
									<h2 className="card-title">Customize</h2>
									<div className="form-group">
										<select
											className="form-control"
											onChange={event => {
												const newCustomize = event.target.value as any;
												setCustomize(newCustomize);
												if (
													process.env.SPORT === "basketball" &&
													newCustomize === "real"
												) {
													setRealSeason(2020);
													setTeams(teams2020);
													setLeagueFile(helpers.deepCopy(league2020));
													setLoadingLeagueFile(false);
													setKeptKeys(initKeptKeys(league2020));
												} else {
													setTeams(teamsDefault);
													setLeagueFile(null);
													setLoadingLeagueFile(false);
													setKeptKeys(initKeptKeys(null));
												}
											}}
											value={customize}
										>
											<option value="default">
												{process.env.SPORT === "basketball"
													? "Random players and teams"
													: "Default"}
											</option>
											{process.env.SPORT === "basketball" ? (
												<option value="real">Real players and teams</option>
											) : null}
											<option value="custom-rosters">Upload league file</option>
											<option value="custom-url">Enter league file URL</option>
										</select>
										{customize === "custom-rosters" ||
										customize === "custom-url" ? (
											<p className="mt-3">
												League files can contain teams, players, settings, and
												other data. You can create a league file by going to
												Tools > Export within a league, or by{" "}
												<a
													href={`https://${process.env.SPORT}-gm.com/manual/customization/`}
												>
													creating a custom league file
												</a>
												.
											</p>
										) : null}
									</div>
									{customize === "custom-rosters" ||
									customize === "custom-url" ? (
										<div className="my-3">
											<LeagueFileUpload
												onLoading={() => {
													setTeams(teamsDefault);
													setLoadingLeagueFile(true);
													setKeptKeys(initKeptKeys(null));
												}}
												onDone={handleNewLeagueFile}
												enterURL={customize === "custom-url"}
												hideLoadedMessage
											/>
										</div>
									) : null}

									<LeaguePartPicker
										leagueFile={leagueFile}
										keptKeys={keptKeys}
										setKeptKeys={setKeptKeys}
									/>
								</div>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</form>
	);
};

NewLeague.propTypes = {
	difficulty: PropTypes.number,
	lid: PropTypes.number,
	name: PropTypes.string.isRequired,
	lastSelectedTid: PropTypes.number.isRequired,
	type: PropTypes.string.isRequired,
};

export default NewLeague;
