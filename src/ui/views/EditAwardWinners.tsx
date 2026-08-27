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

type Winner =
	| (AwardInfoIndividual["winner"][number] & {
			pos?: undefined;
	  })
	| AwardInfoTeam["winner"][number][number];

const Award = ({
	abbrevsByTid,
	award,
	disabled,
	players,
	playersByPid,
}: {
	award:
		| (AwardInfoIndividual & { teamIndex?: undefined })
		| (AwardInfoTeam & { teamIndex: number });
	disabled: boolean;
	playersByPid: Record<number, View<"editAwardWinners">["players"][number]>;
} & Pick<View<"editAwardWinners">, "abbrevsByTid" | "players">) => {
	let rank;
	let winners: Winner[];
	if (award.teamIndex !== undefined) {
		rank = award.teamIndex + 1;
		winners = award.winner[award.teamIndex]!;
	} else {
		rank = 1;
		winners = award.winner;
	}
	console.log(award, rank, winners);

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
			{winners.map((winner, i) => {
				if (winner === undefined) {
					return <div key={i}>Blank</div>;
				}

				const p = playersByPid[winner.pid];
				const abbrev = abbrevsByTid[winner.tid] ?? "???";

				let playerName;
				if (!p) {
					playerName = `??? (${abbrev})`;
				} else {
					playerName = `${p.name} (${p.pos}, ${abbrev})`;
				}

				const playerStatsArray = !p
					? []
					: stats
							.map((stat) => {
								const value =
									winner.statOverrides?.[stat] ??
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

				return (
					<div key={i}>
						{winner.pos !== undefined ? `${winner.pos} ` : undefined}
						{playerName}
						{playerStats !== undefined ? ` ${playerStats}` : undefined}
					</div>
				);
			})}
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
		setAwardsState(() => helpers.deepCopy(awards));
	}, [awards, season]);

	const formId = useId();

	const playersByPid = groupByUnique(players, "pid");

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
										award={{
											...award,
											teamIndex: i,
										}}
										disabled={saving}
										players={players}
										playersByPid={playersByPid}
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
