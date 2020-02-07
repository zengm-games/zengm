import PropTypes from "prop-types";
import React from "react";
import { DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { View } from "../../common/types";

const PlayerBios = ({
	abbrev,
	currentSeason,
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
		"Country",
		"College",
		"Draft Year",
		"Pick",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
	);

	const rows = players.map(p => {
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
				<a href={helpers.leagueUrl(["roster", p.stats.abbrev, season])}>
					{p.stats.abbrev}
				</a>,
				p.age,
				{
					value: `${Math.floor(p.hgt / 12)}'${p.hgt % 12}"`,
					sortValue: p.hgt,
				},
				p.weight,
				<>
					{p.contract.amount > 0
						? helpers.formatCurrency(p.contract.amount, "M")
						: ""}
					{p.contract.amount > 0 && season === currentSeason
						? ` thru ${p.contract.exp}`
						: ""}
				</>,
				p.born.loc,
				p.college,
				p.draft.year,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null,
				p.ratings.ovr,
				p.ratings.pot,
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
