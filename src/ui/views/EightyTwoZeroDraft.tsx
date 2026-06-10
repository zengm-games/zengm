import { useMemo, useState } from "react";
import { PHASE } from "../../common/constants.ts";
import { getCols } from "../../common/getCols.ts";
import type { Phase, View } from "../../common/types.ts";
import { last } from "../../common/utils.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import {
	DataTable,
	type DataTableRow,
} from "../components/DataTable/index.tsx";
import { PlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { confirm } from "../util/confirm.tsx";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";
import { toWorker } from "../util/toWorker.ts";
import { applyRealTeamInfos } from "./NewLeague/index.tsx";

const NUM_ROUNDS = 12;

const getErrorMessage = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

const getActiveDraftErrorMessage = (phase: Phase) => {
	if (phase === PHASE.DRAFT) {
		return "You can't start an 82-0 Draft while a regular draft is already in progress.";
	}

	if (phase === PHASE.FANTASY_DRAFT) {
		return "You can't start an 82-0 Draft while a fantasy draft is already in progress.";
	}

	if (phase === PHASE.EXPANSION_DRAFT) {
		return "You can't start an 82-0 Draft while an expansion draft is already in progress.";
	}
};

type EightyTwoZeroDraftPlayer = NonNullable<
	View<"eightyTwoZeroDraft">["currentTeam"]
>["players"][number];

const formatPerGameStat = (
	stats: EightyTwoZeroDraftPlayer["stats"][number] | undefined,
	stat: "pts" | "trb" | "ast",
) => {
	if (!stats || stats.gp === undefined || stats.gp === 0) {
		return null;
	}

	let value;
	if (stat === "trb") {
		value = (stats.trb ?? 0) + (stats.drb ?? 0) + (stats.orb ?? 0);
	} else {
		value = stats[stat];
	}

	if (typeof value !== "number") {
		return null;
	}

	return helpers.roundStat(value / stats.gp, stat);
};

const PicksList = ({
	picks,
}: {
	picks: View<"eightyTwoZeroDraft">["picks"];
}) => {
	if (picks.length === 0) {
		return null;
	}

	return (
		<ol className="list-unstyled mb-3">
			{picks.map((pick, i) => {
				const ratings = last(pick.p.ratings);
				return (
					<li key={i} className="d-flex gap-2 align-items-baseline">
						<span className="text-body-secondary text-nowrap">{i + 1}.</span>
						<span>
							{pick.p.firstName} {pick.p.lastName}
						</span>
						<span className="text-body-secondary">
							{ratings.pos}, {ratings.ovr} ovr, {pick.season} {pick.teamAbbrev}
						</span>
					</li>
				);
			})}
		</ol>
	);
};

const EightyTwoZeroDraft = (props: View<"eightyTwoZeroDraft">) => {
	const { realTeamInfo, ...initialDraftState } = props;
	const [draftState, setDraftState] = useState(initialDraftState);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [finalized, setFinalized] = useState(false);
	const [processing, setProcessing] = useState<
		"cancel" | "finalize" | "pick" | "start" | undefined
	>();

	useTitleBar({
		title: "82-0 Draft",
	});

	const { phase } = useLocal(["phase"]);

	const currentTeam = useMemo(() => {
		if (!draftState.currentTeam) {
			return;
		}

		return applyRealTeamInfos(
			[draftState.currentTeam],
			realTeamInfo,
			"inTeamObject",
		)[0]!;
	}, [draftState.currentTeam, realTeamInfo]);

	if (!draftState.godMode) {
		return (
			<>
				<h2>Error</h2>
				<p>God Mode is required for 82-0 Draft.</p>
			</>
		);
	}

	if (!draftState.realPlayers) {
		return (
			<>
				<h2>Error</h2>
				<p>82-0 Draft is only available for basketball.</p>
			</>
		);
	}

	const activeDraftErrorMessage = getActiveDraftErrorMessage(phase);
	if (activeDraftErrorMessage) {
		return (
			<>
				<h2>Error</h2>
				<p>{activeDraftErrorMessage}</p>
			</>
		);
	}

	const startDraft = async () => {
		setErrorMessage(undefined);
		setFinalized(false);
		setProcessing("start");
		try {
			setDraftState(await toWorker("eightyTwoZeroDraft", "start", undefined));
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
		} finally {
			setProcessing(undefined);
		}
	};

	const cancelDraft = async () => {
		if (draftState.picks.length > 0) {
			const proceed = await confirm(
				`Cancel this draft? Your ${draftState.picks.length} ${helpers.plural(
					"pick",
					draftState.picks.length,
				)} will be lost.`,
				{
					okText: "Cancel Draft",
				},
			);
			if (!proceed) {
				return;
			}
		}

		setErrorMessage(undefined);
		setProcessing("cancel");
		try {
			setDraftState(await toWorker("eightyTwoZeroDraft", "cancel", undefined));
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
		} finally {
			setProcessing(undefined);
		}
	};

	const pickPlayer = async (pickIndex: number) => {
		setErrorMessage(undefined);
		setProcessing("pick");
		try {
			setDraftState(
				await toWorker("eightyTwoZeroDraft", "pick", {
					expectedRound: draftState.round,
					pickIndex,
				}),
			);
		} catch (error) {
			setErrorMessage(getErrorMessage(error));
		} finally {
			setProcessing(undefined);
		}
	};

	const finalizeDraft = async () => {
		const proceed = await confirm(
			"This deletes your current roster. This cannot be undone.",
			{
				okText: "Finalize Draft",
			},
		);
		if (!proceed) {
			return;
		}

		setErrorMessage(undefined);
		setProcessing("finalize");
		try {
			setDraftState(
				await toWorker("eightyTwoZeroDraft", "finalize", undefined),
			);
			setFinalized(true);
		} catch (error) {
			setErrorMessage(
				`${getErrorMessage(error)} Check your roster before trying again.`,
			);
		} finally {
			setProcessing(undefined);
		}
	};

	if (!draftState.started) {
		return (
			<>
				{finalized ? (
					<div className="alert alert-success">
						Your roster was replaced with your 82-0 Draft picks.
					</div>
				) : null}

				<p>
					In an "82-0 Draft", each round shows one random real historical{" "}
					{process.env.SPORT} team. Draft one player from that roster. Every
					round locks one more of the team's top players, so later rounds force
					you deeper into the roster.
				</p>

				<p>
					After 12 picks, finalizing the draft deletes your current roster and
					replaces it with your selected players.
				</p>

				{errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

				<ActionButton
					processing={processing === "start"}
					processingText="Starting"
					onClick={startDraft}
				>
					Start 82-0 Draft
				</ActionButton>
			</>
		);
	}

	const readyToFinalize = draftState.picks.length === NUM_ROUNDS;

	if (readyToFinalize) {
		return (
			<>
				<h2>Finalize Draft</h2>
				<PicksList picks={draftState.picks} />

				{errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

				<div className="d-flex gap-2 mb-3">
					<ActionButton
						processing={processing === "finalize"}
						processingText="Finalizing"
						onClick={finalizeDraft}
					>
						Finalize draft
					</ActionButton>
					<ActionButton
						disabled={processing !== undefined}
						onClick={cancelDraft}
						processing={processing === "cancel"}
						processingText="Canceling"
						variant="light-bordered"
					>
						Cancel
					</ActionButton>
				</div>
			</>
		);
	}

	if (!currentTeam) {
		return <p>Loading...</p>;
	}

	const draftedSrIDs = new Set(
		draftState.picks.map((pick) => pick.p.srID).filter(Boolean),
	);

	const cols = getCols(
		["", "#", "Name", "Pos", "Age", "Ovr", "GP", "PTS", "TRB", "AST"],
		{
			Name: {
				width: "100%",
			},
		},
	);

	const rows: DataTableRow[] = currentTeam.players.map((p, i) => {
		const ratings = last(p.ratings);
		const stats = p.stats.at(-1);
		const locked = i < currentTeam.disabledCount;
		const alreadyDrafted = p.srID !== undefined && draftedSrIDs.has(p.srID);
		const disabled =
			locked ||
			alreadyDrafted ||
			processing === "pick" ||
			processing === "cancel";

		return {
			key: p.pid ?? i,
			classNames: locked || alreadyDrafted ? "text-body-secondary" : undefined,
			data: [
				locked ? (
					<span className="badge bg-secondary">Locked</span>
				) : alreadyDrafted ? (
					<span className="badge bg-secondary">Drafted</span>
				) : (
					<button
						className="btn btn-xs btn-primary"
						disabled={disabled}
						onClick={() => pickPlayer(i)}
						title="Draft player"
					>
						Draft
					</button>
				),
				i + 1,
				<PlayerNameLabels
					firstName={p.firstName}
					lastName={p.lastName}
					jerseyNumber={stats?.jerseyNumber ?? p.jerseyNumber}
					skills={ratings.skills}
					fullNames
					disableNameLink
					season={currentTeam.season}
				/>,
				ratings.pos,
				currentTeam.season - p.born.year,
				ratings.ovr,
				stats?.gp ?? null,
				formatPerGameStat(stats, "pts"),
				formatPerGameStat(stats, "trb"),
				formatPerGameStat(stats, "ast"),
			],
		};
	});

	return (
		<>
			<div className="d-flex justify-content-between align-items-start gap-3 mb-3">
				<div>
					<h2 className="mb-0">
						Round {draftState.round} of {NUM_ROUNDS}
					</h2>
					<div className="text-body-secondary">
						{currentTeam.season} {currentTeam.region} {currentTeam.name}
					</div>
				</div>
				<ActionButton
					disabled={processing !== undefined}
					onClick={cancelDraft}
					processing={processing === "cancel"}
					processingText="Canceling"
					variant="light-bordered"
				>
					Cancel
				</ActionButton>
			</div>

			<PicksList picks={draftState.picks} />

			{errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

			<DataTable
				cols={cols}
				defaultSort="disableSort"
				name="EightyTwoZeroDraft"
				rows={rows}
				hideAllControls
				hideMenuToo
			/>
		</>
	);
};

export default EightyTwoZeroDraft;
