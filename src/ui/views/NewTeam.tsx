import { useState, type ChangeEvent, type FormEvent } from "react";
import { PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, realtimeUpdate, toWorker } from "../util";
import type { View } from "../../common/types";
import {
	PlayerNameLabels,
	PopText,
	RecordAndPlayoffs,
	SafeHtml,
} from "../components";
import classNames from "classnames";

const HistoryBlock = ({
	won,
	lost,
	tied,
	otl,
	winp,
	finalsAppearances,
	championships,
	lastChampionship,
	userOrTotal,
}: View<"newTeam">["teams"][number]["total"] & {
	userOrTotal: "user" | "total";
}) => {
	return (
		<div>
			<h4>{userOrTotal === "user" ? "Under your control" : "Total"}</h4>
			Record:{" "}
			{helpers.formatRecord({
				won,
				lost,
				otl,
				tied,
			})}{" "}
			({helpers.roundWinp(winp)})<br />
			Finals record: {championships}-{finalsAppearances - championships}
			<br />
			Last championship:{" "}
			{lastChampionship === undefined ? (
				<span className="text-danger">never</span>
			) : (
				lastChampionship
			)}
		</div>
	);
};

const PlayerList = ({
	challengeNoRatings,
	players,
	season,
}: {
	challengeNoRatings: boolean;
	players: any[];
	season: number;
}) => {
	if (players.length === 0) {
		return <p>None</p>;
	}

	return (
		<ol className="list-unstyled mb-0">
			{players.map((p, i) => (
				<li
					key={p.pid}
					className={classNames({
						"mt-2": i > 0,
					})}
				>
					<span className="p-1">
						<PlayerNameLabels
							pid={p.pid}
							season={season}
							pos={p.ratings.pos}
							skills={p.ratings.skills}
							watch={p.watch}
							firstName={p.firstName}
							lastName={p.lastName}
						/>
					</span>
					<br />
					{!challengeNoRatings ? (
						<>
							{p.ratings.ovr} ovr, {p.ratings.pot} pot,{" "}
						</>
					) : null}
					{p.age} yo
				</li>
			))}
		</ol>
	);
};

const NewTeam = ({
	challengeNoRatings,
	confs,
	disabled,
	expansion,
	gameOver,
	godMode,
	numActiveTeams,
	numPlayoffRounds,
	otherTeamsWantToHire,
	phase,
	playoffsByConf,
	season,
	teams,
	userTid,
}: View<"newTeam">) => {
	const [tid, setTid] = useState(
		teams && teams.length > 0 ? teams[0].tid : undefined,
	);

	if (tid === undefined && teams && teams.length > 0) {
		setTid(teams[0].tid);
	}

	const handleTidChange = (event: ChangeEvent<HTMLSelectElement>) => {
		setTid(parseInt(event.currentTarget.value));
	};

	const handleNewTeam = async (event: FormEvent) => {
		event.preventDefault();

		if (tid !== undefined) {
			await toWorker("main", "switchTeam", tid);
			realtimeUpdate(
				[],
				expansion
					? helpers.leagueUrl(["protect_players"])
					: helpers.leagueUrl([]),
			);
		}
	};

	let title;
	if (expansion && disabled) {
		title = "Pick an Expansion Team";
	} else if (expansion) {
		title = "Switch To Expansion Team?";
	} else if (otherTeamsWantToHire) {
		title = "Job Offers From Other Teams";
	} else {
		title = "Pick a New Team";
	}

	useTitleBar({ title, hideNewWindow: true });

	if (!expansion && !gameOver && !godMode && !otherTeamsWantToHire) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					You cannot switch to a new team now unless you enable{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			</div>
		);
	}

	if (phase === PHASE.RESIGN_PLAYERS) {
		return (
			<div>
				<h2>Error</h2>
				<p>
					Changing your team while re-signing players currently breaks things.
					Please play until free agency and then you can switch teams.
				</p>
			</div>
		);
	}

	let message;
	if (expansion) {
		if (disabled) {
			message = (
				<p>
					Your old team no longer exists, but fortunately there are some new
					teams willing to hire you.
				</p>
			);
		} else if (gameOver) {
			message = (
				<p>
					You've been fired by your current team, so pick an expansion team to
					continue.
				</p>
			);
		} else {
			message = (
				<p>
					You can either stay with your current team or take control of a new
					expansion team.
				</p>
			);
		}
	} else if (godMode) {
		message = (
			<p>
				Because you're in <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
				, you can become the GM of any team.
			</p>
		);
	} else if (disabled) {
		message = (
			<p>
				Your team no longer exists! Don't worry, it wasn't your fault. Probably.
				Look, at least some other teams are willing to hire you.
			</p>
		);
	} else if (otherTeamsWantToHire) {
		message = (
			<p>
				You've had so much success that some other teams are interested in
				hiring you to be their GM. Accept an offer below, or ignore this to
				continue with your current team.
			</p>
		);
	} else {
		message = (
			<p>
				After you were fired, your agent tried to get you job offers from other
				teams. Unfortunately, he was only able to secure offers from some of the
				worst teams in the league. Are you interested in running any of these
				teams?
			</p>
		);
	}

	let submitText;
	if (expansion) {
		submitText = "Continue With Expansion Draft";
	} else if (godMode) {
		submitText = "Switch Team";
	} else {
		submitText = tid === userTid ? "Turn Down Job Offers" : "Accept New Job";
	}

	const t = teams.find(t => t.tid === tid);

	return (
		<>
			{message}

			<form className="d-flex" onSubmit={handleNewTeam}>
				<select
					className="form-select me-2"
					style={{
						width: "inherit",
					}}
					onChange={handleTidChange}
					value={tid}
				>
					{teams.map(t => {
						return (
							<option key={t.tid} value={t.tid}>
								{(expansion || otherTeamsWantToHire) && t.tid === userTid
									? `Stay with my current team in ${t.region}`
									: `${t.region} ${t.name}`}
							</option>
						);
					})}
				</select>

				<button className="btn btn-primary" disabled={tid === undefined}>
					{submitText}
				</button>
			</form>

			{t ? (
				<div className="d-flex flex-wrap mt-3 gap-3">
					{t.imgURL ? (
						<div className="d-flex flex-column align-items-center gap-4">
							<div style={{ width: 128 }}>
								<a href={helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`])}>
									<img
										className="mw-100 mh-100"
										src={t.imgURL}
										alt="Team logo"
									/>
								</a>
							</div>
							{t.imgURLSmall ? (
								<div style={{ width: 32 }}>
									<a
										href={helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`])}
									>
										<img
											className="mw-100 mh-100"
											src={t.imgURLSmall}
											alt="Team logo"
										/>
									</a>
								</div>
							) : null}
						</div>
					) : null}
					<div>
						<h3>Team info</h3>
						{expansion && t.tid !== userTid ? (
							<>
								New expansion team!
								<br />
							</>
						) : (
							<>
								<RecordAndPlayoffs
									abbrev={t.abbrev}
									tid={t.tid}
									lost={t.seasonAttrs.lost}
									season={t.seasonAttrs.season}
									tied={t.seasonAttrs.tied}
									otl={t.seasonAttrs.otl}
									won={t.seasonAttrs.won}
									playoffsByConf={playoffsByConf}
									numPlayoffRounds={numPlayoffRounds}
									playoffRoundsWon={t.seasonAttrs.playoffRoundsWon}
								/>
								{!challengeNoRatings ? (
									<>
										<br />
										Team rating: {t.ovr}/100
									</>
								) : null}
							</>
						)}
						<br />
						{confs[t.cid] ? confs[t.cid].name : null}
						<br />
						<PopText tid={tid} teams={teams} numActiveTeams={numActiveTeams} />

						<h3 className="mt-4">Franchise history</h3>
						<HistoryBlock {...t.total} userOrTotal="total" />
						<div className="mt-2">
							<HistoryBlock {...t.user} userOrTotal="user" />
						</div>
					</div>
					<div className="d-flex flex-wrap gap-3">
						<div>
							<h3>Top players</h3>
							<PlayerList
								challengeNoRatings={challengeNoRatings}
								players={t.players}
								season={season}
							/>
						</div>
						<div>
							<h3>Upcoming draft picks</h3>
							<ul className="list-unstyled mb-0">
								{t.draftPicks.map((dp, i) => {
									return (
										<li key={i}>
											<SafeHtml dirty={dp.desc} />
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
};

export default NewTeam;
