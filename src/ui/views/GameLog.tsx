import classNames from "classnames";
import { BoxScoreRow, BoxScoreWrapper, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, useLocalShallow } from "../util";
import useClickable from "../hooks/useClickable";
import type { View, Game } from "../../common/types";
import { bySport } from "../../common";

const StatsRow = ({ p, ...props }: { i: number; p: any }) => {
	const { clicked, toggleClicked } = useClickable();

	const classes = classNames({
		"table-warning": clicked,
	});
	return (
		<BoxScoreRow className={classes} onClick={toggleClicked} p={p} {...props} />
	);
};

const findPrevNextGids = (games: Game[], currentGid: number) => {
	let prevGid;
	let nextGid;
	let currentGidInList = false;

	for (let i = 0; i < games.length; i++) {
		if (games[i].gid === currentGid) {
			currentGidInList = true;
			if (i > 0) {
				nextGid = games[i - 1].gid;
			}
			if (i < games.length - 1) {
				prevGid = games[i + 1].gid;
			}
			break;
		}
	}

	return { currentGidInList, prevGid, nextGid };
};

export const NoGamesMessage = ({
	warnAboutDelete,
}: {
	warnAboutDelete: boolean;
}) => (
	<div className="alert alert-info d-inline-block" style={{ maxWidth: 600 }}>
		No games found for this season.
		{warnAboutDelete ? (
			<>
				{" "}
				By default, box scores from old seasons are automatically deleted after
				3 years.{" "}
				<a href={helpers.leagueUrl(["settings"])}>
					You can change this behavior on the League Settings page.
				</a>
			</>
		) : null}
	</div>
);

const GamesList = ({
	abbrev,
	currentSeason,
	gid,
	gamesList,
	season,
	tid,
}: {
	abbrev: string;
	currentSeason: number;
	gamesList: View<"gameLog">["gamesList"];
	gid?: number;
	season: number;
	tid: number;
}) => {
	const { teamInfoCache } = useLocalShallow(state => ({
		teamInfoCache: state.teamInfoCache,
	}));

	if (season < currentSeason && gamesList.games.length === 0) {
		return <NoGamesMessage warnAboutDelete />;
	}

	return (
		<table className="table table-striped table-sm game-log-list">
			<thead>
				<tr>
					<th>Opp</th>
					<th>W/L</th>
					<th>Score</th>
				</tr>
			</thead>
			<tbody>
				{gamesList.abbrev !== abbrev ? (
					<tr>
						<td colSpan={3}>Loading...</td>
					</tr>
				) : (
					gamesList.games.map(gm => {
						const home = gm.teams[0].tid === tid;
						const user = home ? 0 : 1;
						const other = home ? 1 : 0;

						let result;
						if (gm.teams[user].pts > gm.teams[other].pts) {
							result = "W";
						} else if (gm.teams[user].pts < gm.teams[other].pts) {
							result = "L";
						} else {
							result = "T";
						}

						let overtimes;
						if (gm.overtimes !== undefined && gm.overtimes > 0) {
							if (gm.overtimes === 1) {
								overtimes = "OT";
							} else if (gm.overtimes > 1) {
								overtimes = `${gm.overtimes}OT`;
							}
						}

						const oppAbbrev =
							abbrev === "special"
								? "ASG"
								: teamInfoCache[gm.teams[other].tid]?.abbrev;

						return (
							<tr
								key={gm.gid}
								className={gm.gid === gid ? "table-info" : undefined}
							>
								<td className="game-log-cell">
									<a
										href={helpers.leagueUrl([
											"game_log",
											abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
											season,
											gm.gid,
										])}
									>
										{home ? "" : "@"}
										{oppAbbrev}
									</a>
								</td>
								<td className={classNames("game-log-cell")}>
									<a
										href={helpers.leagueUrl([
											"game_log",
											abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
											season,
											gm.gid,
										])}
										className={
											gm.forceWin !== undefined ? "alert-god-mode" : undefined
										}
									>
										{result}
									</a>
								</td>
								<td className="game-log-cell">
									<a
										href={helpers.leagueUrl([
											"game_log",
											abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
											season,
											gm.gid,
										])}
									>
										{gm.teams[user].pts}-{gm.teams[other].pts} {overtimes}
									</a>
								</td>
							</tr>
						);
					})
				)}
			</tbody>
		</table>
	);
};

const GameLog = ({
	abbrev,
	boxScore,
	currentSeason,
	gamesList,
	season,
	tid,
}: View<"gameLog">) => {
	const dropdownTeamsKey = bySport({
		basketball: "teamsAndSpecial",
		football: "teams",
		hockey: "teams",
	});

	useTitleBar({
		title: "Game Log",
		dropdownView: "game_log",
		dropdownFields: {
			[dropdownTeamsKey]: abbrev,
			seasons: season,
		},
		dropdownCustomURL: fields => {
			return helpers.leagueUrl([
				"game_log",
				fields[dropdownTeamsKey],
				fields.seasons,
				boxScore.gid,
			]);
		},
	});

	const { currentGidInList, nextGid, prevGid } = findPrevNextGids(
		gamesList.games,
		boxScore.gid,
	);

	const noGamesAndNoBoxScore =
		season < currentSeason && gamesList.games.length === 0 && boxScore.gid < 0;

	return (
		<>
			{tid >= 0 ? (
				<MoreLinks
					type="team"
					page="game_log"
					abbrev={abbrev}
					tid={tid}
					season={season}
				/>
			) : null}

			{noGamesAndNoBoxScore ? (
				<NoGamesMessage warnAboutDelete />
			) : (
				<>
					<p />
					<div className="row">
						<div className="col-md-10">
							{boxScore.gid >= 0 ? (
								<BoxScoreWrapper
									abbrev={abbrev}
									boxScore={boxScore}
									currentGidInList={currentGidInList}
									nextGid={nextGid}
									prevGid={prevGid}
									showNextPrev
									tid={tid}
									Row={StatsRow}
								/>
							) : (
								<p>Select a game from the menu to view a box score.</p>
							)}
						</div>

						<div className="col-md-2">
							<GamesList
								abbrev={abbrev}
								currentSeason={currentSeason}
								gamesList={gamesList}
								gid={boxScore.gid}
								season={season}
								tid={tid}
							/>
						</div>
					</div>
				</>
			)}
		</>
	);
};

export default GameLog;
