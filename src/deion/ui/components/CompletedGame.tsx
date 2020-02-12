import classNames from "classnames";
import React from "react";
import { helpers, useLocalShallow } from "../util";

const width100 = {
	width: "100%",
};

const roundHalf = (x: number): string => {
	return (Math.round(x * 2) / 2).toLocaleString("en-US", {
		maximumFractionDigits: 1,
	});
};

// pts is undefined for upcoming games. Others are undefined only for legacy objects
type Team = {
	ovr?: number;
	pts?: number;
	tid: number;
	won?: number;
	lost?: number;
	tied?: number;
};

const getRecord = (t: Team) => {
	if (t.won === undefined || t.lost === undefined) {
		return "";
	}
	if (t.tied === undefined) {
		return ` ${t.won}-${t.lost}`;
	}
	return ` ${t.won}-${t.lost}-${t.tied}`;
};

const CompletedGame = ({
	displayAbbrevs,
	game,
	header,
}: {
	displayAbbrevs?: boolean;
	game: {
		gid: number;
		overtimes?: number;
		season: number;
		teams: [Team, Team];
	};
	header?: boolean;
}) => {
	const {
		teamAbbrevsCache,
		teamNamesCache,
		teamRegionsCache,
		userTid,
	} = useLocalShallow(state => ({
		teamAbbrevsCache: state.teamAbbrevsCache,
		teamNamesCache: state.teamNamesCache,
		teamRegionsCache: state.teamRegionsCache,
		userTid: state.userTid,
	}));

	console.log(game);
	let winner: -1 | 0 | 1 | undefined;
	if (game.teams[0].pts !== undefined && game.teams[1].pts !== undefined) {
		if (game.teams[0].pts > game.teams[1].pts) {
			winner = 0;
		} else if (game.teams[1].pts > game.teams[0].pts) {
			winner = 1;
		} else if (
			typeof game.teams[1].pts === "number" &&
			game.teams[1].pts === game.teams[0].pts
		) {
			winner = -1;
		}
	}

	const final = winner !== undefined;

	const hasOvrs =
		game.teams[0].ovr !== undefined && game.teams[1].ovr !== undefined;

	let spreads: [string | undefined, string | undefined] | undefined;
	if (game.teams[0].ovr !== undefined && game.teams[1].ovr !== undefined) {
		if (process.env.SPORT === "basketball") {
			// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
			const spread = 1.03 * (game.teams[1].ovr - game.teams[0].ovr) + 3.3504;
			if (spread > 0) {
				spreads = [undefined, roundHalf(-spread)];
			} else if (spread < 0) {
				spreads = [roundHalf(spread), undefined];
			} else {
				spreads = ["PK", undefined];
			}
		}
	}

	let overtimes;
	if (game.overtimes !== undefined && game.overtimes > 0) {
		if (game.overtimes === 1) {
			overtimes = "OT";
		} else if (game.overtimes > 1) {
			overtimes = `${game.overtimes}OT`;
		}
	}

	return (
		<table className="table table-borderless table-sm game-score-box mb-3">
			{header ? (
				<thead className="text-muted">
					<tr>
						<th></th>
						<th></th>
						{hasOvrs ? <th title="Team Overall Rating">Ovr</th> : null}
						{spreads ? (
							<th className="text-right" title="Predicted Point Spread">
								Spread
							</th>
						) : null}
						{final ? (
							<th className="text-right" title="Final Score">
								Score
							</th>
						) : null}
					</tr>
				</thead>
			) : null}
			<tbody className="rounded">
				{[1, 0].map(i => {
					const t = game.teams[i];
					let scoreClasses;
					if (winner !== undefined && t.tid === userTid) {
						scoreClasses = {
							"alert-success": winner === i,
							"alert-danger": winner !== i,
							"alert-warning": winner === -1,
						};
					}

					const teamName = displayAbbrevs
						? teamNamesCache[t.tid]
						: `${teamRegionsCache[t.tid]} ${teamNamesCache[t.tid]}`;

					return (
						<tr key={i}>
							<td className="p-0">
								<img src="/img/logos/DEN.png" alt="" />
							</td>
							<td style={width100}>
								<a
									href={helpers.leagueUrl(["roster", teamAbbrevsCache[t.tid]])}
								>
									{teamName}
								</a>
								{getRecord(t)}
							</td>
							{hasOvrs ? <td className="text-right">{t.ovr}</td> : null}
							{spreads ? (
								<td className="text-right" style={{ minWidth: 52 }}>
									{spreads[i]}
								</td>
							) : null}
							{final ? (
								<td
									className={classNames(
										"text-right font-weight-bold",
										scoreClasses,
									)}
									style={{ minWidth: 44 }}
								>
									<a
										href={helpers.leagueUrl([
											"game_log",
											teamAbbrevsCache[t.tid],
											game.season,
											game.gid,
										])}
									>
										{t.pts}
									</a>
								</td>
							) : null}
						</tr>
					);
				})}
			</tbody>
			{overtimes ? (
				<tfoot>
					<tr>
						<th></th>
						<th></th>
						{hasOvrs ? <th></th> : null}
						{spreads ? <th></th> : null}
						<th className="text-right text-muted">{overtimes}</th>
					</tr>
				</tfoot>
			) : null}
		</table>
	);
};

export default CompletedGame;
