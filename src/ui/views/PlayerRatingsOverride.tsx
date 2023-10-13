import type { Player, PlayerHistoricRatings, View } from "src/common/types";
import SelectMultiple from "../components/SelectMultiple";
import { DataTable } from "../components";
import { getCols, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import { useState } from "react";
import type { DataTableRow } from "../components/DataTable";
import useTitleBar from "../hooks/useTitleBar";

type InputRow = {
	season?: number;
	pid: number;
	ratings: {
		rating: number;
		name: string;
	}[];
};

const getInputRow = (ratings: any[], pid: number, player: Player): InputRow => {
	const playerRatings = player.ratings[player.ratings.length - 1];
	let row = {
		pid: pid,
		ratings: ratings.map(rating => {
			return {
				rating: playerRatings[rating],
				name: rating,
			};
		}),
	};

	return row;
};

const deletePlayerRatings = async (r: PlayerHistoricRatings) => {
	toWorker("main", "deletePlayerHistoricRating", r.phrid);
	realtimeUpdate();
};

const getHistoricRatingsColumns = (
	playerHistoricRatings: PlayerHistoricRatings[],
	cols: any[],
) => {
	return playerHistoricRatings.map((r, i) => {
		return {
			key: i,
			data: [
				{
					value: r.season,
				},
				...cols.map(rating => r.playerRatings[rating]),
				{
					value: (
						<>
							<button
								className="btn btn-light-bordered btn-xs"
								onClick={() => deletePlayerRatings(r)}
							>
								Delete
							</button>
						</>
					),
				},
			],
		};
	});
};

const PlayerRatingsOverride = ({
	players,
	player,
	playerHistoricRatings,
	cols,
	godMode,
}: View<"playerRatingsOverride">) => {
	useTitleBar({
		title: "Player Ratings Override",
		jumpTo: true,
	});

	const savePlayerRatingsOverride = async () => {
		try {
			if (
				playerHistoricRatings.filter(phr => phr.season == newRatings.season)
					.length > 0
			) {
				console.log("yoo");
				logEvent({
					type: "error",
					text: "You cannot have two overrides in the same season. Please delete the previous one",
					saveToDb: false,
				});
				return;
			}
			console.log("save");
			await toWorker("main", "updatePlayerRatingsOverride", newRatings);
			realtimeUpdate();
		} catch (error) {
			console.log(error);
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
		}
	};

	const getInputRowColumns = (inputRow: InputRow): DataTableRow[] => {
		return [
			{
				key: 0,
				data: [
					{
						value: (
							<>
								<input
									type="text"
									onChange={event => handleAttributeChange(-1, event)}
									value={inputRow.season}
									className="form-control"
									disabled={!godMode}
								/>
							</>
						),
					},
					...inputRow.ratings.map((r, i) => {
						return {
							value: (
								<>
									<input
										onChange={event => {
											handleAttributeChange(i, event);
										}}
										value={r.rating}
										type="text"
										className="form-control"
										disabled={!godMode}
									/>
								</>
							),
						};
					}),
					{
						value: (
							<>
								<button
									className="btn btn-light-bordered btn-xs"
									onClick={savePlayerRatingsOverride}
								>
									Save
								</button>
							</>
						),
					},
				],
			},
		];
	};

	const handleAttributeChange = (index: number, event: any) => {
		const oldRatings = { ...newRatings };
		if (index == -1) {
			setNewRatings({
				...oldRatings,
				season: event.target.value,
			});
			return;
		}
		let newRatingsModified = oldRatings.ratings;
		console.log(event);
		newRatingsModified[index] = {
			rating: event.target.value,
			name: newRatingsModified[index].name,
		};
		setNewRatings({
			...oldRatings,
			ratings: newRatingsModified,
		});
	};

	const handleChange = (p: Player | null) => {
		console.log("wowo");
		if (p != undefined) {
			setPlayer(p);
			setNewRatings(getInputRow(cols, p.pid, p));
			const url = helpers.leagueUrl(["player_ratings_override", p?.pid ?? ""]);
			console.log("wow");
			updateUrl(url);
		}
	};

	const updateUrl = async (url: string) => {
		await realtimeUpdate([], url, undefined, true);
	};

	console.log("newReload");

	const [playerSelected, setPlayer] = useState(player);
	console.log(player.pid, playerSelected.pid);
	const inputRow = getInputRow(cols, playerSelected.pid, player);
	const [newRatings, setNewRatings] = useState(inputRow);
	console.log(newRatings);
	return (
		<div>
			<div className="col-lg-4 col-md-6 mb-3">
				<SelectMultiple
					options={players}
					value={playerSelected}
					getOptionLabel={p => p.lastName + " " + p.firstName}
					getOptionValue={(p: Player) => String(p.pid)}
					onChange={(event: Player | null) => handleChange(event)}
				/>
			</div>

			<div>
				<DataTable
					cols={[
						...getCols(["Year", ...cols.map(rating => `rating:${rating}`)]),
						{ title: "Save" },
					]}
					defaultSort={[0, "asc"]}
					defaultStickyCols={0}
					clickable={false}
					hideAllControls
					name="Player:Ratings"
					rows={[
						...getHistoricRatingsColumns(playerHistoricRatings, cols),
						...getInputRowColumns(newRatings),
					]}
				></DataTable>
			</div>
		</div>
	);
};

export default PlayerRatingsOverride;
