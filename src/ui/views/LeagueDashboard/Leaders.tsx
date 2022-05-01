import { helpers } from "../../util";
import type { View } from "../../../common/types";
import { bySport } from "../../../common";
import { PlayerNameLabels } from "../../components";

const Leader = ({
	abbrev,
	firstName,
	firstNameShort,
	lastName,
	pid,
	stat,
	tid,
	value,
}: {
	abbrev?: string;
	firstName: string;
	firstNameShort: string;
	lastName: string;
	pid: number;
	stat: string;
	tid?: number;
	value: number;
}) => {
	const numberToDisplay = bySport({
		baseball: helpers.numberWithCommas(value),
		basketball: helpers.roundStat(value, stat),
		football: helpers.numberWithCommas(value),
		hockey: helpers.numberWithCommas(value),
	});

	return (
		<>
			<PlayerNameLabels
				pid={pid}
				firstName={firstName}
				firstNameShort={firstNameShort}
				lastName={lastName}
			/>
			{abbrev && tid !== undefined ? (
				<>
					{" "}
					<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`])}>
						{abbrev}
					</a>
				</>
			) : null}{" "}
			{numberToDisplay} {stat}
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
