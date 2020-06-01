import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";
import type { View } from "../../../common/types";

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
	const numberToDisplay =
		process.env.SPORT === "basketball"
			? helpers.roundStat(value, stat)
			: helpers.numberWithCommas(value);

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

Leader.propTypes = {
	abbrev: PropTypes.string,
	name: PropTypes.string.isRequired,
	pid: PropTypes.number.isRequired,
	stat: PropTypes.string.isRequired,
	tid: PropTypes.number,
	value: PropTypes.number.isRequired,
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

Leaders.propTypes = {
	leagueLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
	teamLeaders: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Leaders;
