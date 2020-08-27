import PropTypes from "prop-types";
import React from "react";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { POSITIONS, PLAYER } from "../../common";
import type { View } from "../../common/types";

const PlayerRatings = ({
	abbrev,
	challengeNoRatings,
	currentSeason,
	players,
	ratings,
	season,
	userTid,
}: View<"playerRatings">) => {
	useTitleBar({
		title: "Player Ratings",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_ratings",
		dropdownFields: { teamsAndAllWatch: abbrev, seasons: season },
	});

	const ovrsPotsColNames: string[] = [];
	if (process.env.SPORT === "football") {
		for (const pos of POSITIONS) {
			for (const type of ["ovr", "pot"]) {
				ovrsPotsColNames.push(`rating:${type}${pos}`);
			}
		}
	}

	const cols = getCols(
		"Name",
		"Pos",
		"Team",
		"Age",
		"Contract",
		"Exp",
		"Ovr",
		"Pot",
		...ratings.map(rating => `rating:${rating}`),
		...ovrsPotsColNames,
	);

	const rows = players.map(p => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		const ovrsPotsRatings: string[] = [];
		if (process.env.SPORT === "football") {
			for (const pos of POSITIONS) {
				for (const type of ["ovrs", "pots"]) {
					ovrsPotsRatings.push(showRatings ? p.ratings[type][pos] : null);
				}
			}
		}

		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					skills={p.ratings.skills}
					jerseyNumber={p.stats.jerseyNumber}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.stats.abbrev}_${p.stats.tid}`,
						season,
					])}
				>
					{p.stats.abbrev}
				</a>,
				p.age,
				p.contract.amount > 0
					? helpers.formatCurrency(p.contract.amount, "M")
					: null,
				p.contract.amount > 0 && season === currentSeason
					? p.contract.exp
					: null,
				showRatings ? p.ratings.ovr : null,
				showRatings ? p.ratings.pot : null,
				...ratings.map(rating => (showRatings ? p.ratings[rating] : null)),
				...ovrsPotsRatings,
			],
			classNames: {
				"table-danger": p.hof,
				"table-info": p.stats.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>
				More:{" "}
				<a href={helpers.leagueUrl(["player_rating_dists", season])}>
					Rating Distributions
				</a>
			</p>

			{challengeNoRatings ? (
				<p className="alert alert-danger d-inline-block">
					<b>Challenge Mode:</b> All player ratings are hidden, except for
					retired players.
				</p>
			) : null}

			<p>
				Players on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[6, "desc"]}
				name="PlayerRatings"
				pagination
				rows={rows}
			/>
		</>
	);
};

PlayerRatings.propTypes = {
	abbrev: PropTypes.string.isRequired,
	currentSeason: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	ratings: PropTypes.arrayOf(PropTypes.string).isRequired,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayerRatings;
