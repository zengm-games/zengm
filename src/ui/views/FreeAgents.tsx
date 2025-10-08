import { useRef } from "react";
import { PHASE, PHASE_TEXT } from "../../common/index.ts";
import {
	DataTable,
	MoreLinks,
	NegotiateButtons,
	RosterComposition,
	RosterSalarySummary,
} from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, useLocalPartial } from "../util/index.ts";
import type { Phase, View } from "../../common/types.ts";
import { dataTableWrappedMood } from "../components/Mood.tsx";
import {
	wrappedContractAmount,
	wrappedContractExp,
} from "../components/contract.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import { range } from "../../common/utils.ts";
import type { DropdownOption } from "../hooks/useDropdownOptions.tsx";
import type { FreeAgentTransaction } from "../../worker/views/freeAgents.ts";
import {
	type DataTableHandle,
	type DataTableRow,
} from "../components/DataTable/index.tsx";

const useSeasonsFreeAgents = () => {
	const { phase, season, startingSeason } = useLocalPartial([
		"phase",
		"season",
		"startingSeason",
	]);

	// Decrease season by 1, since "free agent season" starts in the previous calendar year
	const minFreeAgencySeason = startingSeason - 1;

	// These are 1 lower than you'd expect, because there's also a "current" entry added below
	const maxFreeAgencySeason = phase >= PHASE.PLAYOFFS ? season - 1 : season - 2;

	const options: DropdownOption[] = range(
		minFreeAgencySeason,
		maxFreeAgencySeason + 1,
	).map((freeAgencySeason) => {
		let value;
		if (freeAgencySeason >= -10 && freeAgencySeason < 10) {
			value = `${freeAgencySeason}-${freeAgencySeason + 1}`;
		} else {
			value = `${freeAgencySeason}-${String((freeAgencySeason + 1) % 100).padStart(2)}`;
		}

		return {
			key: freeAgencySeason,
			value,
		};
	});

	options.push({
		key: "current",
		value: "Current",
	});

	options.reverse();

	return options;
};

const signedFreeAgentWrapped = (
	freeAgentTransaction: FreeAgentTransaction & {
		abbrev: string;
	},
	freeAgencySeason: number,
	season: number | "current",
	phase: Phase,
) => {
	let rosterSeason;

	if (season === "current" && phase >= PHASE.PLAYOFFS) {
		// Link to current season roster, because there is no next season roster
		rosterSeason = freeAgencySeason;
	} else {
		// Link to next season roster, because freeAgencySeason starts after the regular season ends
		rosterSeason = freeAgencySeason + 1;
	}

	return {
		value: (
			<>
				<a
					href={helpers.leagueUrl([
						"roster",
						`${freeAgentTransaction.abbrev}_${freeAgentTransaction.tid}`,
						rosterSeason,
					])}
				>
					{freeAgentTransaction.abbrev}
				</a>
				, {(PHASE_TEXT as any)[freeAgentTransaction.phase]}
			</>
		),
		searchValue: `${freeAgentTransaction.abbrev}, ${(PHASE_TEXT as any)[freeAgentTransaction.phase]}`,
	};
};

const FreeAgents = ({
	capSpace,
	challengeNoFreeAgents,
	challengeNoRatings,
	freeAgencySeason,
	luxuryPayroll,
	maxContract,
	minContract,
	numRosterSpots,
	spectator,
	payroll,
	phase,
	players,
	salaryCapType,
	season,
	stats,
	type,
	userPlayers,
}: View<"freeAgents">) => {
	const dataTableRef = useRef<DataTableHandle>(null);

	const seasonsFreeAgents = useSeasonsFreeAgents();

	useTitleBar({
		title: "Free Agents",
		dropdownView: "free_agents",
		dropdownFields: { typeFreeAgents: type, seasonsFreeAgents: season },
		dropdownCustomOptions: {
			seasonsFreeAgents,
		},
	});

	const { gameSimInProgress } = useLocalPartial(["gameSimInProgress"]);

	if (
		((phase > PHASE.AFTER_TRADE_DEADLINE && phase <= PHASE.RESIGN_PLAYERS) ||
			phase === PHASE.FANTASY_DRAFT ||
			phase === PHASE.EXPANSION_DRAFT) &&
		season === "current"
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

	const askingForText = "Asking For";
	const cols = getCols([
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		...stats.map((stat) => `stat:${stat}`),
		"Mood",
		askingForText,
		"Exp",
		"Negotiate",
	]);

	const toggleShowAfforablePlayers = () => {
		if (dataTableRef.current) {
			const enableFilters = dataTableRef.current.getEnableFilters();
			const askingForIndex = cols.findLastIndex(
				(col) => col.title === askingForText,
			);

			let askingForFilter;
			if (capSpace * 1000 > minContract && !challengeNoFreeAgents) {
				askingForFilter = `<${capSpace}`;
			} else {
				askingForFilter = `<${minContract / 1000}`;
			}

			// Start from either the current filters (if they are shown/enabled) or no filters at all
			const filters: string[] = enableFilters
				? [...dataTableRef.current.getFilters()]
				: new Array(cols.length).fill("");

			// If we currently have this exact filter set, delete it. Otherwise, add it
			if (filters[askingForIndex] === askingForFilter) {
				filters[askingForIndex] = "";
			} else {
				filters[askingForIndex] = askingForFilter;
			}

			dataTableRef.current.setFilters(filters);
		}
	};

	const playerInfoSeason =
		freeAgencySeason +
		(season === "current" && phase < PHASE.FREE_AGENCY ? 1 : 0);

	const rows: DataTableRow[] = players.map((p) => {
		return {
			key: p.pid,
			metadata: {
				type: "player",
				pid: p.pid,
				season: playerInfoSeason,
				playoffs: "regularSeason",
			},
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
					season: playerInfoSeason,
				}),
				p.ratings.pos,
				p.age,
				!challengeNoRatings ? p.ratings.ovr : null,
				!challengeNoRatings ? p.ratings.pot : null,
				...stats.map((stat) => helpers.roundStat(p.stats[stat], stat)),
				p.freeAgentType === "available"
					? dataTableWrappedMood({
							defaultType: "user",
							maxWidth: true,
							p,
						})
					: undefined,
				wrappedContractAmount(p, p.contract.amount),
				wrappedContractExp(p),
				p.freeAgentType === "available"
					? {
							value: (
								<NegotiateButtons
									canGoOverCap={salaryCapType === "none"}
									capSpace={capSpace}
									disabled={gameSimInProgress}
									minContract={minContract}
									spectator={spectator}
									p={p}
									willingToNegotiate={p.mood.user.willing}
								/>
							),
							searchValue: p.mood.user.willing ? "Negotiate Sign" : "Refuses!",
						}
					: signedFreeAgentWrapped(
							p.freeAgentTransaction,
							freeAgencySeason,
							season,
							phase,
						),
			],
		};
	});

	const showShowPlayersAffordButton = salaryCapType !== "none";

	return (
		<>
			{season === "current" ? (
				<RosterComposition className="float-end mb-3" players={userPlayers} />
			) : null}
			<MoreLinks type="freeAgents" page="free_agents" />
			{season === "current" ? (
				<>
					<RosterSalarySummary
						capSpace={capSpace}
						salaryCapType={salaryCapType}
						luxuryPayroll={luxuryPayroll}
						maxContract={maxContract}
						minContract={minContract}
						numRosterSpots={numRosterSpots}
						payroll={payroll}
					/>

					{showShowPlayersAffordButton ? (
						<button
							className="btn btn-secondary mb-3"
							onClick={toggleShowAfforablePlayers}
						>
							Show players you can afford now
						</button>
					) : null}
				</>
			) : null}

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
				defaultStickyCols={window.mobile ? 0 : 1}
				name="FreeAgents"
				pagination
				ref={dataTableRef}
				rows={rows}
			/>
		</>
	);
};

export default FreeAgents;
