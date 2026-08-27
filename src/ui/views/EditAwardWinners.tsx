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
import { formatPlayerAwardName } from "../../common/awards.ts";

type Winner =
	| (AwardInfoIndividual["winner"][number] & {
			pos?: undefined;
	  })
	| AwardInfoTeam["winner"][number][number];

const Award = ({
	award,
	disabled,
	players,
}: {
	award:
		| (AwardInfoIndividual & { teamIndex?: undefined })
		| (AwardInfoTeam & { teamIndex: number });
	disabled: boolean;
} & Pick<View<"editAwardWinners">, "players">) => {
	let rank;
	let winners: Winner[];
	if (award.teamIndex !== undefined) {
		rank = award.teamIndex + 1;
		winners = award.winner[award.teamIndex]!;
	} else {
		rank = 1;
		winners = award.winner;
	}

	return (
		<div className="col-md-4 col-6">
			<h3>
				{formatPlayerAwardName({
					name: award.name,
					numTeams: award.numTeams,
					rank,
				})}
			</h3>
			{winners.map((winner) => {
				if (winner === undefined) {
					return <div>Blank</div>;
				}

				return (
					<div>
						{winner.pos !== undefined ? `${winner.pos} ` : undefined}
						{players[winner.pid]?.name ?? "???"}
					</div>
				);
			})}
		</div>
	);
};

const EditAwardWinners = ({
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

	return (
		<>
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
										award={{
											...award,
											teamIndex: i,
										}}
										disabled={saving}
										players={players}
									/>
								);
							});
						}

						return <Award award={award} disabled={saving} players={players} />;
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
