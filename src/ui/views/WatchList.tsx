import PropTypes from "prop-types";
import { useCallback, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { PLAYER } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers, toWorker } from "../util";
import { DataTable, PlayerNameLabels, WatchBlock } from "../components";
import type { View } from "../../common/types";
import { wrappedAgeAtDeath } from "../components/AgeAtDeath";

const WatchList = ({
	challengeNoRatings,
	flagNote,
	players,
	playoffs,
	statType,
	stats,
}: View<"watchList">) => {
	const [clearing, setClearing] = useState(false);

	const clearWatchList = useCallback(async () => {
		setClearing(true);
		await toWorker("main", "clearWatchList");
		setClearing(false);
	}, []);

	useTitleBar({
		title: "Watch List",
		dropdownView: "watch_list",
		dropdownFields: { statTypes: statType, playoffs, flagNote },
	});

	const cols = getCols(
		[
			"",
			"Name",
			"Pos",
			"Age",
			"Team",
			"Ovr",
			"Pot",
			"Contract",
			"Exp",
			...stats.map(stat => `stat:${stat}`),
			"Note",
		],
		{
			Note: {
				width: "100%",
			},
		},
	);

	const rows = players.map(p => {
		let contract;
		let exp = null;
		if (p.tid === PLAYER.RETIRED) {
			contract = "Retired";
		} else if (p.tid === PLAYER.UNDRAFTED) {
			contract = `${p.draft.year} Draft Prospect`;
		} else {
			contract = helpers.formatCurrency(p.contract.amount, "M");
			exp = p.contract.exp;
		}

		const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

		return {
			key: p.pid,
			data: [
				<WatchBlock pid={p.pid} watch={p.watch} />,
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.name}
				</PlayerNameLabels>,
				p.ratings.pos,
				wrappedAgeAtDeath(p.age, p.ageAtDeath),
				<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
					{p.abbrev}
				</a>,
				showRatings ? p.ratings.ovr : null,
				showRatings ? p.ratings.pot : null,
				contract,
				exp,
				...stats.map(stat =>
					helpers.roundStat(p.stats[stat], stat, statType === "totals"),
				),
				{
					value: (
						<div
							className="overflow-auto"
							style={{
								maxHeight: 300,
								whiteSpace: "pre-line",
							}}
						>
							{p.note}
						</div>
					),
					searchValue: p.note,
					sortValue: p.note,
				},
			],
		};
	});

	return (
		<>
			<Dropdown className="float-right my-1">
				<Dropdown.Toggle
					id="watch-list-other-reports"
					className="btn-light-bordered"
				>
					Other Reports
				</Dropdown.Toggle>
				<Dropdown.Menu>
					<Dropdown.Item href={helpers.leagueUrl(["player_stats", "watch"])}>
						Player Stats
					</Dropdown.Item>
					<Dropdown.Item href={helpers.leagueUrl(["player_ratings", "watch"])}>
						Player Ratings
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>

			<p>
				Click the watch icon <span className="glyphicon glyphicon-flag" /> to
				add or remove a player from this list.
			</p>
			<p>
				On other pages, you can find the watch icon by clicking the info button{" "}
				<span className="glyphicon glyphicon-stats" /> next to a player's name.
			</p>
			<p>You can edit a player's note near the top of his profile page.</p>

			<button
				className="btn btn-danger mb-3"
				disabled={clearing}
				onClick={clearWatchList}
			>
				Clear Watch List
			</button>

			<DataTable
				cols={cols}
				defaultSort={[5, "desc"]}
				name="WatchList"
				pagination
				rows={rows}
			/>
		</>
	);
};

WatchList.propTypes = {
	players: PropTypes.arrayOf(PropTypes.object).isRequired,
	playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
	statType: PropTypes.oneOf(["per36", "perGame", "totals"]).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default WatchList;
