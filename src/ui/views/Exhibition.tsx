import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import {
	COURT,
	EXHIBITION_GAME_SETTINGS,
	isSport,
	PHASE,
	SPORT_HAS_REAL_PLAYERS,
} from "../../common";
import defaultGameAttributes from "../../common/defaultGameAttributes";
import type {
	GameAttributesLeague,
	Player,
	RealTeamInfo,
	Team,
	View,
} from "../../common/types";
import { ActionButton, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import {
	helpers,
	processPlayerStats,
	safeLocalStorage,
	toWorker,
} from "../util";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from "./NewLeague";
import SettingsForm from "./Settings/SettingsForm";

export const getRandomSeason = (start: number, end: number) => {
	return Math.floor(Math.random() * (1 + end - start)) + start;
};

export type ExhibitionTeam = {
	season: number;
	seasonInfo?: {
		won: number;
		lost: number;
		tied: number;
		otl: number;
		roundsWonText?: string;
	};
	players: Player[];
	ovr: number;
} & Pick<
	Team,
	| "abbrev"
	| "imgURL"
	| "region"
	| "name"
	| "tid"
	| "depth"
	| "colors"
	| "jersey"
	| "stadiumCapacity"
>;

type ExhibitionLeague = {
	lid: number;
	name: string;
};

const playerRowClassName = (i: number) => {
	if (i === 0) {
		return;
	}

	if (i < 5) {
		return "mt-1";
	}

	return "mt-1 d-none d-sm-block";
};

export type ExhibitionGameAttributes = Pick<
	GameAttributesLeague,
	(typeof EXHIBITION_GAME_SETTINGS)[number]
>;

const getGameAttributes = (gameAttributes?: Partial<GameAttributesLeague>) => {
	const output: ExhibitionGameAttributes = {} as any;
	for (const key of EXHIBITION_GAME_SETTINGS) {
		if (gameAttributes?.[key] !== undefined) {
			(output as any)[key] = gameAttributes[key];
		} else {
			(output as any)[key] = defaultGameAttributes[key];
		}
	}

	return output;
};

export type ExhibitionLeagueWithSeasons =
	| {
			type: "real";
			seasonStart: number;
			seasonEnd: number;
	  }
	| {
			type: "league";
			lid: number;
			seasonStart: number;
			seasonEnd: number;
	  };

const PlayerStatsSummary = ({ stats }: { stats: Player["stats"][number] }) => {
	if (!stats || stats.gp === undefined || stats.gp === 0) {
		return <br />;
	}

	if (isSport("basketball")) {
		return (
			<>
				{helpers.roundStat(stats.pts / stats.gp, "pts")} pts /{" "}
				{helpers.roundStat(((stats.orb ?? 0) + stats.drb) / stats.gp, "trb")}{" "}
				trb / {helpers.roundStat(stats.ast / stats.gp, "ast")} ast
			</>
		);
	}

	const processed = processPlayerStats(stats, ["keyStats"]);
	return processed.keyStats;
};

const SelectTeam = ({
	disabled,
	index,
	initialTeam,
	leagues,
	onChange,
	realTeamInfo,
}: {
	disabled: boolean;
	index: number;
	initialTeam?: CachedTeam;
	leagues: ExhibitionLeague[];
	onChange: (
		league: ExhibitionLeagueWithSeasons,
		t: ExhibitionTeam | undefined,
		gameAttributes: ExhibitionGameAttributes,
	) => void;
	realTeamInfo: RealTeamInfo | undefined;
}) => {
	const [league, setLeague] = useState<
		ExhibitionLeagueWithSeasons | undefined
	>();
	const [season, setSeason] = useState(0);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<ExhibitionTeam[]>([]);
	const [gameAttributes, setGameAttributes] =
		useState<ExhibitionGameAttributes>(getGameAttributes);

	const loadLeague = async (lid: "real" | number) => {
		let newLeague: typeof league;
		if (lid === "real") {
			newLeague = {
				type: "real",
				seasonStart: MIN_SEASON,
				seasonEnd: MAX_SEASON,
			};
		} else {
			const { seasonStart, seasonEnd } = await toWorker(
				"exhibitionGame",
				"getSeasons",
				lid,
			);
			newLeague = {
				type: "league",
				lid,
				seasonStart,
				seasonEnd,
			};
		}

		setLeague(newLeague);

		return newLeague;
	};

	const loadTeams = async (
		league: ExhibitionLeagueWithSeasons,
		season: number,
		tidInput?: number | "random",
	) => {
		setLoadingTeams(true);
		onChange(league, undefined, getGameAttributes());

		const pidOffset = index * 1e6;

		const newInfo = await toWorker(
			"exhibitionGame",
			"getSeasonInfo",
			league.type === "real"
				? {
						type: "real",
						season,
						pidOffset,
				  }
				: {
						type: "league",
						lid: league.lid,
						season,
						pidOffset,
				  },
		);
		const newTeams = orderBy(
			applyRealTeamInfos(newInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTeam;
		if (tidInput === "random") {
			const index = Math.floor(Math.random() * newTeams.length);
			newTeam = newTeams[index];
		} else {
			if (typeof tidInput === "number") {
				newTeam = newTeams.find(t => t.tid === tidInput);
			}
			if (!newTeam) {
				newTeam =
					newTeams.find(t => t.abbrev === prevTeam?.abbrev) ??
					newTeams.find(t => t.region === prevTeam?.region) ??
					newTeams[0];
			}
		}

		const newGameAttributes = getGameAttributes(newInfo.gameAttributes);

		setTeams(newTeams as any);
		setTid(newTeam.tid);
		setGameAttributes(newGameAttributes);
		setLoadingTeams(false);

		onChange(league, newTeam as any, newGameAttributes);
	};

	const awaitingInitialLoad = useRef(true);
	useLayoutEffect(() => {
		const run = async () => {
			// We only want to do this once, on initial load ideally, but we may have to wait for leagues to be provided
			if (
				!awaitingInitialLoad.current ||
				(!SPORT_HAS_REAL_PLAYERS && leagues.length === 0)
			) {
				return;
			}
			awaitingInitialLoad.current = false;

			try {
				if (initialTeam) {
					const lid = initialTeam.type === "real" ? "real" : initialTeam.lid;
					const league = await loadLeague(lid);
					setSeason(initialTeam.season);
					await loadTeams(league, initialTeam.season, initialTeam.tid);
					return;
				}
			} catch (error) {
				console.error(error);
			}

			const league = await loadLeague(
				SPORT_HAS_REAL_PLAYERS ? "real" : leagues[0].lid,
			);
			const randomSeason = getRandomSeason(
				league.seasonStart,
				league.seasonEnd,
			);
			setSeason(randomSeason);
			await loadTeams(league, randomSeason, "random");
		};

		run();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [leagues]);

	const t = teams.find(t => t.tid === tid);
	let record;
	if (t?.seasonInfo) {
		record = helpers.formatRecord(t.seasonInfo);
	}

	const NUM_PLAYERS_TO_SHOW = 9;
	const playersToShow = t?.players.slice(0, NUM_PLAYERS_TO_SHOW) ?? [];

	return (
		<>
			<form>
				<div className="mb-2">
					<select
						className="form-select"
						value={
							!league ? undefined : league.type === "real" ? "real" : league.lid
						}
						disabled={disabled || !league}
						onChange={async event => {
							const value = event.target.value;
							const lid = value === "real" ? value : parseInt(value);
							const league = await loadLeague(lid);
							setSeason(league.seasonEnd);
							await loadTeams(league, league.seasonEnd);
						}}
					>
						{SPORT_HAS_REAL_PLAYERS ? (
							<option value="real">Real historical teams</option>
						) : null}
						{leagues.map(league => (
							<option key={league.lid} value={league.lid}>
								{league.name}
							</option>
						))}
					</select>
				</div>
				<div className="input-group">
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);
							await loadTeams(league!, value);
						}}
						disabled={disabled || !league}
						style={{
							maxWidth: 75,
						}}
					>
						{league
							? range(league.seasonEnd, league.seasonStart - 1).map(i => (
									<option key={i} value={i}>
										{i}
									</option>
							  ))
							: null}
					</select>
					<select
						className="form-select"
						value={teams.length === 0 ? "loading" : tid}
						onChange={event => {
							const newTid = parseInt(event.target.value);
							setTid(newTid);
							const newTeam = teams.find(t => t.tid === newTid);
							onChange(league!, newTeam as any, gameAttributes);
						}}
						disabled={loadingTeams || disabled || !league}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
						{teams.length === 0 ? (
							<option value="loading">Loading...</option>
						) : null}
					</select>
					<button
						className="btn btn-light-bordered"
						type="button"
						disabled={disabled || !league}
						onClick={async () => {
							const randomSeason = getRandomSeason(
								league!.seasonStart,
								league!.seasonEnd,
							);
							setSeason(randomSeason);
							await loadTeams(league!, randomSeason, "random");
						}}
					>
						Random
					</button>
				</div>
			</form>

			<div className="d-flex my-2">
				<div
					style={{ width: 128, height: 128 }}
					className="d-flex align-items-center justify-content-center"
				>
					{t?.imgURL ? (
						<img className="mw-100 mh-100" src={t.imgURL} alt="Team logo" />
					) : null}
				</div>
				{t ? (
					<div className="ms-2" style={{ marginTop: 22 }}>
						<h2>{t.ovr} ovr</h2>
						{t.seasonInfo ? (
							<>
								<h2 className="mb-0">{record}</h2>
								{t.seasonInfo.roundsWonText}
							</>
						) : null}
					</div>
				) : null}
			</div>
			<ul className="list-unstyled mb-0">
				{playersToShow.map((p, i) => {
					const stats = p.stats.at(-1);
					const ratings = p.ratings.at(-1);

					return (
						<li key={p.pid} className={playerRowClassName(i)}>
							<PlayerNameLabels
								pid={p.pid}
								firstName={p.firstName}
								lastName={p.lastName}
								jerseyNumber={p.stats.at(-1)?.jerseyNumber ?? p.jerseyNumber}
								skills={p.ratings.at(-1)!.skills}
								fullNames
								disableNameLink
								season={season}
							/>{" "}
							<span className="text-body-secondary">-</span> {ratings.pos}{" "}
							<span className="text-body-secondary">-</span> {ratings.ovr} ovr
							<div className="exhibition-stats text-body-secondary">
								<PlayerStatsSummary stats={stats} />
							</div>
						</li>
					);
				})}
				{range(NUM_PLAYERS_TO_SHOW - playersToShow.length).map(j => {
					const i = playersToShow.length + j;
					return (
						<li key={i} className={playerRowClassName(i)}>
							<br />
							<br />
						</li>
					);
				})}
			</ul>
		</>
	);
};

type ExhibitionTeamAndSettings = {
	gameAttributes: ExhibitionGameAttributes;
	league: ExhibitionLeagueWithSeasons;
	t: ExhibitionTeam;
};

const CACHE_KEY = "lastExhibitionGame";

type GameAttributesInfo =
	| {
			type: "t0" | "t1" | "default";
	  }
	| {
			type: "custom";
			custom: ExhibitionGameAttributes;
	  };

type CachedTeam =
	| {
			type: "real";
			season: number;
			tid: number;
	  }
	| {
			type: "league";
			lid: number;
			season: number;
			tid: number;
	  };
type CachedSettings = {
	gameAttributesInfo: GameAttributesInfo;
	neutralCourt: boolean;
	playoffIntensity: boolean;
	swapHomeAway?: boolean;
	teams: [CachedTeam, CachedTeam];
};

const useLeagues = () => {
	const [leagues, setLeagues] = useState<ExhibitionLeague[] | undefined>();

	useLayoutEffect(() => {
		const run = async () => {
			const newLeagues = await toWorker(
				"exhibitionGame",
				"getLeagues",
				undefined,
			);
			setLeagues(newLeagues);
		};

		run();
	}, []);

	return leagues;
};

const Exhibition = ({ defaultSettings, realTeamInfo }: View<"exhibition">) => {
	// Default state comes from cache of last exhibition game, if possible
	const defaultState = useMemo(() => {
		try {
			const json = safeLocalStorage.getItem(CACHE_KEY);
			if (json) {
				return JSON.parse(json) as CachedSettings;
			}
		} catch (error) {}

		return {
			gameAttributesInfo: {
				type: "t1",
			} as GameAttributesInfo,
			neutralCourt: true,
			playoffIntensity: true,
			swapHomeAway: false,
			teams: undefined,
		};
	}, []);

	const leagues = useLeagues();
	const [teams, setTeams] = useState<
		[
			ExhibitionTeamAndSettings | undefined,
			ExhibitionTeamAndSettings | undefined,
		]
	>([undefined, undefined]);
	const [neutralCourt, setNeutralCourt] = useState(defaultState.neutralCourt);
	const [swapHomeAway, setSwapHomeAway] = useState(
		defaultState.swapHomeAway ?? false,
	);
	const [playoffIntensity, setPlayoffIntensity] = useState(
		defaultState.playoffIntensity,
	);
	const [simmingGame, setSimmingGame] = useState(false);
	const [gameAttributesInfo, setGameAttributesInfo] =
		useState<GameAttributesInfo>(defaultState.gameAttributesInfo);
	const [showCustomizeModal, setShowCustomizeModal] = useState(false);

	const loadingTeams = teams[0] === undefined || teams[1] === undefined;

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	const setTeam = (
		index: 0 | 1,
		league: ExhibitionLeagueWithSeasons,
		t: ExhibitionTeam | undefined,
		gameAttributes: ExhibitionGameAttributes,
	) => {
		setTeams(teams => {
			let newTeams: typeof teams;
			const entry = t === undefined ? undefined : { gameAttributes, league, t };
			if (index === 0) {
				newTeams = [entry, teams[1]];
			} else {
				newTeams = [teams[0], entry];
			}

			return newTeams;
		});
	};

	const getGameAttributesByType = () => {
		let gameAttributes;
		if (gameAttributesInfo.type === "custom") {
			gameAttributes = gameAttributesInfo.custom;
		} else if (gameAttributesInfo.type === "t0") {
			gameAttributes = getGameAttributes(teams[0]?.gameAttributes);
		} else if (gameAttributesInfo.type === "t1") {
			gameAttributes = getGameAttributes(teams[1]?.gameAttributes);
		} else {
			gameAttributes = getGameAttributes();
		}
		return gameAttributes;
	};

	const onHideCustomizeModal = () => {
		setShowCustomizeModal(false);
	};

	const gameSimSettingsText = (
		entry: ExhibitionTeamAndSettings | undefined,
	) => {
		if (!entry) {
			return "Loading...";
		}

		const league = entry.league;
		if (league.type === "real") {
			return entry.t.season;
		}

		return leagues?.find(league2 => league2.lid === league.lid)?.name ?? "???";
	};

	let gameAttributesWarning;
	if (gameAttributesInfo.type === "t0" || gameAttributesInfo.type === "t1") {
		const entry = teams[gameAttributesInfo.type === "t0" ? 0 : 1];
		const league = entry?.league;
		if (league && league.type !== "real") {
			const league2 = leagues?.find(league2 => league2.lid === league.lid);
			if (league2 && entry.t.season !== league.seasonEnd) {
				gameAttributesWarning = (
					<div className="text-danger mb-2">
						Past season game sim settings are currently not saved, so the latest
						settings in {league2.name} will be used.
					</div>
				);
			}
		}
	}

	const leaguesDefined = useMemo(() => leagues ?? [], [leagues]);

	if (!SPORT_HAS_REAL_PLAYERS && leagues?.length === 0) {
		return (
			<p>
				You need to <a href="/new_league">create some leagues</a> before you
				play an exhibition game.
			</p>
		);
	}

	return (
		<div className="d-lg-flex">
			<div
				className="row gx-5 mb-4 mb-lg-0 me-lg-4 flex-shrink-0"
				style={{ maxWidth: 700, width: "100%" }}
			>
				<div className="col-12 col-sm-6">
					<h2>{neutralCourt ? "Team 1" : swapHomeAway ? "Home" : "Away"}</h2>
					<SelectTeam
						disabled={simmingGame}
						index={1}
						initialTeam={defaultState.teams?.[1]}
						leagues={leaguesDefined}
						realTeamInfo={realTeamInfo}
						onChange={(league, t, gameAttributes) => {
							setTeam(1, league, t, gameAttributes);
						}}
					/>
				</div>
				<div className="col-12 col-sm-6 mt-3 mt-sm-0">
					<h2>{neutralCourt ? "Team 2" : swapHomeAway ? "Away" : "Home"}</h2>
					<SelectTeam
						disabled={simmingGame}
						index={0}
						initialTeam={defaultState.teams?.[0]}
						leagues={leaguesDefined}
						realTeamInfo={realTeamInfo}
						onChange={(league, t, gameAttributes) => {
							setTeam(0, league, t, gameAttributes);
						}}
					/>
				</div>
			</div>

			<form
				onSubmit={async event => {
					event.preventDefault();

					setSimmingGame(true);

					const gameAttributes = getGameAttributesByType();

					const toSave: CachedSettings = {
						gameAttributesInfo,
						neutralCourt,
						playoffIntensity,
						swapHomeAway: neutralCourt ? undefined : swapHomeAway,
						teams: teams.map(entry => {
							if (!entry) {
								throw new Error("Missing entry");
							}

							if (entry.league.type === "real") {
								return {
									type: "real",
									season: entry.t.season,
									tid: entry.t.tid,
								};
							}

							return {
								type: "league",
								lid: entry.league.lid,
								season: entry.t.season,
								tid: entry.t.tid,
							};
						}) as [CachedTeam, CachedTeam],
					};
					safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(toSave));

					const simTeams = teams.map(entry => entry?.t) as [
						ExhibitionTeam,
						ExhibitionTeam,
					];

					if (swapHomeAway && !neutralCourt) {
						simTeams.reverse();
					}

					await toWorker("exhibitionGame", "simExhibitionGame", {
						disableHomeCourtAdvantage: neutralCourt,
						gameAttributes,
						phase: playoffIntensity ? PHASE.PLAYOFFS : PHASE.REGULAR_SEASON,
						teams: simTeams,
					});
				}}
			>
				<div className="mb-2" style={{ width: 200 }}>
					<label htmlFor="gameAttributesSelect" className="form-label h2">
						Game Sim Settings
					</label>
					<div className="input-group">
						<select
							id="gameAttributesSelect"
							className="form-select"
							value={gameAttributesInfo.type}
							onChange={async event => {
								const type = event.target.value;

								if (type === "custom") {
									throw new Error("Should never happen");
								} else {
									setGameAttributesInfo({
										type: type as any,
									});
								}
							}}
							disabled={simmingGame || loadingTeams}
						>
							<option value="t1">{gameSimSettingsText(teams[1])}</option>
							{!teams[0] || teams[0].t.season !== teams[1]?.t.season ? (
								<option value="t0">{gameSimSettingsText(teams[0])}</option>
							) : null}
							<option value="default">Default</option>
							{gameAttributesInfo.type === "custom" ? (
								<option value="custom">Custom</option>
							) : null}
						</select>
						<button
							className="btn btn-light-bordered"
							type="button"
							disabled={simmingGame || loadingTeams}
							onClick={() => {
								const custom = getGameAttributesByType();
								setGameAttributesInfo({
									type: "custom",
									custom,
								});
								setShowCustomizeModal(true);
							}}
						>
							Customize
						</button>
					</div>
				</div>
				{gameAttributesWarning}

				<div className="d-flex mb-3">
					<div>
						<div className="form-check mb-2">
							<input
								className="form-check-input"
								type="checkbox"
								id="neutralCourtCheck"
								checked={neutralCourt}
								disabled={simmingGame}
								onChange={() => {
									setNeutralCourt(!neutralCourt);
								}}
							/>
							<label className="form-check-label" htmlFor="neutralCourtCheck">
								Neutral {COURT}
							</label>
						</div>

						{isSport("basketball") ? (
							<div className="form-check">
								<input
									className="form-check-input"
									type="checkbox"
									id="playoffIntensityCheck"
									checked={playoffIntensity}
									disabled={simmingGame}
									onChange={() => {
										setPlayoffIntensity(!playoffIntensity);
									}}
								/>
								<label
									className="form-check-label"
									htmlFor="playoffIntensityCheck"
								>
									Playoff intensity
								</label>
							</div>
						) : null}
					</div>

					{!neutralCourt ? (
						<button
							className="btn py-1 btn-light-bordered ms-2"
							type="button"
							onClick={() => {
								setSwapHomeAway(swap => !swap);
							}}
						>
							Swap
							<br />
							home/away
						</button>
					) : null}
				</div>

				<ActionButton
					disabled={loadingTeams}
					processing={simmingGame}
					processingText="Simming"
					size="lg"
					type="submit"
				>
					Sim Game
				</ActionButton>
			</form>

			<Modal
				size="xl"
				show={showCustomizeModal}
				onHide={onHideCustomizeModal}
				scrollable
			>
				<Modal.Body>
					<SettingsForm
						onSave={settings => {
							setGameAttributesInfo({
								type: "custom",
								// getGameAttributes call should not be necessary, but let's just be save
								custom: getGameAttributes(settings as ExhibitionGameAttributes),
							});
							onHideCustomizeModal();
						}}
						onCancel={onHideCustomizeModal}
						initialSettings={{
							...defaultSettings,
							...getGameAttributesByType(),
							godMode: true,
						}}
						settingsShown={EXHIBITION_GAME_SETTINGS}
						hideShortcuts
						isInsideModal
						hideGodModeToggle
					/>
				</Modal.Body>
			</Modal>
		</div>
	);
};

export default Exhibition;
