import type { Player, PlayerHistoricRatings, View } from "src/common/types";
import SelectMultiple from "../components/SelectMultiple";
import { DataTable } from "../components";
import { getCols, helpers, logEvent, realtimeUpdate, toWorker } from "../util";
import { useState } from "react";
import type { DataTableRow } from "../components/DataTable";
import { g } from "src/worker/util";

const getPlayer = (player?: Player) => {
	if (player == undefined) {
		return;
	}
	return player;
};

type InputRow = {
	season?: number;
	pid: number;
	ratings: {
		rating: number;
		name: string;
	}[];
};

const getInputRow = (ratings: any[], pid: number): InputRow => {
	let row = {
		pid: pid,
		ratings: ratings.map(rating => {
			return {
				rating: 50,
				name: rating,
			};
		}),
	};

	return row;
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
	const savePlayerRatingsOverride = async () => {
		try {
			console.log("save");
			await toWorker("main", "updatePlayerRatingsOverride", newRatings);
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

	const handleChange = () => (p: any) => {
		console.log("wowo");
		setPlayer(p);
		const url = helpers.leagueUrl(["player_ratings_override", p.pid]);
		console.log("wow");
		realtimeUpdate([], url, undefined, true);
	};
	const [playerSelected, setPlayer] = useState(player);
	const inputRow = getInputRow(cols, playerSelected.pid);
	const [newRatings, setNewRatings] = useState(inputRow);
	console.log(newRatings);
	return (
		<div>
			<SelectMultiple
				options={players}
				value={playerSelected}
				getOptionLabel={p => p.lastName + " " + p.firstName}
				getOptionValue={(p: Player) => String(p.pid)}
				onChange={handleChange()}
			/>

			<DataTable
				cols={[
					...getCols(["Year", ...cols.map(rating => `rating:${rating}`)]),
					{ title: "Save" },
				]}
				defaultSort={[0, "asc"]}
				defaultStickyCols={2}
				clickable={false}
				hideAllControls
				name="Player:Ratings"
				rows={[
					...getHistoricRatingsColumns(playerHistoricRatings, cols),
					...getInputRowColumns(newRatings),
				]}
			></DataTable>
		</div>
	);
};

export default PlayerRatingsOverride;
