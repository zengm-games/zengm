import classNames from "classnames";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import {
	MoreLinks,
	PlayerNameLabels,
	RatingWithChange,
	RecordAndPlayoffs,
} from "../components";
import { arrow } from "./Trade/Summary";

const PlayerList = ({
	challengeNoRatings,
	players,
	season,
	showDraftPick,
	userTid,
}: {
	challengeNoRatings: boolean;
	players: any[];
	season: number;
	showDraftPick?: boolean;
	userTid: number;
}) => {
	if (players.length === 0) {
		return <p>None</p>;
	}

	return (
		<ol
			style={{
				paddingLeft: 20,
			}}
		>
			{players.map((p, i) => (
				<li
					key={p.pid}
					className={classNames({
						"mt-2": i > 0,
					})}
				>
					<span
						className={classNames({
							"p-1 table-info": userTid === p.tid,
						})}
					>
						<PlayerNameLabels
							pid={p.pid}
							season={season}
							pos={p.ratings.pos}
							skills={p.ratings.skills}
							watch={p.watch}
							firstName={p.firstName}
							lastName={p.lastName}
						/>
						<span className="ms-2">
							{p.prevTid !== undefined ? (
								<>
									<a
										href={helpers.leagueUrl([
											"roster",
											`${p.prevAbbrev}_${p.prevTid}`,
											season - 1,
										])}
									>
										{p.prevAbbrev}
									</a>{" "}
									{arrow}{" "}
								</>
							) : null}
							<a
								href={helpers.leagueUrl([
									"roster",
									`${p.abbrev}_${p.tid}`,
									season,
								])}
							>
								{p.abbrev}
							</a>
						</span>
					</span>
					<br />
					{!challengeNoRatings ? (
						<>
							<RatingWithChange change={p.ratings.dovr}>
								{p.ratings.ovr}
							</RatingWithChange>{" "}
							ovr,{" "}
							<RatingWithChange change={p.ratings.dpot}>
								{p.ratings.pot}
							</RatingWithChange>{" "}
							pot,{" "}
						</>
					) : null}
					{p.age} yo
					{showDraftPick ? (
						<>
							,{" "}
							{p.draft.round > 0
								? `${p.draft.round}-${p.draft.pick}`
								: "undrafted"}
						</>
					) : null}
				</li>
			))}
		</ol>
	);
};

const TeamList = ({
	challengeNoRatings,
	numPlayoffRounds,
	playoffsByConf,
	teams,
	season,
	userTid,
}: {
	challengeNoRatings: boolean;
	numPlayoffRounds: number;
	playoffsByConf: boolean;
	teams: View<"seasonPreview">["teamsTop"];
	season: number;
	userTid: number;
}) => {
	if (teams.length === 0) {
		return <p>None</p>;
	}

	return (
		<ol
			style={{
				paddingLeft: 15,
			}}
		>
			{teams.map((t, i) => (
				<li
					key={t.tid}
					className={classNames({
						"mt-3": i > 0,
					})}
				>
					<span
						className={classNames({
							"p-1 table-info": userTid === t.tid,
						})}
					>
						<a
							href={helpers.leagueUrl([
								"roster",
								`${t.abbrev}_${t.tid}`,
								season,
							])}
						>
							{t.region} {t.name}
						</a>
						{!challengeNoRatings ? (
							<>
								, <RatingWithChange change={t.dovr}>{t.ovr}</RatingWithChange>{" "}
								ovr
							</>
						) : null}
					</span>
					{t.lastSeason ? (
						<div>
							Last season:{" "}
							<RecordAndPlayoffs
								abbrev={t.abbrev}
								lost={t.lastSeason.lost}
								option="noSeason"
								playoffsByConf={playoffsByConf}
								numPlayoffRounds={numPlayoffRounds}
								otl={t.lastSeason.otl}
								playoffRoundsWon={t.lastSeason.playoffRoundsWon}
								season={season - 1}
								tid={t.tid}
								tied={t.lastSeason.tied}
								won={t.lastSeason.won}
							/>
						</div>
					) : null}
					{t.players.map(p => (
						<div key={p.pid} className="text-body-secondary mt-2">
							<PlayerNameLabels
								pid={p.pid}
								season={season}
								pos={p.ratings.pos}
								skills={p.ratings.skills}
								watch={p.watch}
								firstName={p.firstName}
								lastName={p.lastName}
							/>
							<br />
							{!challengeNoRatings ? (
								<>
									{p.ratings.ovr} ovr, {p.ratings.pot} pot,{" "}
								</>
							) : null}
							{p.age} yo
						</div>
					))}
				</li>
			))}
		</ol>
	);
};

const SeasonPreview = ({
	challengeNoRatings,
	numPlayoffRounds,
	playersDeclining,
	playersImproving,
	playersNewTeam,
	playersTop,
	playersTopRookies,
	playoffsByConf,
	season,
	teamsDeclining,
	teamsImproving,
	teamsTop,
	userTid,
}: View<"seasonPreview">) => {
	useTitleBar({
		title: "Season Preview",
		dropdownView: "season_preview",
		dropdownFields: {
			seasons: season,
		},
	});
	return (
		<>
			<MoreLinks type="league" page="season_preview" />
			<div style={{ maxWidth: 1400 }}>
				<div className="row">
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Top Players</h2>
						<PlayerList
							challengeNoRatings={challengeNoRatings}
							players={playersTop}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Improving Players</h2>
						<PlayerList
							challengeNoRatings={challengeNoRatings}
							players={playersImproving}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Declining Players</h2>
						<PlayerList
							challengeNoRatings={challengeNoRatings}
							players={playersDeclining}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Top Rookies</h2>
						<PlayerList
							challengeNoRatings={challengeNoRatings}
							players={playersTopRookies}
							season={season}
							userTid={userTid}
							showDraftPick
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Top Teams</h2>
						<TeamList
							challengeNoRatings={challengeNoRatings}
							numPlayoffRounds={numPlayoffRounds}
							playoffsByConf={playoffsByConf}
							teams={teamsTop}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Improving Teams</h2>
						<TeamList
							challengeNoRatings={challengeNoRatings}
							numPlayoffRounds={numPlayoffRounds}
							playoffsByConf={playoffsByConf}
							teams={teamsImproving}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Declining Teams</h2>
						<TeamList
							challengeNoRatings={challengeNoRatings}
							numPlayoffRounds={numPlayoffRounds}
							playoffsByConf={playoffsByConf}
							teams={teamsDeclining}
							season={season}
							userTid={userTid}
						/>
					</div>
					<div className="col-sm-6 col-md-4 col-lg-3">
						<h2>Top Players on New Teams</h2>
						<PlayerList
							challengeNoRatings={challengeNoRatings}
							players={playersNewTeam}
							season={season}
							userTid={userTid}
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export default SeasonPreview;
