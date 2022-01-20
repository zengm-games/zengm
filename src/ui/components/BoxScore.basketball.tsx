import ResponsiveTableWrapper from "./ResponsiveTableWrapper";
import SafeHtml from "../components/SafeHtml";
import { getCols, helpers } from "../util";
import { sortByStats, StatsHeader } from "./BoxScore.football";
import { MouseEvent, useState } from "react";
import type { SortBy } from "./DataTable";
import updateSortBys from "./DataTable/updateSortBys";

const StatsTable = ({
	Row,
	forceRowUpdate,
	liveGameInProgress,
	numPlayersOnCourt,
	t,
}: {
	Row: any;
	forceRowUpdate: boolean;
	liveGameInProgress: boolean;
	numPlayersOnCourt: number;
	t: any;
}) => {
	const [sortBys, setSortBys] = useState<SortBy[]>([]);

	const onClick = (event: MouseEvent, i: number) => {
		setSortBys(prevSortBys => {
			const newSortBys =
				updateSortBys({
					cols,
					event,
					i,
					prevSortBys,
				}) ?? [];

			if (
				newSortBys.length === 1 &&
				prevSortBys.length === 1 &&
				newSortBys[0][0] === prevSortBys[0][0] &&
				newSortBys[0][1] === "desc"
			) {
				// User just clicked twice on the same column. Reset sort.
				return [];
			}

			return newSortBys;
		});
	};

	const stats = [
		"min",
		"fg",
		"tp",
		"ft",
		"orb",
		"trb",
		"ast",
		"tov",
		"stl",
		"blk",
		"ba",
		"pf",
		"pts",
		"pm",
		"gmsc",
	];
	const cols = getCols(
		stats.map(stat => `stat:${stat}`),
		{
			"stat:fg": {
				desc: "Field Goals",
			},
			"stat:tp": {
				desc: "Three Pointers",
			},
			"stat:ft": {
				desc: "Free Throws",
			},
		},
	);

	// This is used for two purposes - keeping injured/DNP at the bottom while sorting, and also sorting in general for live sim (was too hard to account for this stuff in default sort from backend)
	const playersActiveOrPlayed = [];
	const playersInjuredOrDNP = [];
	for (let i = 0; i < t.players.length; i++) {
		const p = t.players[i];
		let addToHealthy;
		if (liveGameInProgress) {
			addToHealthy =
				p.injury.gamesRemaining === 0 || p.min > 0 || p.injury.playingThrough;
		} else {
			addToHealthy = p.min > 0;
		}

		if (addToHealthy) {
			playersActiveOrPlayed.push(p);
		} else {
			playersInjuredOrDNP.push(p);
		}
	}

	if (sortBys.length > 0) {
		playersActiveOrPlayed.sort(
			sortByStats(stats, sortBys, (p, stat) => {
				if (stat === "trb") {
					return p.orb + p.drb;
				}

				if (stat === "gmsc") {
					return helpers.gameScore(p);
				}

				if (stat === "fg" || stat === "ft" || stat === "tp") {
					// Sort by FGM, FGM/FGA (+1 for divide by 0 and so 100% doesn't roll over), and # attempts (lower is better)
					return (
						p[stat] +
						p[stat] / (p[`${stat}a`] + 1) +
						(1000 - p[`${stat}a`]) / 1000
					);
				}

				return p[stat];
			}),
		);
	}

	const players = [...playersActiveOrPlayed, ...playersInjuredOrDNP];

	return (
		<ResponsiveTableWrapper>
			<table className="table table-striped table-sm table-hover">
				<thead>
					<tr>
						<th>Name</th>
						{typeof t.players[0].abbrev === "string" ? <th>Team</th> : null}
						<th>Pos</th>
						<StatsHeader
							cols={cols}
							onClick={onClick}
							sortBys={sortBys}
							sortable={t.players.length > 1}
						/>
					</tr>
				</thead>
				<tbody>
					{players.map((p, i) => (
						<Row
							key={p.pid}
							lastStarter={sortBys.length === 0 && i + 1 === numPlayersOnCourt}
							liveGameInProgress={liveGameInProgress}
							p={p}
							forceUpdate={forceRowUpdate}
						/>
					))}
				</tbody>
				<tfoot>
					<tr>
						<th>Total</th>
						<th />
						{typeof t.players[0].abbrev === "string" ? <th /> : null}
						<th>{Number.isInteger(t.min) ? t.min : t.min.toFixed(1)}</th>
						<th>
							{t.fg}-{t.fga}
						</th>
						<th>
							{t.tp}-{t.tpa}
						</th>
						<th>
							{t.ft}-{t.fta}
						</th>
						<th>{t.orb}</th>
						<th>{t.drb + t.orb}</th>
						<th>{t.ast}</th>
						<th>{t.tov}</th>
						<th>{t.stl}</th>
						<th>{t.blk}</th>
						<th>{t.ba}</th>
						<th>{t.pf}</th>
						<th>{t.pts}</th>
						<th />
						<th />
					</tr>
					<tr>
						<th>Percentages</th>
						<th />
						{typeof t.players[0].abbrev === "string" ? <th /> : null}
						<th />
						<th>{helpers.roundStat((100 * t.fg) / t.fga, "fgp")}%</th>
						<th>{helpers.roundStat((100 * t.tp) / t.tpa, "tpp")}%</th>
						<th>{helpers.roundStat((100 * t.ft) / t.fta, "ftp")}%</th>
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
						<th />
					</tr>
				</tfoot>
			</table>
		</ResponsiveTableWrapper>
	);
};

const BoxScore = ({
	boxScore,
	Row,
	forceRowUpdate,
}: {
	boxScore: any;
	Row: any;
	forceRowUpdate: boolean;
}) => {
	// Historical games will have boxScore.won.name and boxScore.lost.name so use that for ordering, but live games
	// won't. This is hacky, because the existence of this property is just a historical coincidence, and maybe it'll
	// change in the future.
	const liveGameSim = boxScore.won?.name === undefined;
	const liveGameInProgress = liveGameSim && !boxScore.gameOver;

	return (
		<>
			{boxScore.teams.map((t: any) => {
				return (
					<div key={t.abbrev} className="mb-3">
						<h2>
							{t.tid >= 0 ? (
								<a
									href={helpers.leagueUrl([
										"roster",
										`${t.abbrev}_${t.tid}`,
										boxScore.season,
									])}
								>
									{t.region} {t.name}
								</a>
							) : (
								<>
									{t.region} {t.name}
								</>
							)}
						</h2>
						<StatsTable
							Row={Row}
							forceRowUpdate={forceRowUpdate}
							liveGameInProgress={liveGameInProgress}
							numPlayersOnCourt={boxScore.numPlayersOnCourt ?? 5}
							t={t}
						/>
					</div>
				);
			})}
			{boxScore.gameOver !== false &&
			boxScore.clutchPlays &&
			boxScore.clutchPlays.length > 0
				? boxScore.clutchPlays.map((text: string, i: number) => (
						<p key={i}>
							<SafeHtml dirty={text} />
						</p>
				  ))
				: null}
		</>
	);
};

export default BoxScore;
