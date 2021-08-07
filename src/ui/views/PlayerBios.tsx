import PropTypes from "prop-types";
import { CountryFlag, DataTable, PlayerNameLabels } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { PLAYER } from "../../common";
import { dataTableWrappedMood } from "../components/Mood";
import { wrappedHeight } from "../components/Height";
import { wrappedWeight } from "../components/Weight";

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

	const cols = getCols([
		"Name",
		"Pos",
		"stat:jerseyNumber",
		"Team",
		"Age",
		"Height",
		"Weight",
		"Mood",
		"Contract",
		"Exp",
		"Country",
		"College",
		"Draft Year",
		"Pick",
		"Experience",
		"Ovr",
		"Pot",
		...stats.map(stat => `stat:${stat}`),
	]);

	const rows = players.map(p => {
		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;
		const college = p.college && p.college !== "" ? p.college : "None";

		return {
			key: p.pid,
			data: [
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					season={season}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				<a
					href={helpers.leagueUrl([
						"frivolities",
						"most",
						"jersey_number",
						p.stats.jerseyNumber,
					])}
				>
					{p.stats.jerseyNumber}
				</a>,
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
				wrappedHeight(p.hgt),
				wrappedWeight(p.weight),
				dataTableWrappedMood({
					defaultType:
						p.tid === PLAYER.FREE_AGENT || p.tid === PLAYER.UNDRAFTED
							? "user"
							: "current",
					maxWidth: true,
					p,
				}),
				p.contract.amount > 0
					? helpers.formatCurrency(p.contract.amount, "M")
					: null,
				p.contract.amount > 0 && season === currentSeason
					? p.contract.exp
					: null,
				{
					value: (
						<>
							<a
								href={helpers.leagueUrl([
									"frivolities",
									"most",
									"country",
									window.encodeURIComponent(helpers.getCountry(p.born.loc)),
								])}
							>
								<CountryFlag className="mr-1" country={p.born.loc} />
								{p.born.loc}
							</a>
						</>
					),
					sortValue: p.born.loc,
					searchValue: p.born.loc,
				},
				<a
					href={helpers.leagueUrl([
						"frivolities",
						"most",
						"college",
						window.encodeURIComponent(college),
					])}
				>
					{college}
				</a>,
				p.draft.year,
				p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null,
				p.experience,
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
