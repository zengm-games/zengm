import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../../ui/util";

const Player = ({
	i,
	p,
	season,
	userTid,
}: {
	i: number;
	p: any;
	season: number;
	userTid: number;
}) => {
	if (!p) {
		return <div />;
	}

	let pos = p.pos;
	if (i === 24) {
		pos = "KR";
	} else if (i === 25) {
		pos = "PR";
	}

	// The wrapper div here actually matters, don't change to fragment!
	return (
		<div>
			<span className={p.tid === userTid ? "table-info" : undefined}>
				{pos} <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}>
					{p.abbrev}
				</a>
				)
			</span>
		</div>
	);
};

Player.propTypes = {
	i: PropTypes.number.isRequired,
	p: PropTypes.object,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

const Teams = ({
	className,
	name,
	season,
	team,
	userTid,
}: {
	className?: string;
	name: string;
	season: number;
	team: any[];
	userTid: number;
}) => {
	return (
		<div className={className}>
			<h2>{name}</h2>
			{team.map((p, i) => (
				<Player key={i} i={i} p={p} season={season} userTid={userTid} />
			))}
		</div>
	);
};

Teams.propTypes = {
	className: PropTypes.string,
	name: PropTypes.string,
	nested: PropTypes.bool,
	team: PropTypes.array.isRequired,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default Teams;
