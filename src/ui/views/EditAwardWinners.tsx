import { useState, useEffect, useId, useRef } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type {
	AwardInfoIndividual,
	AwardInfoTeam,
	View,
} from "../../common/types.ts";
import { helpers } from "../util/helpers.ts";
import { showNotification } from "../util/showNotification.ts";
import { toWorker } from "../util/toWorker.ts";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";
import SelectMultiple from "../components/SelectMultiple/index.tsx";
import { StickyBottomButtons } from "../components/StickyBottomButtons.tsx";
import { ActionButton } from "../components/ActionButton.tsx";
import {
	formatPlayerAwardName,
	pruneEmptyWinners,
	showStatsByType,
} from "../../common/awards.ts";
import { MoreLinks } from "../components/MoreLinks.tsx";
import { getAwardKey } from "./AwardRaces.tsx";
import { getCol } from "../../common/getCol.ts";
import { groupByUnique } from "../../common/utils.ts";
import { PLAYER, POSITIONS, TEAM_AWARD_INFO } from "../../common/constants.ts";
import { useBlocker } from "../hooks/useBlocker.ts";

type Winner =
	| undefined
	| (AwardInfoIndividual["winner"][number] & {
			pos?: undefined;
	  })
	| AwardInfoTeam["winner"][number][number];

type MyPlayer = View<"editAwardWinners">["players"][number];

type AddWinnerProps =
	| {
			award: AwardInfoIndividual;
			teamIndex: undefined;
	  }
	| {
			award: AwardInfoTeam;
			teamIndex: number;
	  };

type SetWinnerProps = (
	| {
			award: AwardInfoIndividual;
			teamIndex: undefined;
	  }
	| {
			award: AwardInfoTeam;
			teamIndex: number;
	  }
) & {
	p: MyPlayer | undefined;
	playerIndex: number;
	tid: number;
	pos: string | undefined;
};

type AwardProps = (
	| {
			award: AwardInfoIndividual;
			teamIndex: undefined;
	  }
	| {
			award: AwardInfoTeam;
			teamIndex: number;
	  }
) & {
	addWinner: (props: AddWinnerProps) => void;
	disabled: boolean;
	playersByPid: Record<number, MyPlayer>;
	setWinner: (props: SetWinnerProps) => void;
} & Pick<
		View<"editAwardWinners">,
		"abbrevsByTid" | "confs" | "divs" | "players"
	>;

const Award = ({
	abbrevsByTid,
	addWinner,
	award,
	confs,
	disabled,
	divs,
	players,
	playersByPid,
	setWinner,
	teamIndex,
}: AwardProps) => {
	let rank;
	let winners: Winner[];
	if (teamIndex !== undefined) {
		rank = teamIndex + 1;
		winners = award.winner[teamIndex] ?? [];
	} else {
		rank = 1;
		winners = award.winner;
	}

	const statRange = award.statRange ?? "regularSeason";
	const stats = showStatsByType[award.showStats];
	if (!stats) {
		throw new Error("Invalid showStats");
	}

	const statOverridesByPid: Record<
		number,
		NonNullable<AwardInfoIndividual["winner"][number]["statOverrides"]>
	> = {};
	for (const winner of winners) {
		if (winner?.pid !== undefined && winner.statOverrides) {
			statOverridesByPid[winner.pid] = winner.statOverrides;
		}
	}

	const group = award.group;

	return (
		<div className="col-xl-4 col-md-6 col-12 mb-4">
			<h3>
				{formatPlayerAwardName({
					name: award.name,
					numTeams: award.numTeams,
					rank,
				})}
			</h3>
			{group && group.type !== "playoffSeries" ? (
				<h4>
					{group.type === "conf"
						? confs[group.cid]?.name
						: divs[group.did]?.name}
				</h4>
			) : null}
			<div className="d-flex flex-column gap-1">
				{winners.map((winner, i) => {
					const p =
						winner?.pid !== undefined ? playersByPid[winner.pid] : undefined;

					const getTid = (p: MyPlayer | null | undefined) => {
						if (!p) {
							return PLAYER.DOES_NOT_EXIST;
						}

						if (p.pid === winner?.pid) {
							return winner.tid;
						}

						return p.currentStats[statRange]?.tid ?? p.lastTid;
					};

					const getOptionLabel = (p: MyPlayer) => {
						const tid = getTid(p);

						const abbrev = abbrevsByTid[tid];

						const posAndAbbrevArray = [];
						if (p) {
							posAndAbbrevArray.push(p.pos);
						}
						if (abbrev !== undefined) {
							posAndAbbrevArray.push(abbrev);
						}
						const posAndAbbrev =
							posAndAbbrevArray.length > 0
								? ` (${posAndAbbrevArray.join(", ")})`
								: "";

						const playerStatsArray = !p
							? []
							: stats
									.map((stat) => {
										const value =
											statOverridesByPid[p.pid]?.[stat] ??
											p.currentStats[statRange]?.[stat];
										if (value === undefined) {
											return;
										}

										return `${helpers.roundStat(value, stat)}${stat === "keyStats" ? "" : ` ${getCol(`stat:${stat}`).title}`}`;
									})
									.filter((text) => text !== undefined);
						const playerStats =
							playerStatsArray.length === 0
								? undefined
								: playerStatsArray.join(", ");

						return `${p?.name ?? "???"}${posAndAbbrev}${playerStats !== undefined ? ` ${playerStats}` : ""}`;
					};

					let prefix;
					if (teamIndex === undefined) {
						prefix = (
							<div
								className="flex-shrink-0"
								style={{
									width: 16,
								}}
							>
								{i + 1}
							</div>
						);
					} else if (winner?.pos !== undefined) {
						prefix = (
							<div
								className="flex-shrink-0 me-1"
								style={{
									width: 55,
								}}
							>
								<select
									className="form-select"
									value={winner.pos}
									disabled={disabled}
									onChange={async (event) => {
										const newPos = event.target.value;
										setWinner({
											award,
											p,
											playerIndex: i,
											pos: newPos,
											teamIndex,
											tid: getTid(p),
										});
									}}
								>
									{POSITIONS.map((pos) => {
										return (
											<option key={pos} value={pos}>
												{pos}
											</option>
										);
									})}
								</select>
							</div>
						);
					} else {
						prefix = null;
					}

					return (
						<div key={i} className="d-flex align-items-center">
							{prefix}

							<div className="w-100">
								<SelectMultiple
									disabled={disabled}
									options={players}
									value={p ?? null}
									getOptionLabel={getOptionLabel}
									getOptionValue={(p) => String(p.pid)}
									onChange={(p) => {
										if (award.numTeams === undefined) {
											setWinner({
												award,
												p: p === null ? undefined : p,
												playerIndex: i,
												pos: winner?.pos,
												teamIndex: undefined,
												tid: getTid(p),
											});
										} else {
											setWinner({
												award,
												p: p === null ? undefined : p,
												playerIndex: i,
												pos: winner?.pos,
												teamIndex: teamIndex!,
												tid: getTid(p),
											});
										}
									}}
								/>
							</div>
						</div>
					);
				})}
				<div>
					<button
						className="btn btn-light-bordered"
						type="button"
						onClick={() => {
							if (award.numTeams === undefined) {
								addWinner({
									award,
									teamIndex: undefined,
								});
							} else {
								addWinner({
									award,
									teamIndex: teamIndex!,
								});
							}
						}}
					>
						Add player
					</button>
				</div>
			</div>
		</div>
	);
};

const EditAwardWinners = ({
	abbrevsByTid,
	awards,
	confs,
	divs,
	players,
	season,
}: View<"editAwardWinners">) => {
	useTitleBar({
		title: "Edit Award Winners",
		dropdownView: "edit_award_winners",
		dropdownFields: { seasonsHistory: season },
	});

	const [saving, setSaving] = useState(false);

	const [awardsState, setAwardsState] = useState(awards);

	const formId = useId();

	const { setDirty } = useBlocker();

	// Update state if new season
	const firstRun = useRef(true);
	useEffect(() => {
		if (firstRun.current) {
			firstRun.current = false;
		} else {
			setAwardsState(awards);
			setDirty(false);
		}
	}, [awards, season, setDirty]);

	const playersByPid = groupByUnique(players, "pid");

	const addWinner = (props: AddWinnerProps) => {
		setDirty(true);
		setAwardsState((oldState) => {
			return oldState.map((award) => {
				if (award !== props.award) {
					return award;
				}

				if (props.teamIndex === undefined) {
					return {
						...props.award,
						winner: [...props.award.winner, {}],
					};
				} else {
					return {
						...props.award,
						winner: props.award.winner.map((team, i) => {
							if (i !== props.teamIndex) {
								return team;
							}

							const newEntry: { pos?: string } = {};
							if (TEAM_AWARD_INFO.byPos) {
								newEntry.pos = POSITIONS[0];
							}

							return [...team, newEntry];
						}),
					};
				}
			});
		});
	};

	const setWinner = (props: SetWinnerProps) => {
		const { p, playerIndex, pos, tid } = props;

		setDirty(true);
		setAwardsState((oldState) => {
			return oldState.map((award) => {
				if (award !== props.award) {
					return award;
				}

				if (props.teamIndex === undefined) {
					// Is this player already a winner? If so make a note of it so we can delete them later, while also saving statOverrides
					const duplicate = props.award.winner.find((p2, i) => {
						if (i !== playerIndex && p2 && p2.pid === p?.pid) {
							return p2;
						}
					});

					const winner: AwardInfoIndividual["winner"] = props.award.winner.map(
						(p2, i) => {
							if (p2 && p2 === duplicate) {
								return {};
							}
							if (i !== playerIndex) {
								return p2;
							}

							if (!p) {
								return {};
							}

							// Use duplicate to maintain statOverides in case box scores no longer exist for playoff series award
							if (duplicate) {
								return duplicate;
							}

							const row: AwardInfoIndividual["winner"][number] = {
								pid: p.pid,
								tid,
							};

							// Add statOverrides
							if (props.award.group?.type === "playoffSeries") {
								const statRange = props.award.statRange ?? "regularSeason";
								const currentStats = p.currentStats[statRange];
								if (currentStats !== undefined) {
									const stats = showStatsByType[award.showStats];
									if (!stats) {
										throw new Error("Invalid showStats");
									}
									row.statOverrides = {
										// Would be nice to compute score, but maybe not worth the complexity
										score: 0,
									};
									for (const stat of stats) {
										if (currentStats[stat] !== undefined) {
											row.statOverrides[stat] = currentStats[stat];
										}
									}
								}
							}

							return row;
						},
					);

					return {
						...props.award,
						winner,
					};
				} else {
					// Is this player already a winner? If so make a note of it so we can delete them later, while also saving statOverrides
					let duplicate: AwardInfoTeam["winner"][number][number] | undefined;
					OUTER_LOOP: for (const [i, team] of props.award.winner.entries()) {
						for (const [j, p2] of team.entries()) {
							if (
								(i !== props.teamIndex || j !== playerIndex) &&
								p2.pid === p?.pid
							) {
								duplicate = p2;
								break OUTER_LOOP;
							}
						}
					}

					const winner: AwardInfoTeam["winner"] = props.award.winner.map(
						(team, i) => {
							return team.map((p2, j) => {
								const base: { pos?: string } = pos !== undefined ? { pos } : {};

								if (p2 === duplicate) {
									return base;
								}
								if (i !== props.teamIndex || j !== playerIndex) {
									return p2;
								}

								if (!p) {
									return base;
								}

								// Use duplicate to maintain statOverides in case box scores no longer exist for playoff series award (not strictly necessary here because statOverrides are not in team awards, but I guess this is more future proof, although I'd also need to add code to create statOverrides when there is no duplicate like on the individual award branch above...)
								if (duplicate) {
									return {
										...duplicate,
										...base,
									};
								}

								return {
									...base,
									pid: p.pid,
									tid,
								};
							});
						},
					);

					return {
						...props.award,
						winner,
					};
				}
			});
		});
	};

	return (
		<>
			<MoreLinks type="awards" page="edit_award_winners" season={season} />
			<form
				id={formId}
				key={season}
				onSubmit={async (event) => {
					event.preventDefault();
					setSaving(true);
					try {
						await toWorker("main", "updateAwards", {
							season,
							awards: pruneEmptyWinners(awardsState),
						});
						setDirty(false);
						realtimeUpdate([], helpers.leagueUrl(["history", season]));
					} catch (error) {
						showNotification({
							type: "error",
							text: error.message,
						});
						setSaving(false);
					}
				}}
			>
				<div className="row">
					{awardsState.flatMap((award) => {
						if (award.numTeams !== undefined) {
							return award.winner.map((winner, i) => {
								return (
									<Award
										key={getAwardKey({ ...award, rank: i + 1 })}
										abbrevsByTid={abbrevsByTid}
										addWinner={addWinner}
										award={award}
										confs={confs}
										disabled={saving}
										divs={divs}
										players={players}
										playersByPid={playersByPid}
										setWinner={setWinner}
										teamIndex={i}
									/>
								);
							});
						}

						return (
							<Award
								key={getAwardKey(award)}
								abbrevsByTid={abbrevsByTid}
								addWinner={addWinner}
								award={award}
								confs={confs}
								disabled={saving}
								divs={divs}
								players={players}
								playersByPid={playersByPid}
								setWinner={setWinner}
								teamIndex={undefined}
							/>
						);
					})}
				</div>
			</form>
			<StickyBottomButtons>
				<ActionButton
					form={formId}
					type="submit"
					className="ms-auto"
					variant="primary"
					processing={saving}
					processingText="Saving"
				>
					Save award winners
				</ActionButton>
			</StickyBottomButtons>
		</>
	);
};
export default EditAwardWinners;
