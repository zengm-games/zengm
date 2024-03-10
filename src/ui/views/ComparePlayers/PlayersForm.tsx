import { useEffect, useState } from "react";
import type { View } from "../../../common/types";
import { range } from "../../../common/utils";
import SelectMultiple from "../../components/SelectMultiple";
import { ActionButton, HelpPopover } from "../../components";
import { toWorker } from "../../util";
import {
	formatName,
	type PlayerInfoForName,
} from "../CustomizePlayer/RelativesForm";

const PlayersForm = ({
	initialAvailablePlayers,
	players,
	onSubmit,
}: Pick<View<"comparePlayers">, "initialAvailablePlayers" | "players"> & {
	onSubmit: (
		playerInfos: {
			season: number | "career";
			p: PlayerInfoForName;
		}[],
	) => void;
}) => {
	const [allPlayersState, setAllPlayersState] = useState<
		"init" | "loading" | "done"
	>("init");
	const [allPlayers, setAllPlayers] = useState<
		PlayerInfoForName[] | undefined
	>();
	const availablePlayers = allPlayers ?? initialAvailablePlayers;

	const [currentPlayers, setCurrentPlayers] = useState<
		{
			season: number | "career";
			p: PlayerInfoForName;
		}[]
	>(
		players.map(info => {
			return {
				season: info.season,
				p: {
					pid: info.p.pid,
					firstName: info.p.firstName,
					lastName: info.p.lastName,
					firstSeason: info.firstSeason,
					lastSeason: info.lastSeason,
				},
			};
		}),
	);

	// Synchronize with new state after submitting form, in case something changed on backend in validation or something
	useEffect(() => {
		setCurrentPlayers(
			players.map(info => {
				return {
					season: info.season,
					p: {
						pid: info.p.pid,
						firstName: info.p.firstName,
						lastName: info.p.lastName,
						firstSeason: info.firstSeason,
						lastSeason: info.lastSeason,
					},
				};
			}),
		);
	}, [players]);

	return (
		<form
			onSubmit={event => {
				event.preventDefault();
				onSubmit(currentPlayers);
			}}
		>
			{currentPlayers.map((playerInfo, i) => {
				return (
					<div className="d-flex mb-3" style={{ maxWidth: 500 }} key={i}>
						<div className="me-3 flex-grow-1">
							<SelectMultiple
								value={playerInfo.p}
								options={availablePlayers}
								onChange={p => {
									if (!p) {
										return;
									}

									let newSeason;
									if (playerInfo.season === "career") {
										newSeason = "career" as const;
									} else if (
										playerInfo.season < p.firstSeason ||
										playerInfo.season > p.lastSeason
									) {
										newSeason = p.firstSeason;
									} else {
										newSeason = playerInfo.season;
									}

									setCurrentPlayers(players => {
										const newPlayers = [...players];

										newPlayers[i] = {
											...newPlayers[i],
											season: newSeason,
											p: {
												...p,
											},
										};

										return newPlayers;
									});
								}}
								getOptionLabel={p => formatName(p)}
								getOptionValue={p => String(p.pid)}
								loading={allPlayersState === "loading"}
								isClearable={false}
							/>
						</div>
						<div className="me-3 flex-shrink-0">
							<select
								className="form-select"
								onChange={event => {
									const newSeason =
										event.target.value === "career"
											? ("career" as const)
											: parseInt(event.target.value);

									setCurrentPlayers(players => {
										const newPlayers = [...players];
										newPlayers[i] = {
											...newPlayers[i],
											season: newSeason,
										};

										return newPlayers;
									});
								}}
								value={playerInfo.season}
							>
								<option value="career">Career</option>
								{range(
									playerInfo.p.firstSeason,
									playerInfo.p.lastSeason + 1,
								).map(season => {
									return (
										<option key={season} value={season}>
											{season}
										</option>
									);
								})}
							</select>
						</div>
						<div className="flex-shrink-0" style={{ fontSize: 20 }}>
							<button
								className="text-danger btn btn-link p-0 border-0"
								onClick={() => {
									setCurrentPlayers(players => {
										return players.filter((p, j) => j !== i);
									});
								}}
								title="Delete"
								style={{ fontSize: 20 }}
								type="button"
								disabled={currentPlayers.length <= 2}
							>
								<span className="glyphicon glyphicon-remove" />
							</button>
						</div>
					</div>
				);
			})}

			<div className="d-flex align-items-center mb-3">
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						setCurrentPlayers(players => {
							// First player not previously selected
							const p = availablePlayers.find(
								p => !players.some(p2 => p2.p.pid === p.pid),
							);
							if (!p) {
								return players;
							}

							const prevSeason = players.at(-1)?.season;
							let newSeason: number | "career";
							if (prevSeason === "career") {
								newSeason = "career";
							} else if (
								prevSeason === undefined ||
								prevSeason < p.firstSeason ||
								prevSeason > p.lastSeason
							) {
								newSeason = p.firstSeason;
							} else {
								newSeason = prevSeason;
							}

							return [
								...players,
								{
									season: newSeason,
									p: {
										...p,
									},
								},
							];
						});
					}}
				>
					Add
				</button>
				<ActionButton
					className="ms-3 me-2"
					processing={allPlayersState === "loading"}
					disabled={allPlayersState === "done"}
					onClick={async () => {
						setAllPlayersState("loading");
						try {
							const newPlayers = await toWorker(
								"main",
								"loadRetiredPlayers",
								undefined,
							);
							setAllPlayers(newPlayers);
							setAllPlayersState("done");
						} catch (error) {
							setAllPlayersState("init");
							throw error;
						}
					}}
					type="button"
					variant="secondary"
				>
					{allPlayersState === "done" ? "Done!" : "Load retired players"}
				</ActionButton>
				<HelpPopover title="Load retired players">
					<p>
						By default, only active players are shown here. This is for
						performance reasons, to handle leagues where people have played many
						seasons.
					</p>
					<p>
						If you press the "Load retired players" button and wait for it to
						load, then retired players will be available to select as well.
					</p>
				</HelpPopover>
			</div>

			<button className="btn btn-primary mb-3" type="submit">
				Update players
			</button>
		</form>
	);
};

export default PlayersForm;