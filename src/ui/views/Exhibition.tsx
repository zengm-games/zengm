import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useLayoutEffect, useState } from "react";
import { COURT, isSport, PHASE } from "../../common";
import type { Player, RealTeamInfo, View } from "../../common/types";
import { ActionButton, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, toWorker } from "../util";
import { applyRealTeamInfos, MAX_SEASON, MIN_SEASON } from "./NewLeague";

const getRandomSeason = () => {
	return Math.floor(Math.random() * (1 + MAX_SEASON - MIN_SEASON)) + MIN_SEASON;
};

export type ExhibitionTeam = {
	abbrev: string;
	imgURL: string;
	region: string;
	name: string;
	tid: number;
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

const SelectTeam = ({
	disabled,
	index,
	onChange,
	realTeamInfo,
}: {
	disabled: boolean;
	index: number;
	onChange: (t: ExhibitionTeam | undefined) => void;
	realTeamInfo: RealTeamInfo | undefined;
}) => {
	const [season, setSeason] = useState(getRandomSeason);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<ExhibitionTeam[]>([]);

	const loadTeams = async (season: number, tid?: number | "random") => {
		setLoadingTeams(true);
		onChange(undefined);

		const leagueInfo = await toWorker("main", "getLeagueInfo", {
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "lastSeason",
			includeSeasonInfo: true,
			pidOffset: index * 1e6,
		});
		const newTeams = orderBy(
			applyRealTeamInfos(leagueInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTeam;
		if (tid === "random") {
			const index = Math.floor(Math.random() * newTeams.length);
			newTeam = newTeams[index];
		} else {
			if (typeof tid === "number") {
				newTeam = newTeams.find(t => t.tid === tid);
			}
			if (!newTeam) {
				newTeam =
					newTeams.find(t => t.abbrev === prevTeam?.abbrev) ??
					newTeams.find(t => t.region === prevTeam?.region) ??
					newTeams[0];
			}
		}

		setTeams(newTeams as any);
		setTid(newTeam.tid);
		setLoadingTeams(false);

		onChange(newTeam as any);
	};

	useLayoutEffect(() => {
		try {
			const hash = location.hash.slice(1);
			if (hash) {
				const initialValuesAll = JSON.parse(
					decodeURIComponent(location.hash.slice(1)),
				);
				const initialValues = initialValuesAll.slice(
					3 * index,
					3 * (index + 1),
				);
				if (
					initialValues[0] === "real" &&
					initialValues[1] >= MIN_SEASON &&
					initialValues[1] <= MAX_SEASON
				) {
					setSeason(initialValues[1]);
					loadTeams(initialValues[1], initialValues[2]);
					return;
				}
			}
		} catch (error) {
			console.error(error);
		}

		loadTeams(season, "random");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const t = teams.find(t => t.tid === tid);

	const NUM_PLAYERS_TO_SHOW = 9;
	const playersToShow = t?.players.slice(0, NUM_PLAYERS_TO_SHOW) ?? [];

	return (
		<>
			<form>
				<div className="input-group">
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);
							await loadTeams(value);
						}}
						disabled={disabled}
						style={{
							maxWidth: 75,
						}}
					>
						{range(MAX_SEASON, MIN_SEASON - 1).map(i => (
							<option key={i} value={i}>
								{i}
							</option>
						))}
					</select>
					<select
						className="form-select"
						value={tid}
						onChange={event => {
							const newTid = parseInt(event.target.value);
							setTid(newTid);
							const newTeam = teams.find(t => t.tid === newTid);
							onChange(newTeam as any);
						}}
						disabled={loadingTeams || disabled}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
					</select>
					<button
						className="btn btn-light-bordered"
						type="button"
						disabled={disabled}
						onClick={async () => {
							const randomSeason = getRandomSeason();
							setSeason(randomSeason);
							await loadTeams(randomSeason, "random");
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
					<div className="ms-2" style={{ marginTop: 20 }}>
						<h2>{t.ovr} ovr</h2>
						{t.seasonInfo ? (
							<>
								<h2 className="mb-0">
									{t.seasonInfo.won}-{t.seasonInfo.lost}
								</h2>
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
							<span className="text-muted">-</span> {ratings.pos}{" "}
							<span className="text-muted">-</span> {ratings.ovr} ovr
							<div className="exhibition-stats text-muted">
								{stats?.gp > 0 ? (
									<>
										{" "}
										{helpers.roundStat(stats.pts / stats.gp, "pts")} pts /{" "}
										{helpers.roundStat(
											((stats.orb ?? 0) + stats.drb) / stats.gp,
											"trb",
										)}{" "}
										trb / {helpers.roundStat(stats.ast / stats.gp, "ast")} ast
									</>
								) : (
									<br />
								)}
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

const Exhibition = ({ realTeamInfo }: View<"exhibition">) => {
	const [teams, setTeams] = useState<
		[ExhibitionTeam | undefined, ExhibitionTeam | undefined]
	>([undefined, undefined]);
	const [neutralCourt, setNeutralCourt] = useState(true);
	const [simmingGame, setSimmingGame] = useState(false);
	const loadingTeams = teams[0] === undefined || teams[1] === undefined;

	if (!isSport("basketball")) {
		throw new Error("Not supported");
	}

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	console.log(teams);

	const setTeam = (index: 0 | 1, t: ExhibitionTeam | undefined) => {
		setTeams(teams => {
			let newTeams: typeof teams;
			if (index === 0) {
				newTeams = [t, teams[1]];
			} else {
				newTeams = [teams[0], t];
			}

			return newTeams;
		});
	};

	return (
		<>
			<div className="row gx-5 mb-3" style={{ maxWidth: 700 }}>
				<div className="col-12 col-sm-6">
					<h2>{neutralCourt ? "Team 1" : "Home"}</h2>
					<SelectTeam
						disabled={simmingGame}
						index={0}
						realTeamInfo={realTeamInfo}
						onChange={t => {
							setTeam(0, t);
						}}
					/>
				</div>
				<div className="col-12 col-sm-6 mt-3 mt-sm-0">
					<h2>{neutralCourt ? "Team 2" : "Away"}</h2>
					<SelectTeam
						disabled={simmingGame}
						index={1}
						realTeamInfo={realTeamInfo}
						onChange={t => {
							setTeam(1, t);
						}}
					/>
				</div>
			</div>

			<form
				onSubmit={async event => {
					event.preventDefault();

					setSimmingGame(true);

					const hash = encodeURIComponent(
						JSON.stringify([
							"real",
							teams[0]!.season,
							teams[0]!.tid,
							"real",
							teams[1]!.season,
							teams[1]!.tid,
						]),
					);

					await toWorker("main", "simExhibitionGame", {
						disableHomeCourtAdvantage: neutralCourt,
						hash,
						teams: teams as any,
					});
				}}
			>
				<div className="form-check mb-3">
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
		</>
	);
};

export default Exhibition;
