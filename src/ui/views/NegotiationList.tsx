import {
	DataTable,
	NegotiateButtons,
	RosterComposition,
	RosterSalarySummary,
	SafeHtml,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, getCols, helpers, logEvent, toWorker } from "../util";
import type { View } from "../../common/types";
import { dataTableWrappedMood } from "../components/Mood";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels";

const NegotiationList = ({
	capSpace,
	challengeNoRatings,
	draftPickAutoContract,
	luxuryPayroll,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	payroll,
	players,
	salaryCapType,
	stats,
	sumContracts,
	userPlayers,
}: View<"negotiationList">) => {
	const title =
		salaryCapType === "hard" || !draftPickAutoContract
			? "Rookies and Expiring Contracts"
			: "Re-sign Players";

	useTitleBar({ title });

	if (spectator) {
		return <p>The AI will handle re-signing players in spectator mode.</p>;
	}

	const cols = getCols([
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
		"Acquired",
		"Mood",
		"Asking For",
		"Exp",
		"Negotiate",
	]);

	const rows = players.map(p => {
		const negotiateButtons = (
			<NegotiateButtons
				canGoOverCap={salaryCapType === "none" || salaryCapType === "soft"}
				capSpace={capSpace}
				minContract={minContract}
				spectator={spectator}
				p={p}
				willingToNegotiate={p.mood.user.willing}
			/>
		);

		return {
			key: p.pid,
			data: [
				wrappedPlayerNameLabels({
					pid: p.pid,
					injury: p.injury,
					jerseyNumber: p.jerseyNumber,
					skills: p.ratings.skills,
					watch: p.watch,
					firstName: p.firstName,
					firstNameShort: p.firstNameShort,
					lastName: p.lastName,
				}),
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				{
					value: <SafeHtml dirty={p.latestTransaction} />,
					searchValue: p.latestTransaction,
					sortValue: p.latestTransactionSeason,
				},
				dataTableWrappedMood({
					defaultType: "user",
					maxWidth: true,
					p,
				}),
				helpers.formatCurrency(p.mood.user.contractAmount / 1000, "M"),
				p.contract.exp,
				{
					value: (
						<div className="d-flex align-items-center">
							{negotiateButtons}
							<button
								type="button"
								className="btn-close ms-2 p-0"
								title="End negotiation"
								onClick={async () => {
									await toWorker("main", "cancelContractNegotiation", p.pid);
								}}
							/>
						</div>
					),
					searchValue: p.mood.user.willing ? "Negotiate Sign" : "Refuses!",
				},
			],
			classNames: {
				"table-info": p.contract.rookie,
			},
		};
	});

	const hasRookies = players.some(p => p.contract.rookie);

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
				salaryCapType={salaryCapType}
				luxuryPayroll={luxuryPayroll}
				maxContract={maxContract}
				minContract={minContract}
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

			{(salaryCapType !== "hard" || sumContracts < capSpace) &&
			players.length > 0 ? (
				<button
					className="btn btn-secondary mb-3"
					onClick={async () => {
						const proceed = await confirm(
							`Are you sure you want to re-sign all ${players.length} ${
								players.length === 1 ? "player" : "players"
							}?`,
							{
								okText: "Re-sign all",
							},
						);
						if (!proceed) {
							return;
						}

						const errorMsg = await toWorker("main", "reSignAll", players);

						if (errorMsg) {
							logEvent({
								type: "error",
								text: errorMsg,
								saveToDb: false,
							});
						}
					}}
				>
					Re-sign all
				</button>
			) : null}

			<DataTable
				cols={cols}
				defaultSort={[10, "desc"]}
				name="NegotiationList"
				rows={rows}
			/>
		</>
	);
};

export default NegotiationList;
