import { helpers } from "../../util";
import type { View } from "../../../common/types";
import { bySport } from "../../../common";

const Leader = ({
	abbrev,
	name,
	pid,
	stat,
	tid,
	value,
}: {
	abbrev?: string;
	name: string;
	pid: number;
	stat: string;
	tid?: number;
	value: number;
}) => {
	const numberToDisplay = bySport({
		basketball: helpers.roundStat(value, stat),
		football: helpers.numberWithCommas(value),
		hockey: helpers.numberWithCommas(value),
	});

	return (
		<>
			<a href={helpers.leagueUrl(["player", pid])}>{name}</a>
			{abbrev && tid !== undefined ? (
				<>
					,{" "}
					<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>
						{abbrev}
					</a>
				</>
			) : null}
			: {numberToDisplay} {stat}
			<br />
		</>
	);
};

const Leaders = ({
	leagueLeaders,
	teamLeaders,
}: Pick<View<"leagueDashboard">, "leagueLeaders" | "teamLeaders">) => (
	<>
		<h2>Team Leaders</h2>
		<p>
			{teamLeaders.map(leader => (
				<Leader key={leader.stat} {...leader} />
			))}
			<a href={helpers.leagueUrl(["roster"])}>» Full Roster</a>
		</p>
		<h2>League Leaders</h2>
		<p>
			{leagueLeaders.map(leader => (
				<Leader key={leader.stat} {...leader} />
			))}
			<a href={helpers.leagueUrl(["leaders"])}>» League Leaders</a>
			<br />
			<a href={helpers.leagueUrl(["player_stats"])}>» Player Stats</a>
		</p>
	</>
);

export default Leaders;
