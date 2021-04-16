import PropTypes from "prop-types";
import { MoreLinks, RetiredPlayers } from "../../../ui/components";
import useTitleBar from "../../../ui/hooks/useTitleBar";
import AwardsAndChamp from "./AwardsAndChamp";
import Team from "./Team";
import type { View } from "../../../common/types";
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

	const {
		awards,
		champ,
		confs,
		retiredPlayers,
		userTid,
	} = props as ActualProps;

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
						name="All-League Teams"
						nested
						season={season}
						team={awards.allLeague}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-3 col-sm-4 col-6">
					<Team
						className="mb-3"
						name="All-Defensive Teams"
						nested
						season={season}
						team={awards.allDefensive}
						userTid={userTid}
					/>
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

History.propTypes = {
	awards: PropTypes.object,
	champ: PropTypes.object,
	confs: PropTypes.arrayOf(PropTypes.object),
	invalidSeason: PropTypes.bool.isRequired,
	retiredPlayers: PropTypes.arrayOf(PropTypes.object),
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number,
};

export default History;
