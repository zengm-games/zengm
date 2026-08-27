import { useState, useEffect, useId } from "react";
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
import { formatPlayerAwardName, showStatsByType } from "../../common/awards.ts";
import { MoreLinks } from "../components/MoreLinks.tsx";
import { getAwardKey } from "./AwardRaces.tsx";
import { getCol } from "../../common/getCol.ts";
import { groupByUnique } from "../../common/utils.ts";
import { PLAYER } from "../../common/constants.ts";

type Winner =
	| undefined
	| (AwardInfoIndividual["winner"][number] & {
			pos?: undefined;
	  })
	| AwardInfoTeam["winner"][number][number];

type MyPlayer = View<"editAwardWinners">["players"][number];

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
	disabled: boolean;
	playersByPid: Record<number, MyPlayer>;
	setWinner: (props: SetWinnerProps) => void;
} & Pick<View<"editAwardWinners">, "abbrevsByTid" | "players">;

const Award = ({
	abbrevsByTid,
	award,
	disabled,
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

	return (
		<div className="col-md-4 col-6 mb-4">
			<h3>
				{formatPlayerAwardName({
					name: award.name,
					numTeams: award.numTeams,
					rank,
				})}
			</h3>
			<div className="d-flex flex-column gap-1">
				{winners.map((winner, i) => {
					const p =
						winner?.pid !== undefined ? playersByPid[winner.pid] : undefined;

					const getTid = (p: MyPlayer | null) => {
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
										let value;
										if (p.pid === winner?.pid) {
											value = winner?.statOverrides?.[stat];
										}
										if (value === undefined) {
											value = p.currentStats[statRange]?.[stat];
										}
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

						return `${winner?.pos !== undefined ? `${winner.pos} ` : ""}${p?.name ?? "???"}${posAndAbbrev}${playerStats !== undefined ? ` ${playerStats}` : ""}`;
					};

					return (
						<SelectMultiple
							key={i}
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
										teamIndex: undefined,
										tid: getTid(p),
									});
								} else {
									setWinner({
										award,
										p: p === null ? undefined : p,
										playerIndex: i,
										teamIndex: teamIndex!,
										tid: getTid(p),
									});
								}
							}}
						/>
					);
				})}
			</div>
		</div>
	);
};

const EditAwardWinners = ({
	abbrevsByTid,
	awards,
	players,
	season,
}: View<"editAwardWinners">) => {
	useTitleBar({
		title: "Edit Award Winners",
		dropdownView: "edit_award_winners",
		dropdownFields: { seasonsHistory: season },
	});

	const [saving, setSaving] = useState(false);

	const [awardsState, setAwardsState] = useState(() =>
		helpers.deepCopy(awards),
	);
	useEffect(() => {
		setAwardsState(helpers.deepCopy(awards));
	}, [awards, season]);

	const formId = useId();

	const playersByPid = groupByUnique(players, "pid");

	const setWinner = (props: SetWinnerProps) => {
		setAwardsState((oldState) => {
			return oldState.map((award) => {
				if (award !== props.award) {
					return award;
				}

				if (props.teamIndex === undefined) {
					// Is this player already a winner? If so make a note of it so we can delete them later, while also saving statOverrides
					const duplicate = props.award.winner.find((p, i) => {
						if (i !== props.playerIndex && p && p.pid === props.p?.pid) {
							return p;
						}
					});

					const winner = props.award.winner.map((p, i) => {
						if (p && p === duplicate) {
							return;
						}
						if (i !== props.playerIndex) {
							return p;
						}

						if (!props.p) {
							return;
						}

						// Use duplicate to maintain statOverides in case box scores no longer exist for playoff series award
						return (
							duplicate ?? {
								pid: props.p.pid,
								tid: props.p.tid,
							}
						);
					});

					return {
						...props.award,
						winner,
					};
				}

				return {
					...props.award,
				};
			});
		});
	};

	return (
		<>
			<MoreLinks type="awards" page="edit_award_winners" season={season} />
			<form
				id={formId}
				onSubmit={async (event) => {
					event.preventDefault();
					setSaving(true);
					try {
						await toWorker("main", "updateAwards", awardsState);
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
										award={award}
										disabled={saving}
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
								award={award}
								disabled={saving}
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
