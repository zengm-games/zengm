import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { PHASE } from "../../common";
import {
	DataTable,
	MoreLinks,
	NegotiateButtons,
	RosterComposition,
	RosterSalarySummary,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { confirm, toWorker, useLocalShallow } from "../util";
import type { View } from "../../common/types";
import getTemplate from "../util/columns/getTemplate";
import { TableConfig } from "../util/TableConfig";
import type { Filter } from "../components/DataTable";

const FreeAgents = ({
	capSpace,
	challengeNoFreeAgents,
	challengeNoRatings,
	godMode,
	salaryCapType,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	phase,
	players,
	config: _config,
	userPlayers,
}: View<"freeAgents">) => {
	const [addFilters, setAddFilters] = useState<Filter[] | undefined>();

	const config = TableConfig.unserialize(_config);

	config.addColumn(
		{
			key: "negotiate",
			title: "Negotiate",
			template: ({ p, c, vars }) => (
				// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
				// @ts-expect-error
				<NegotiateButtons
					canGoOverCap={vars.salaryCapType === "none"}
					capSpace={capSpace}
					disabled={gameSimInProgress}
					minContract={vars.minContract}
					spectator={vars.spectator}
					p={p}
					willingToNegotiate={p.mood.user.willing}
				/>
			),
		},
		1,
	);

	const cols = [...config.columns];

	const showAfforablePlayers = useCallback(() => {
		let newAddFilters: Filter[];
		if (capSpace * 1000 > minContract && !challengeNoFreeAgents) {
			newAddFilters = [{ col: "Asking For", value: `<${capSpace}` }];
		} else {
			newAddFilters = [{ col: "Asking For", value: `<${minContract / 1000}` }];
		}

		setAddFilters(newAddFilters);

		// This is a hack to make the addFilters passed to DataTable only happen once, otherwise it will keep getting
		// applied every refresh (like when playing games) even if the user had disabled or edited the filter. Really, it'd
		// be better if sent as some kind of signal or event rather than as a prop, because it is transient.
		setTimeout(() => {
			setAddFilters(undefined);
		}, 0);
	}, [capSpace, challengeNoFreeAgents, minContract]);

	useTitleBar({ title: "Free Agents" });

	const { gameSimInProgress } = useLocalShallow(state => ({
		gameSimInProgress: state.gameSimInProgress,
	}));

	if (
		(phase > PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.RESIGN_PLAYERS) ||
		phase === PHASE.FANTASY_DRAFT ||
		phase === PHASE.EXPANSION_DRAFT
	) {
		return (
			<div>
				<MoreLinks type="freeAgents" page="free_agents" />
				<p>You're not allowed to sign free agents now.</p>
				<p>
					Free agents can only be signed before the playoffs or after players
					are re-signed.
				</p>
			</div>
		);
	}

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
			<RosterComposition className="float-end mb-3" players={userPlayers} />

			<MoreLinks type="freeAgents" page="free_agents" />

			<RosterSalarySummary
				capSpace={capSpace}
				salaryCapType={salaryCapType}
				maxContract={maxContract}
				minContract={minContract}
				numRosterSpots={numRosterSpots}
			/>

			<div className="d-sm-flex mb-3">
				<button className="btn btn-secondary" onClick={showAfforablePlayers}>
					Show players you can afford now
				</button>

				<div className="d-block">
					{godMode ? (
						<button
							className="btn btn-god-mode ms-sm-2 mt-2 mt-sm-0"
							onClick={async () => {
								const proceed = await confirm(
									`Are you sure you want to delete all ${players.length} free agents?`,
									{
										okText: "Delete Players",
									},
								);
								if (proceed) {
									await toWorker(
										"main",
										"removePlayers",
										players.map(p => p.pid),
									);
								}
							}}
						>
							Delete all players
						</button>
					) : null}
				</div>
			</div>

			{gameSimInProgress && !spectator ? (
				<p className="text-danger">Stop game simulation to sign free agents.</p>
			) : null}

			{spectator ? (
				<p className="alert alert-danger d-inline-block">
					The AI will handle signing free agents in spectator mode.
				</p>
			) : challengeNoFreeAgents ? (
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> You are not allowed to sign free agents, except
					to minimum contracts.
				</p>
			) : null}

			<DataTable
				cols={cols}
				config={config}
				defaultSort={["Ovr", "desc"]}
				name="FreeAgents"
				pagination
				rows={rows}
				addFilters={addFilters}
			/>
		</>
	);
};

FreeAgents.propTypes = {
	capSpace: PropTypes.number.isRequired,
	salaryCapType: PropTypes.string.isRequired,
	minContract: PropTypes.number.isRequired,
	numRosterSpots: PropTypes.number.isRequired,
	phase: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	userPlayers: PropTypes.arrayOf(
		PropTypes.shape({
			ratings: PropTypes.shape({
				pos: PropTypes.string,
			}),
		}),
	).isRequired,
};

export default FreeAgents;
