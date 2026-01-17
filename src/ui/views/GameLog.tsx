import clsx from "clsx";
import {
	BoxScoreRow,
	BoxScoreWrapper,
	MoreLinks,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/index.ts";
import useClickable from "../hooks/useClickable.tsx";
import type { View, Game } from "../../common/types.ts";
import { bySport, isSport } from "../../common/index.ts";
import getWinner from "../../common/getWinner.ts";
import formatScoreWithShootout from "../../common/formatScoreWithShootout.ts";

const StatsRow = ({ p, ...props }: { i: number; p: any; season: number }) => {
	const { clicked, toggleClicked } = useClickable();

	const classes = clsx({
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

	for (const [i, game] of games.entries()) {
		if (game.gid === currentGid) {
			currentGidInList = true;
			nextGid = games[i - 1]?.gid;
			prevGid = games[i + 1]?.gid;
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
				2 seasons. You can edit this behavior with the{" "}
				<a href={helpers.leagueUrl(["settings"])}>
					Save Old Box Scores setting on the League Settings page
				</a>
				.
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
	if (season < currentSeason && gamesList.games.length === 0) {
		return <NoGamesMessage warnAboutDelete />;
	}

	return (
		<table className="table table-striped table-borderless table-sm game-log-list">
			<thead>
				<tr>
					<th>Opp</th>
					<th>W/L</th>
					<th>Score</th>
				</tr>
			</thead>
			<tbody>
				{gamesList.tid !== tid ? (
					<tr>
						<td colSpan={3}>Loading...</td>
					</tr>
				) : (
					gamesList.games.map((gm) => {
						const home = gm.teams[0].tid === tid;
						const user = home ? 0 : 1;
						const other = home ? 1 : 0;

						const winner = getWinner(gm.teams);
						const result = winner === user ? "W" : winner === other ? "L" : "T";

						const overtimeText = helpers.overtimeText(
							gm.overtimes,
							gm.numPeriods,
						);
						const overtimes =
							overtimeText === ""
								? ""
								: isSport("baseball")
									? ` (${overtimeText})`
									: ` ${overtimeText}`;

						const oppAbbrev = gamesList.abbrevs[gm.teams[other].tid];

						const url = helpers.leagueUrl([
							"game_log",
							abbrev === "special" ? abbrev : `${abbrev}_${tid}`,
							season,
							gm.gid,
						]);

						return (
							<tr
								key={gm.gid}
								className={gm.gid === gid ? "table-info" : undefined}
							>
								<td className="game-log-cell">
									<a href={url}>
										{gm.neutralSite || home ? "" : "@"}
										{oppAbbrev}
									</a>
								</td>
								<td className={clsx("game-log-cell")}>
									<a
										href={url}
										className={
											gm.forceWin !== undefined ? "alert-god-mode" : undefined
										}
									>
										{result}
									</a>
								</td>
								<td className="game-log-cell">
									<a href={url}>
										{formatScoreWithShootout(gm.teams[user], gm.teams[other])}
										{overtimes}
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
		baseball: "teams",
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
		dropdownCustomURL: (fields) => {
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
									sportState={undefined}
									tid={tid}
									Row={StatsRow}
								/>
							) : (
								<p>Select a game from the menu to view a box score.</p>
							)}
						</div>

						<div className="col-md-2 mt-3 mt-md-0">
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
