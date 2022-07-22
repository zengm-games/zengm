import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import Overall from "./Overall";
import Players from "./Players";
import RetiredJerseyNumbers from "./RetiredJerseyNumbers";
import Seasons from "./Seasons";
import { MoreLinks } from "../../components";
import hideableSectionFactory from "../../components/hideableSectionFactory";

const TeamHistory = ({
	abbrev,
	bestRecord,
	championships,
	finalsAppearances,
	godMode,
	history,
	players,
	playoffAppearances,
	retiredJerseyNumbers,
	season,
	stats,
	tid,
	totalLost,
	totalOtl,
	totalTied,
	totalWinp,
	totalWon,
	userTid,
	worstRecord,
}: View<"teamHistory">) => {
	useTitleBar({
		title: "Team History",
		dropdownView: "team_history",
		dropdownFields: { teams: abbrev },
	});

	const HideableSection = hideableSectionFactory("TeamHistory");

	return (
		<>
			<MoreLinks type="team" page="team_history" abbrev={abbrev} tid={tid} />

			<div className="row">
				<div className="col-sm-5 col-md-3">
					<HideableSection title="Overall">
						<Overall
							bestRecord={bestRecord}
							championships={championships}
							finalsAppearances={finalsAppearances}
							playoffAppearances={playoffAppearances}
							totalLost={totalLost}
							totalOtl={totalOtl}
							totalTied={totalTied}
							totalWinp={totalWinp}
							totalWon={totalWon}
							worstRecord={worstRecord}
						/>
					</HideableSection>

					<HideableSection title="Seasons" className="mt-3">
						<Seasons history={history} />
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
					<HideableSection title="Players">
						<Players
							godMode={godMode}
							season={season}
							players={players}
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
