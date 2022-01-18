import { helpers } from "../../util";
import type { View } from "../../../common/types";

const TeamStat = ({
	name,
	rank,
	stat,
	value,
}: View<"leagueDashboard">["teamStats"][number]) => {
	return (
		<>
			{name}: {helpers.roundStat(value, stat)} ({helpers.ordinal(rank)})
			<br />
		</>
	);
};

const TeamStats = ({
	teamStats,
}: Pick<View<"leagueDashboard">, "teamStats">) => (
	<>
		<h2>Team Stats</h2>
		<p>
			{teamStats.map(teamStat => (
				<TeamStat key={teamStat.stat} {...teamStat} />
			))}
			<a href={helpers.leagueUrl(["team_stats"])}>» Team Stats</a>
		</p>
	</>
);

export default TeamStats;
