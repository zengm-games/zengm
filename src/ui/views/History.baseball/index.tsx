import { MoreLinks, RetiredPlayers } from "../../../ui/components";
import useTitleBar from "../../../ui/hooks/useTitleBar";
import AwardsAndChamp from "./AwardsAndChamp";
import Team from "./Team";
import type { View } from "../../../common/types";
import { AWARD_NAMES } from "../../../common";
export type ActualProps = Exclude<
	View<"history">,
	{ invalidSeason: true; season: number }
>;

const History = (props: View<"history">) => {
	const { invalidSeason, season } = props;

	useTitleBar({
		title: "Season Summary",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "history",
		dropdownFields: {
			seasonsHistory: season,
		},
	});

	if (invalidSeason) {
		return (
			<>
				<h2>Error</h2>
				<p>Invalid season.</p>
			</>
		);
	}

	const { awards, champ, confs, retiredPlayers, userTid } =
		props as ActualProps;

	return (
		<>
			<MoreLinks type="awards" page="history" season={season} />

			<div className="row">
				<div className="col-md-3 col-sm-4 col-12">
					<AwardsAndChamp
						awards={awards}
						champ={champ}
						confs={confs}
						season={season}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-3 col-sm-4 col-6">
					<Team
						className="mb-3"
						name={AWARD_NAMES.allOffense}
						season={season}
						team={awards.allOffense}
						userTid={userTid}
					/>
					<Team
						className="mb-3"
						name={AWARD_NAMES.allDefense}
						season={season}
						team={awards.allDefense}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-3 col-sm-4 col-6">
					<Team
						className="mb-3"
						name="All-Rookie Team"
						season={season}
						team={awards.allRookie}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-3 col-sm-12">
					<RetiredPlayers
						retiredPlayers={retiredPlayers}
						season={season}
						userTid={userTid}
					/>
				</div>
			</div>
		</>
	);
};

export default History;
