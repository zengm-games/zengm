import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { PHASE } from "../../common";
import {
	DataTable,
	MoreLinks,
	NegotiateButtons,
	PlayerNameLabels,
	RosterComposition,
	RosterSalarySummary,
} from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, useLocalShallow } from "../util";
import type { View } from "../../common/types";
import { dataTableWrappedMood } from "../components/Mood";

const FreeAgents = ({
	capSpace,
	challengeNoFreeAgents,
	challengeNoRatings,
	hardCap,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	phase,
	players,
	stats,
	userPlayers,
}: View<"freeAgents">) => {
	const [addFilters, setAddFilters] = useState<
		(string | undefined)[] | undefined
	>();

	const showAfforablePlayers = useCallback(() => {
		const newAddFilters: (string | undefined)[] = new Array(9 + stats.length);
		if (capSpace * 1000 > minContract && !challengeNoFreeAgents) {
			newAddFilters[newAddFilters.length - 3] = `<${capSpace}`;
		} else {
			newAddFilters[newAddFilters.length - 3] = `<${minContract / 1000}`;
		}

		setAddFilters(newAddFilters);

		// This is a hack to make the addFilters passed to DataTable only happen once, otherwise it will keep getting
		// applied every refresh (like when playing games) even if the user had disabled or edited the filter. Really, it'd
		// be better if sent as some kind of signal or event rather than as a prop, because it is transient.
		setTimeout(() => {
			setAddFilters(undefined);
		}, 0);
	}, [capSpace, challengeNoFreeAgents, minContract, stats]);

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

	const cols = getCols([
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
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
							capSpace={capSpace}
							disabled={gameSimInProgress}
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

			<MoreLinks type="freeAgents" page="free_agents" />

			<RosterSalarySummary
				capSpace={capSpace}
				hardCap={hardCap}
				maxContract={maxContract}
				minContract={minContract}
				numRosterSpots={numRosterSpots}
			/>

			<p>
				<button className="btn btn-secondary" onClick={showAfforablePlayers}>
					Show players you can afford now
				</button>
			</p>

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
				defaultSort={[cols.length - 3, "desc"]}
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
	hardCap: PropTypes.bool.isRequired,
	minContract: PropTypes.number.isRequired,
	numRosterSpots: PropTypes.number.isRequired,
	phase: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userPlayers: PropTypes.arrayOf(
		PropTypes.shape({
			ratings: PropTypes.shape({
				pos: PropTypes.string,
			}),
		}),
	).isRequired,
};

export default FreeAgents;
