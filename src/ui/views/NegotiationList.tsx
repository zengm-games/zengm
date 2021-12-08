import {
	DataTable,
	NegotiateButtons,
	RosterComposition,
	RosterSalarySummary,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { helpers, logEvent, toWorker } from "../util";
import type { Player, View } from "../../common/types";
import getTemplate from "../util/columns/getTemplate";

const NegotiationList = ({
	capSpace,
	hardCap,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	players,
	config,
	sumContracts,
	userPlayers,
}: View<"negotiationList">) => {
	const title = hardCap ? "Rookies and Expiring Contracts" : "Re-sign Players";

	useTitleBar({ title });

	if (spectator) {
		return <p>The AI will handle re-signing players in spectator mode.</p>;
	}

	const cols = [
		...config.columns,
		{
			key: "negotiate",
			title: "Negotiate",
			render: (p: Player) => (
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
		},
	];

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: Object.fromEntries(
				cols.map(col => [col.key, getTemplate(p, col, config)]),
			),
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
				config={config}
				defaultSort={["Asking For", "desc"]}
				name="NegotiationList"
				rows={rows}
			/>
		</>
	);
};

export default NegotiationList;
