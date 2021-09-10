import useTitleBar from "../hooks/useTitleBar";
import { helpers, useLocal } from "../util";
import type { View } from "../../common/types";
import { Height, PlayerNameLabels, PlayerPicture, Weight } from "../components";
import { useState } from "react";

const AllStarDunk = ({
	dunk,
	godMode,
	players,
	season,
	userTid,
}: View<"allStarDunk">) => {
	const [pidsControlling, setPidsControlling] = useState(
		new Set(dunk.players.filter(p => p.tid === userTid).map(p => p.pid)),
	);

	useTitleBar({
		title: "Slam Dunk Contest",
		dropdownView: "all_star_dunk",
		dropdownFields: { seasons: season },
	});

	const teamInfoCache = useLocal(state => state.teamInfoCache);

	return (
		<>
			<div className="d-flex flex-wrap" style={{ gap: "3rem" }}>
				{players.map((p, i) => {
					const tid = dunk.players[i].tid;
					const t = teamInfoCache[tid] ?? {};

					const allowControl =
						tid === userTid || (pidsControlling.has(tid) && !godMode);
					const allowControlGodMode = !allowControl && godMode;

					const checkboxID = `control-player-${i}`;

					return (
						<div key={p.pid}>
							<div
								style={{
									maxHeight: 180,
									width: 120,
									marginTop: p.imgURL ? 0 : -20,
								}}
								className="flex-shrink-0"
							>
								<PlayerPicture face={p.face} imgURL={p.imgURL} />
							</div>
							<div className="mt-2">
								<PlayerNameLabels
									pid={p.pid}
									injury={p.injury}
									season={season}
									jerseyNumber={p.stats.jerseyNumber}
									pos={p.ratings.pos}
									watch={p.watch}
								>
									{p.name}
								</PlayerNameLabels>
								<a
									className="ml-2"
									href={helpers.leagueUrl([
										"roster",
										`${t.abbrev}_${p.tid}`,
										season,
									])}
								>
									{t.abbrev}
								</a>
							</div>
							<div className="mt-1">
								{p.age} <span title="Years Old">yo</span>,{" "}
								<Height inches={p.hgt} />, <Weight pounds={p.weight} />
								<br />
								{p.ratings.ovr} ovr, {p.ratings.pot} pot, {p.ratings.jmp} jmp,{" "}
								{p.ratings.dnk} dnk
								<br />
								{helpers.roundStat(p.stats.pts, "pts")} pts,{" "}
								{helpers.roundStat(p.stats.trb, "trb")} trb,{" "}
								{helpers.roundStat(p.stats.ast, "ast")} ast
							</div>

							{allowControl || allowControlGodMode ? (
								<div
									className={`form-check mt-2 d-inline-block${
										allowControlGodMode ? " god-mode pr-1" : ""
									}`}
								>
									<input
										className="form-check-input"
										type="checkbox"
										onChange={() => {
											const pids = new Set(pidsControlling);
											if (pids.has(p.pid)) {
												pids.delete(p.pid);
											} else {
												pids.add(p.pid);
											}
											setPidsControlling(pids);
										}}
										checked={pidsControlling.has(p.pid)}
										id={checkboxID}
									/>
									<label className="form-check-label" htmlFor={checkboxID}>
										Control player
									</label>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</>
	);
};

export default AllStarDunk;
