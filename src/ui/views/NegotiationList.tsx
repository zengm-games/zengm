import {
	DataTable,
	NegotiateButtons,
	PlayerNameLabels,
	RosterComposition,
	RosterSalarySummary,
	SafeHtml,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, logEvent, toWorker } from "../util";
import type { View } from "../../common/types";
import { dataTableWrappedMood } from "../components/Mood";

const NegotiationList = ({
	capSpace,
	challengeNoRatings,
	hardCap,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	players,
	stats,
	sumContracts,
	userPlayers,
}: View<"negotiationList">) => {
	const title = hardCap ? "Rookies and Expiring Contracts" : "Re-sign Players";

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
		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
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
						// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
						// @ts-ignore
						<NegotiateButtons
							canGoOverCap
							capSpace={capSpace}
							minContract={minContract}
							spectator={spectator}
							p={p}
							willingToNegotiate={p.mood.user.willing}
						/>
					),
					searchValue: p.mood.user.willing ? "Negotiate Sign" : "Refuses!",
				},
			],
		};
	});

	return (
		<>
			<RosterComposition className="float-right mb-3" players={userPlayers} />

			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["upcoming_free_agents"])}>
					Upcoming Free Agents
				</a>
			</p>

			{!hardCap ? (
				<p>
					You are allowed to go over the salary cap to re-sign your players
					before they become free agents. If you do not re-sign them before free
					agency begins, they will be free to sign with any team, and you won't
					be able to go over the salary cap to sign them.
				</p>
			) : null}

			<RosterSalarySummary
				capSpace={capSpace}
				hardCap={hardCap}
				maxContract={maxContract}
				minContract={minContract}
				numRosterSpots={numRosterSpots}
			/>

			{hardCap ? (
				<p>
					Your unsigned players are asking for a total of{" "}
					<b>{helpers.formatCurrency(sumContracts, "M")}</b>.
				</p>
			) : null}

			{!hardCap && players.length > 0 ? (
				<button
					className="btn btn-secondary mb-3"
					onClick={async () => {
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
