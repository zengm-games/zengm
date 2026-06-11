import { useState, type Dispatch, type SetStateAction } from "react";
import { getCols } from "../../common/getCols.ts";
import type { View } from "../../common/types.ts";
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
import { processPlayerStats } from "../util/processPlayerStats.ts";
import { toWorker } from "../util/toWorker.ts";
import { HelpPopover } from "../components/HelpPopover.tsx";
import useLocalStorageState from "use-local-storage-state";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";

const NUM_ROUNDS = 12;

type DraftState = View<"eightyTwoZeroDraft">["initialDraftState"];

type EightyTwoZeroDraftPlayer = NonNullable<
	DraftState["currentTeam"]
>["players"][number];

type EightyTwoZeroDraftStats = View<"eightyTwoZeroDraft">["stats"];

type Processing = "cancel" | "finalize" | "pick" | "start" | "lifeline";

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
	hideRatingsAndStats: boolean,
) => {
	const ratings = last(p.ratings);
	const processedStats = getProcessedStats(p, stats);

	return [
		ratings.pos,
		season - p.born.year,
		hideRatingsAndStats ? null : ratings.ovr,
		hideRatingsAndStats ? null : ratings.pot,
		...stats.map((stat) =>
			hideRatingsAndStats ? null : formatStat(processedStats, stat),
		),
	];
};

const DraftedPlayersTable = ({
	className,
	picks,
	stats,
}: {
	className?: string;
	picks: DraftState["picks"];
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
			Pick: {
				sortType: "number",
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
				...getPlayerTableData(pick.p, pick.season, stats, false),
			],
		};
	});

	return (
		<div className={className}>
			<h2>Drafted Players</h2>
			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="EightyTwoZeroDraft:Drafted"
				rows={rows}
				hideAllControls
				hideMenuToo
			/>
		</div>
	);
};

const Lifelines = ({
	currentTeam,
	disabled,
	setDraftState,
	setErrorMessage,
	setProcessing,
	used,
}: {
	currentTeam: NonNullable<DraftState["currentTeam"]>;
	disabled: boolean;
	setDraftState: Dispatch<SetStateAction<DraftState>>;
	setErrorMessage: Dispatch<SetStateAction<string | undefined>>;
	setProcessing: Dispatch<SetStateAction<Processing | undefined>>;
	used: {
		newTeam: boolean;
		newSeason: boolean;
		unlock: boolean;
	};
}) => {
	const somePlayersAreLocked = currentTeam.disabledCount > 0;

	const lifelines: {
		key: keyof typeof used;
		text: string;
		forceDisabled: boolean;
	}[] = [
		{
			key: "newTeam",
			text: `New team from ${currentTeam.season}`,
			forceDisabled: false,
		},
		{
			key: "newSeason",
			text: `New season from ${currentTeam.abbrev}`,
			forceDisabled: false,
		},
		{
			key: "unlock",
			text: `Unlock all players`,
			forceDisabled: !somePlayersAreLocked,
		},
	];

	return (
		<>
			<h3>
				Lifelines{" "}
				<HelpPopover>
					<p>You can use each lifeline once per draft.</p>
				</HelpPopover>
			</h3>
			<div className="d-flex gap-2">
				{lifelines.map(({ forceDisabled, key, text }) => {
					return (
						<button
							key={key}
							className="btn btn-secondary"
							disabled={disabled || forceDisabled || used[key]}
							onClick={async () => {
								setProcessing("lifeline");
								setErrorMessage(undefined);
								try {
									setDraftState(
										await toWorker("eightyTwoZeroDraft", "useLifeline", key),
									);
								} catch (error) {
									setErrorMessage(error.message);
								} finally {
									setProcessing(undefined);
								}
							}}
						>
							{text}
						</button>
					);
				})}
			</div>
		</>
	);
};

const EightyTwoZeroDraft = (props: View<"eightyTwoZeroDraft">) => {
	const { stats, initialDraftState } = props;
	const [draftState, setDraftState] = useState(initialDraftState);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [processing, setProcessing] = useState<Processing | undefined>();
	const [eliteBallKnowerMode, setEliteBallKnowerMode] = useLocalStorageState(
		"eliteBallKnowerMode",
		{ defaultValue: false },
	);

	useTitleBar({
		title: "82-0 Draft",
		hideNewWindow: true,
	});

	const startDraft = async () => {
		setErrorMessage(undefined);
		setProcessing("start");
		try {
			setDraftState(
				await toWorker("eightyTwoZeroDraft", "start", eliteBallKnowerMode),
			);
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
					cancelText: "Continue draft",
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
		setErrorMessage(undefined);
		setProcessing("finalize");
		try {
			await toWorker("eightyTwoZeroDraft", "finalize", undefined);
			realtimeUpdate([], helpers.leagueUrl(["roster"]));
		} catch (error) {
			setErrorMessage(
				`${error.message} Check your roster before trying again.`,
			);
			setProcessing(undefined);
		}
	};

	if (!draftState.started) {
		return (
			<>
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

				<div className="d-flex mb-3 align-items-center">
					<div className="form-check mb-0">
						<label className="form-check-label">
							<input
								className="form-check-input"
								type="checkbox"
								checked={eliteBallKnowerMode}
								onChange={() => {
									setEliteBallKnowerMode((enabled) => !enabled);
								}}
							/>
							Elite Ball Knower Mode
						</label>
					</div>
					<HelpPopover className="ms-1">
						<p>
							When Elite Ball Knower Mode is enabled, player ratings and stats
							are hidden during the draft.
						</p>
					</HelpPopover>
				</div>

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
						disabled={processing !== undefined}
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

	const currentTeam = draftState.currentTeam;

	if (!currentTeam) {
		return <p>Loading...</p>;
	}

	const draftedSrIDs = new Set(
		draftState.picks.map((pick) => pick.p.srID).filter(Boolean),
	);

	const cols = getCols(
		[
			"",
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
		const disabled = locked || alreadyDrafted || processing !== undefined;

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
				getPlayerNameLabels(p, currentTeam.season),
				...getPlayerTableData(
					p,
					currentTeam.season,
					stats,
					draftState.eliteBallKnowerMode,
				),
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

			<div className="alert alert-info">
				<Lifelines
					currentTeam={currentTeam}
					disabled={processing !== undefined}
					setDraftState={setDraftState}
					setErrorMessage={setErrorMessage}
					setProcessing={setProcessing}
					used={draftState.lifelinesUsed}
				/>
			</div>

			<DataTable
				cols={cols}
				defaultSort={[4, "desc"]}
				name="EightyTwoZeroDraft:Undrafted"
				rows={rows}
				hideAllControls
				hideMenuToo
			/>

			<DraftedPlayersTable
				className="mt-4"
				picks={draftState.picks}
				stats={stats}
			/>
		</div>
	);
};

export default EightyTwoZeroDraft;
