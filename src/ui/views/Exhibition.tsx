import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useEffect, useState } from "react";
import { COURT, isSport, PHASE } from "../../common";
import type { Player, RealTeamInfo, View } from "../../common/types";
import { ActionButton } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";
import { LiveGame } from "./LiveGame";
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

const SelectTeam = ({
	disabled,
	onChange,
	realTeamInfo,
}: {
	disabled: boolean;
	onChange: (t: ExhibitionTeam | undefined) => void;
	realTeamInfo: RealTeamInfo | undefined;
}) => {
	const [season, setSeason] = useState(getRandomSeason);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<ExhibitionTeam[]>([]);

	const loadTeams = async (season: number, randomTeam?: boolean) => {
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
		});
		const newTeams = orderBy(
			applyRealTeamInfos(leagueInfo.teams, realTeamInfo, season),
			["region", "name", "tid"],
		);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTeam;
		if (randomTeam) {
			const index = Math.floor(Math.random() * newTeams.length);
			newTeam = newTeams[index];
		} else {
			newTeam =
				newTeams.find(t => t.abbrev === prevTeam?.abbrev) ??
				newTeams.find(t => t.region === prevTeam?.region);
		}

		setTeams(newTeams as any);
		setTid(newTeam?.tid ?? 0);
		setLoadingTeams(false);

		onChange(newTeam as any);
	};

	useEffect(() => {
		loadTeams(season, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const t = teams.find(t => t.tid === tid);

	const NUM_PLAYERS_TO_SHOW = 10;
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
							await loadTeams(randomSeason, true);
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
				{playersToShow.map(p => (
					<li key={p.pid}>
						{p.firstName} {p.lastName} - {p.ratings.at(-1).ovr} ovr
					</li>
				))}
				{range(NUM_PLAYERS_TO_SHOW - playersToShow.length).map(i => (
					<li key={i}>
						<br />
					</li>
				))}
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
	const [exhibitionGame, setExhibitionGame] = useState<
		View<"liveGame"> | undefined
	>();

	const loadingTeams = teams[0] === undefined || teams[1] === undefined;

	if (!isSport("basketball")) {
		throw new Error("Not supported");
	}

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	if (exhibitionGame) {
		return <LiveGame {...exhibitionGame} />;
	}
	console.log(teams);

	return (
		<>
			<div className="row gx-5 mb-3" style={{ maxWidth: 700 }}>
				<div className="col-12 col-sm-6">
					<h2>{neutralCourt ? "Team 1" : "Home"}</h2>
					<SelectTeam
						disabled={simmingGame}
						realTeamInfo={realTeamInfo}
						onChange={t => setTeams(teams => [t, teams[1]])}
					/>
				</div>
				<div className="col-12 col-sm-6 mt-3 mt-sm-0">
					<h2>{neutralCourt ? "Team 2" : "Away"}</h2>
					<SelectTeam
						disabled={simmingGame}
						realTeamInfo={realTeamInfo}
						onChange={t => setTeams(teams => [teams[0], t])}
					/>
				</div>
			</div>

			<form
				onSubmit={async event => {
					event.preventDefault();

					console.log("SUBMIT", teams);

					setSimmingGame(true);

					const liveSimInfo = await toWorker("main", "simExhibitionGame", {
						teams: teams as any,
						disableHomeCourtAdvantage: neutralCourt,
					});
					setExhibitionGame(liveSimInfo);
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
