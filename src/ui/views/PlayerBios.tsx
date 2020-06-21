import PropTypes from "prop-types";
import React from "react";
import { DataTable, Height, PlayerNameLabels, Weight } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";

const PlayerBios = ({
	abbrev,
	currentSeason,
	challengeNoRatings,
	players,
	season,
	stats,
	userTid,
}: View<"playerBios">) => {
	useTitleBar({
		title: "Player Bios",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "player_bios",
		dropdownFields: { teamsAndAllWatch: abbrev, seasons: season },
	});

	const cols = getCols(
		"Name",
		"Pos",
		"Team",
		"Age",
		"Height",
		"Weight",
		"Contract",
		"Exp",
		"Country",
		"College",
		"Draft Year",
		"Pick",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
	);

	const rows = players.map(p => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					skills={p.ratings.skills}
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
				{
					// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
					// @ts-ignore
					value: <Height inches={p.hgt} />,
					sortValue: p.hgt,
				},
				{
					// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
					// @ts-ignore
					value: <Weight pounds={p.weight} />,
					sortValue: p.weight,
				},
				p.contract.amount > 0
					? helpers.formatCurrency(p.contract.amount, "M")
					: null,
				p.contract.amount > 0 && season === currentSeason
					? p.contract.exp
					: null,
				p.born.loc,
				p.college,
				p.draft.year,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null,
				showRatings ? p.ratings.ovr : null,
				showRatings ? p.ratings.pot : null,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat)),
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
				Players on your team are{" "}
				<span className="text-info">highlighted in blue</span>. Players in the
				Hall of Fame are <span className="text-danger">highlighted in red</span>
				.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="PlayerBios"
				pagination
				rows={rows}
			/>
		</>
	);
};

PlayerBios.propTypes = {
	abbrev: PropTypes.string.isRequired,
	currentSeason: PropTypes.number.isRequired,
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayerBios;
