import { DataTable } from "../components/DataTable/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { showNotification } from "../util/showNotification.ts";
import { toWorker } from "../util/toWorker.ts";
import { getCols } from "../../common/getCols.ts";
import type { View } from "../../common/types.ts";
import { wrappedMood } from "../components/Mood.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { wrappedCurrency } from "../components/wrappedCurrency.ts";
import { SafeHtml } from "../components/SafeHtml.tsx";
import { NegotiateButtons } from "../components/NegotiateButtons.tsx";
import { RosterComposition } from "../components/RosterComposition.tsx";
import { RosterSalarySummary } from "../components/RosterSalarySummary.tsx";
import {
	NegotiationModal,
	useNegotiaionModal,
} from "../components/NegotiationModal.tsx";
import { useLocal } from "../util/local.ts";
import clsx from "clsx";
import { showUndoNotification } from "../components/UndoNotification.tsx";

const showReleaseUndo = ({
	name,
	undoKey,
}: {
	name: string;
	undoKey: number;
}) => {
	showUndoNotification({
		actionName: "release",
		undoKey,
		title: `You released ${name}`,
	});
};

const NegotiationList = ({
	capSpace,
	draftPickAutoContract,
	numRosterSpots,
	payroll,
	players,
	stats,
	sumContracts,
	userPlayers,
}: View<"negotiationList">) => {
	const { challengeNoRatings, minContract, salaryCapType, spectator, season } =
		useLocal([
			"challengeNoRatings",
			"minContract",
			"salaryCapType",
			"spectator",
			"season",
		]);

	const rookiesNeedSigning = salaryCapType === "hard" || !draftPickAutoContract;

	const title = rookiesNeedSigning
		? "Rookies and Expiring Contracts"
		: "Re-sign Players";

	useTitleBar({ title });

	const negotiationModal = useNegotiaionModal();

	if (spectator) {
		return <p>The AI will handle re-signing players in spectator mode.</p>;
	}

	const cols = getCols(
		[
			"Name",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			...stats.map((stat) => `stat:${stat}`),
			"Acquired",
			"Mood",
			"Old Salary",
			"Asking For",
			"Exp",
			"Actions",
		],
		{
			Actions: {
				width: "1px",
			},
		},
	);

	const rows: DataTableRow<"player">[] = players.map((p) => {
		const negotiateButtons = (
			<NegotiateButtons
				canGoOverCap={salaryCapType === "none" || salaryCapType === "soft"}
				capSpace={capSpace}
				minContract={minContract}
				onNegotiate={async () => {
					await negotiationModal.negotiate(p.pid);
				}}
				spectator={spectator}
				p={p}
				willingToNegotiate={p.mood.user.willing}
			/>
		);

		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season,
				playoffs: "regularSeason",
			},
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					skills: p.ratings.skills,
					defaultWatch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
				{
					value: <SafeHtml dirty={p.latestTransaction} />,
					searchValue: p.latestTransaction,
					sortValue: p.latestTransactionSeason,
				},
				wrappedMood({
					defaultType: "user",
					maxWidth: true,
					p,
				}),
				// Players who have never been paid have no previous salary
				p.lastSalary === undefined
					? {
							value: null,
							classNames: "text-body-secondary",
						}
					: {
							...wrappedCurrency(p.lastSalary, "M"),
							classNames: "text-body-secondary",
						},
				wrappedCurrency(p.mood.user.contractAmount / 1000, "M"),
				p.contract.exp,
				{
					value: (
						<>
							{negotiateButtons}
							<button
								type="button"
								className={clsx(
									"btn btn-light-bordered btn-xs",
									p.mood.user.willing ? undefined : "ms-auto",
								)}
								onClick={async () => {
									const undoKey = await toWorker(
										"main",
										"cancelContractNegotiation",
										p.pid,
									);
									showReleaseUndo({
										name: `${p.firstName} ${p.lastName}`,
										undoKey,
									});
								}}
							>
								Release
							</button>
						</>
					),
					classNames: "d-flex align-items-center gap-2",
					searchValue: p.mood.user.willing
						? "Negotiate Sign Release"
						: "Refuses! Release",
				},
			],
			classNames: {
				"table-info": p.contract.rookie,
			},
		};
	});

	const hasRookies = players.some((p) => p.contract.rookie);

	const signableRookies = players.filter(
		(p) => p.contract.rookie && p.mood.user.willing,
	);

	let sumRookieContracts = 0;
	for (const p of signableRookies) {
		sumRookieContracts += p.mood.user.contractAmount;
	}
	sumRookieContracts /= 1000;

	// Only check cap space for hard cap, since in a soft cap you can go over the cap to re-sign your own players
	const overCapAll = salaryCapType === "hard" && sumContracts > capSpace;
	const overCapRookies =
		salaryCapType === "hard" &&
		signableRookies.length > 0 &&
		sumRookieContracts > capSpace;

	const overCapText = overCapRookies
		? "You don't have enough cap space to sign all your players or all your rookies."
		: overCapAll
			? "You don't have enough cap space to sign all your players."
			: undefined;

	const signAll = async (playersToSign: typeof players, undoText: string) => {
		const response = await toWorker("main", "reSignAll", playersToSign);

		if (typeof response === "string") {
			showNotification({
				type: "error",
				text: response,
			});
		} else {
			showUndoNotification({
				actionName: "signings",
				undoKey: response,
				title: undoText,
			});
		}
	};

	return (
		<>
			<RosterComposition className="float-end mb-3" players={userPlayers} />

			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["upcoming_free_agents"])}>
					Upcoming Free Agents
				</a>
			</p>

			{salaryCapType === "soft" ? (
				<p>
					You are allowed to go over the salary cap to re-sign your players
					before they become free agents. If you do not re-sign them before free
					agency begins, they will be free to sign with any team, and you won't
					be able to go over the salary cap to sign them.
				</p>
			) : null}

			<RosterSalarySummary
				capSpace={capSpace}
				numRosterSpots={numRosterSpots}
				payroll={payroll}
			/>

			<p>
				Your unsigned players are asking for a total of{" "}
				<b>{helpers.formatCurrency(sumContracts, "M")}</b>.
				{hasRookies ? (
					<>
						{" "}
						Rookies you just drafted are{" "}
						<span className="text-info">highlighted in blue</span>.
					</>
				) : null}
			</p>

			{players.length > 0 ? (
				<div className="d-flex gap-2 mb-3">
					<button
						className="btn btn-secondary"
						disabled={overCapAll}
						onClick={async () => {
							await signAll(
								players,
								`${rookiesNeedSigning ? "Signed" : "Re-signed"} ${players.length} ${helpers.plural(
									"player",
									players.length,
								)}`,
							);
						}}
					>
						{rookiesNeedSigning ? "Sign all" : "Re-sign all"}
					</button>
					{rookiesNeedSigning ? (
						<button
							className="btn btn-secondary"
							disabled={signableRookies.length === 0 || overCapRookies}
							onClick={async () => {
								await signAll(
									signableRookies,
									`Signed ${signableRookies.length} ${helpers.plural(
										"rookie",
										signableRookies.length,
									)}`,
								);
							}}
						>
							Sign all rookies
						</button>
					) : null}
				</div>
			) : null}

			{overCapText ? <p className="text-danger">{overCapText}</p> : null}

			<DataTable
				cols={cols}
				defaultSort={[10, "desc"]}
				name="NegotiationList"
				rows={rows}
			/>

			<NegotiationModal {...negotiationModal.props} />
		</>
	);
};

export default NegotiationList;
