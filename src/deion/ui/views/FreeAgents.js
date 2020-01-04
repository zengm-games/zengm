import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { PHASE } from "../../common";
import {
	DataTable,
	NegotiateButtons,
	NewWindowLink,
	PlayerNameLabels,
	RosterComposition,
	RosterSalarySummary,
} from "../components";
import { getCols, helpers, setTitleBar } from "../util";

const FreeAgents = ({
	capSpace,
	gamesInProgress,
	hardCap,
	minContract,
	numRosterSpots,
	phase,
	players,
	playersRefuseToNegotiate,
	stats,
	userPlayers,
	userTid,
}) => {
	const [addFilters, setAddFilters] = useState();

	const showAfforablePlayers = useCallback(() => {
		const newAddFilters = new Array(8 + stats.length);
		if (capSpace * 1000 > minContract) {
			newAddFilters[newAddFilters.length - 3] = `<${capSpace}`;
		} else {
			newAddFilters[newAddFilters.length - 3] = `<${minContract / 1000}`;
		}

		setAddFilters(newAddFilters);

		// This is a hack to make the addFilters passed to DataTable only happen once, otherwise it will keep getting
		// applied every refresh (like when playing games) even if the user had disabled or edited the filter. Really, it'd
		// be better if sent as some kind of signal or event rather than as a prop, because it is transient.
		setTimeout(() => {
			setAddFilters();
		}, 0);
	}, [capSpace, minContract, stats]);

	setTitleBar({ title: "Free Agents" });

	if (phase >= PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.RESIGN_PLAYERS) {
		return (
			<div>
				<h1>
					Free Agents <NewWindowLink />
				</h1>
				<p>
					More:{" "}
					<a href={helpers.leagueUrl(["upcoming_free_agents"])}>
						Upcoming Free Agents
					</a>
				</p>
				<p>You're not allowed to sign free agents now.</p>
				<p>
					Free agents can only be signed before the playoffs or after players
					are re-signed.
				</p>
			</div>
		);
	}

	const cols = getCols(
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
		"Asking For",
		"Mood",
		"Negotiate",
	);

	const rows = players.map(p => {
		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				p.age,
				p.ratings.ovr,
				p.ratings.pot,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
				<>
					{helpers.formatCurrency(p.contract.amount, "M")} thru {p.contract.exp}
				</>,
				<div
					title={p.mood.text}
					style={{
						width: "100%",
						height: "21px",
						backgroundColor: p.mood.color,
					}}
				>
					<span style={{ display: "none" }}>{p.freeAgentMood[userTid]}</span>
				</div>,
				<NegotiateButtons
					capSpace={capSpace}
					disabled={gamesInProgress}
					minContract={minContract}
					p={p}
					playersRefuseToNegotiate={playersRefuseToNegotiate}
					userTid={userTid}
				/>,
			],
		};
	});

	return (
		<>
			<h1>
				Free Agents <NewWindowLink />
			</h1>
			{process.env.SPORT === "football" ? (
				<RosterComposition className="float-right mb-3" players={userPlayers} />
			) : null}

			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["upcoming_free_agents"])}>
					Upcoming Free Agents
				</a>
			</p>

			<RosterSalarySummary
				capSpace={capSpace}
				hardCap={hardCap}
				minContract={minContract}
				numRosterSpots={numRosterSpots}
			/>

			<p>
				<button
					className="btn btn-light-bordered"
					onClick={showAfforablePlayers}
				>
					Show players you can afford now
				</button>
			</p>

			{gamesInProgress ? (
				<p className="text-danger">Stop game simulation to sign free agents.</p>
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
	gamesInProgress: PropTypes.bool.isRequired,
	hardCap: PropTypes.bool.isRequired,
	minContract: PropTypes.number.isRequired,
	numRosterSpots: PropTypes.number.isRequired,
	phase: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	playersRefuseToNegotiate: PropTypes.bool.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userPlayers: PropTypes.arrayOf(
		PropTypes.shape({
			ratings: PropTypes.shape({
				pos: PropTypes.string,
			}),
		}),
	).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default FreeAgents;
