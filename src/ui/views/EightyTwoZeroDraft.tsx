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
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import { RecordAndPlayoffs } from "../components/RecordAndPlayoffs.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { confirm } from "../util/confirm.tsx";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";
import { processPlayerStats } from "../util/processPlayerStats.ts";
import { toWorker } from "../util/toWorker.ts";
import { applyRealTeamInfos } from "./NewLeague/index.tsx";

const NUM_ROUNDS = 12;

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

type EightyTwoZeroDraftStats = View<"eightyTwoZeroDraft">["stats"];

const getProcessedStats = (
	p: EightyTwoZeroDraftPlayer,
	stats: EightyTwoZeroDraftStats,
) => {
	const row = p.stats.at(-1);
	return row
		? processPlayerStats(row, stats, "perGame", p.born.year)
		: undefined;
};

const formatStat = (
	processedStats: ReturnType<typeof getProcessedStats>,
	stat: string,
) => {
	const value = processedStats?.[stat];
	return typeof value === "number" ? helpers.roundStat(value, stat) : value;
};

const getPlayerNameLabels = (p: EightyTwoZeroDraftPlayer, season: number) => {
	const ratings = last(p.ratings);
	const stats = p.stats.at(-1);

	return wrappedPlayerNameLabels({
		pid: p.pid,
		firstName: p.firstName,
		lastName: p.lastName,
		jerseyNumber: stats?.jerseyNumber ?? p.jerseyNumber,
		skills: ratings.skills,
		fullNames: true,
		disableNameLink: true,
		season,
		defaultWatch: p.watch ?? 0,
	});
};

const getPlayerTableData = (
	p: EightyTwoZeroDraftPlayer,
	season: number,
	stats: EightyTwoZeroDraftStats,
) => {
	const ratings = last(p.ratings);
	const processedStats = getProcessedStats(p, stats);

	return [
		ratings.pos,
		season - p.born.year,
		ratings.ovr,
		ratings.pot,
		...stats.map((stat) => formatStat(processedStats, stat)),
	];
};

const DraftedPlayersTable = ({
	picks,
	stats,
}: {
	picks: View<"eightyTwoZeroDraft">["picks"];
	stats: EightyTwoZeroDraftStats;
}) => {
	if (picks.length === 0) {
		return null;
	}

	const cols = getCols(
		[
			"Pick",
			"Name",
			"Team",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			...stats.map((stat) => `stat:${stat}`),
		],
		{
			Name: {
				width: "100%",
			},
		},
	);

	const rows: DataTableRow[] = picks.map((pick, i) => {
		return {
			key: `${pick.p.pid ?? pick.p.srID ?? i}-${i}`,
			metadata:
				pick.p.pid !== undefined
					? {
							type: "player",
							pid: pick.p.pid,
							season: pick.season,
							playoffs: "regularSeason",
						}
					: undefined,
			data: [
				i + 1,
				getPlayerNameLabels(pick.p, pick.season),
				`${pick.season} ${pick.teamAbbrev}`,
				...getPlayerTableData(pick.p, pick.season, stats),
			],
		};
	});

	return (
		<div className="mt-4">
			<h2>Drafted Players</h2>
			<DataTable
				cols={cols}
				defaultSort="disableSort"
				name="EightyTwoZeroDraft:Drafted"
				rows={rows}
				hideAllControls
				hideMenuToo
			/>
		</div>
	);
};

const EightyTwoZeroDraft = (props: View<"eightyTwoZeroDraft">) => {
	const { realTeamInfo, stats, ...initialDraftState } = props;
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
			setErrorMessage(error.message);
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
					okText: "Cancel draft",
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
			setErrorMessage(error.message);
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
			setErrorMessage(error.message);
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
				`${error.message} Check your roster before trying again.`,
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
					{process.env.SPORT} team. Draft one player from that roster. Every two
					rounds, one more of the team's top players is locked, so later rounds
					force you deeper into the roster.
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
				<DraftedPlayersTable picks={draftState.picks} stats={stats} />

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
						variant="danger"
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
		[
			"Draft",
			"#",
			"Name",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			...stats.map((stat) => `stat:${stat}`),
		],
		{
			Name: {
				width: "100%",
			},
		},
	);

	const rows: DataTableRow[] = currentTeam.players.map((p, i) => {
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
				getPlayerNameLabels(p, currentTeam.season),
				...getPlayerTableData(p, currentTeam.season, stats),
			],
		};
	});

	const logoURL = currentTeam.imgURLSmall ?? currentTeam.imgURL;

	return (
		<div style={{ maxWidth: 800 }}>
			<div className="d-flex justify-content-between align-items-start gap-3 mb-3">
				<div>
					<h2>
						Round {draftState.round} of {NUM_ROUNDS}
					</h2>
					<div className="d-flex align-items-center gap-2">
						{logoURL ? (
							<img
								src={logoURL}
								alt="Team logo"
								style={{
									width: 40,
									height: 40,
									objectFit: "contain",
								}}
							/>
						) : null}
						<div>
							<div>
								{currentTeam.season} {currentTeam.region} {currentTeam.name}
							</div>
							{currentTeam.seasonInfo ? (
								<RecordAndPlayoffs
									abbrev={currentTeam.abbrev}
									lost={currentTeam.seasonInfo.lost}
									otl={currentTeam.seasonInfo.otl}
									noLinks
									option="noSeason"
									roundsWonText={currentTeam.seasonInfo.roundsWonText}
									season={currentTeam.season}
									tid={currentTeam.tid}
									tied={currentTeam.seasonInfo.tied}
									won={currentTeam.seasonInfo.won}
								/>
							) : null}
						</div>
					</div>
				</div>
				<ActionButton
					disabled={processing !== undefined}
					onClick={cancelDraft}
					processing={processing === "cancel"}
					processingText="Canceling"
					variant="danger"
				>
					Cancel
				</ActionButton>
			</div>

			{errorMessage ? <p className="text-danger">{errorMessage}</p> : null}

			<DataTable
				cols={cols}
				defaultSort="disableSort"
				name="EightyTwoZeroDraft"
				rows={rows}
				hideAllControls
				hideMenuToo
			/>

			<DraftedPlayersTable picks={draftState.picks} stats={stats} />
		</div>
	);
};

export default EightyTwoZeroDraft;
