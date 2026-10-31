import useTitleBar from "../../hooks/useTitleBar.tsx";
import type { View } from "../../../common/types.ts";
import Overall from "./Overall.tsx";
import Players from "./Players.tsx";
import RetiredJerseyNumbers from "./RetiredJerseyNumbers.tsx";
import Seasons from "./Seasons.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import HideableSection from "../../components/HideableSection.tsx";
import { useLocal } from "../../util/local.ts";
import { Championships } from "./Championships.tsx";
import useLocalStorageState from "use-local-storage-state";
import clsx from "clsx";

const TeamHistory = ({
	abbrev,
	bestRecord,
	championships,
	finalsAppearances,
	history,
	players,
	playoffAppearances,
	retiredJerseyNumbers,
	stats,
	tid,
	totalLost,
	totalOtl,
	totalTied,
	totalWinp,
	totalWon,
	userPlayers,
	userSeasons,
	userTotals,
	worstRecord,
}: View<"teamHistory">) => {
	useTitleBar({
		title: "Team History",
		dropdownView: "team_history",
		dropdownFields: { teams: abbrev },
	});
	const { godMode, season, userTid } = useLocal([
		"godMode",
		"season",
		"userTid",
	]);

	const [userOnlyState, setUserOnlyState] = useLocalStorageState(
		"teamHistoryUserOnly",
		{
			defaultValue: false,
		},
	);
	const userOnly = userTotals !== undefined && userOnlyState;

	const userSeasonsSet = new Set(userSeasons);
	const seasonsHistory = userOnly
		? history.filter((h) => userSeasonsSet.has(h.season))
		: history;

	return (
		<>
			<MoreLinks type="team" page="team_history" abbrev={abbrev} tid={tid} />

			<div className="row">
				<div className="col-sm-5 col-md-3">
					{userTotals ? (
						<div className="btn-group btn-group-sm mb-3">
							{[
								{ value: false, text: "All seasons" },
								{ value: true, text: "With you as GM" },
							].map(({ value, text }) => (
								<button
									key={text}
									type="button"
									className={clsx(
										"btn",
										userOnly === value
											? "btn-secondary"
											: "btn-outline-secondary",
									)}
									onClick={() => {
										setUserOnlyState(value);
									}}
								>
									{text}
								</button>
							))}
						</div>
					) : null}

					<HideableSection pageName="TeamHistory" title="Overall">
						{userTotals && userOnly ? (
							<Overall {...userTotals} />
						) : (
							<Overall
								bestRecord={bestRecord}
								championships={championships}
								finalsAppearances={finalsAppearances}
								numSeasons={history.length}
								playoffAppearances={playoffAppearances}
								totalLost={totalLost}
								totalOtl={totalOtl}
								totalTied={totalTied}
								totalWinp={totalWinp}
								totalWon={totalWon}
								worstRecord={worstRecord}
							/>
						)}
					</HideableSection>

					<HideableSection title="Seasons" className="mt-3">
						<Seasons
							history={seasonsHistory}
							// When filtered, every season would be marked, so no need to mark any
							userSeasons={userOnly ? [] : userSeasons}
						/>
					</HideableSection>
				</div>
				<div className="col-sm-7 col-md-9 mt-3 mt-sm-0">
					<RetiredJerseyNumbers
						godMode={godMode}
						players={players}
						retiredJerseyNumbers={retiredJerseyNumbers}
						season={season}
						tid={tid}
						userTid={userTid}
					/>
					<Championships history={seasonsHistory} />
					<HideableSection title="Players">
						<Players
							godMode={godMode}
							season={season}
							players={userOnly && userPlayers ? userPlayers : players}
							stats={stats}
							tid={tid}
							userTid={userTid}
						/>
					</HideableSection>
				</div>
			</div>
		</>
	);
};

export default TeamHistory;
