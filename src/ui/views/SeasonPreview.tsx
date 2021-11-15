import classNames from "classnames";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import {
	PlayerNameLabels,
	RatingWithChange,
	RecordAndPlayoffs,
} from "../components";

const PlayerList = ({
	players,
	season,
	userTid,
}: {
	players: any[];
	season: number;
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
						>
							{p.name}
						</PlayerNameLabels>
						<a
							href={helpers.leagueUrl([
								"roster",
								`${p.abbrev}_${p.tid}`,
								season,
							])}
							className="ml-2"
						>
							{p.abbrev}
						</a>
					</span>
					<br />
					<RatingWithChange change={p.ratings.dovr}>
						{p.ratings.ovr}
					</RatingWithChange>{" "}
					ovr,{" "}
					<RatingWithChange change={p.ratings.dpot}>
						{p.ratings.pot}
					</RatingWithChange>{" "}
					pot, {p.age} yo
				</li>
			))}
		</ol>
	);
};

const TeamList = ({
	numConfs,
	numPlayoffRounds,
	teams,
	season,
	userTid,
}: {
	numConfs: number;
	numPlayoffRounds: number;
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
						, <RatingWithChange change={t.dovr}>{t.ovr}</RatingWithChange> ovr
					</span>
					{t.lastSeason ? (
						<div>
							Last season:{" "}
							<RecordAndPlayoffs
								abbrev={t.abbrev}
								lost={t.lastSeason.lost}
								option="noSeason"
								numConfs={numConfs}
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
						<div className="text-muted mt-2">
							<PlayerNameLabels
								pid={p.pid}
								season={season}
								pos={p.ratings.pos}
								skills={p.ratings.skills}
								watch={p.watch}
							>
								{p.name}
							</PlayerNameLabels>
							<br />
							{p.ratings.ovr} ovr, {p.ratings.pot} pot, {p.age} yo
						</div>
					))}
				</li>
			))}
		</ol>
	);
};

const SeasonPreview = ({
	numConfs,
	numPlayoffRounds,
	playersDeclining,
	playersImproving,
	playersTop,
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
		<div style={{ maxWidth: 1200 }}>
			<div className="row">
				<div className="col-md-4">
					<h2>Top Players</h2>
					<PlayerList players={playersTop} season={season} userTid={userTid} />
				</div>
				<div className="col-md-4">
					<h2>Improving Players</h2>
					<PlayerList
						players={playersImproving}
						season={season}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-4">
					<h2>Declining Players</h2>
					<PlayerList
						players={playersDeclining}
						season={season}
						userTid={userTid}
					/>
				</div>
			</div>
			<div className="row">
				<div className="col-md-4">
					<h2>Top Teams</h2>
					<TeamList
						numConfs={numConfs}
						numPlayoffRounds={numPlayoffRounds}
						teams={teamsTop}
						season={season}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-4">
					<h2>Improving Teams</h2>
					<TeamList
						numConfs={numConfs}
						numPlayoffRounds={numPlayoffRounds}
						teams={teamsImproving}
						season={season}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-4">
					<h2>Declining Teams</h2>
					<TeamList
						numConfs={numConfs}
						numPlayoffRounds={numPlayoffRounds}
						teams={teamsDeclining}
						season={season}
						userTid={userTid}
					/>
				</div>
			</div>
		</div>
	);
};

export default SeasonPreview;
