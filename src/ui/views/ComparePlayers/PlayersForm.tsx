import { useEffect, useMemo, useState } from "react";
import type { View } from "../../../common/types";
import { groupByUnique, range } from "../../../common/utils";
import SelectMultiple from "../../components/SelectMultiple";

const PlayersForm = ({
	initialAvailablePlayers,
	players,
	onSubmit,
}: Pick<View<"comparePlayers">, "initialAvailablePlayers" | "players"> & {
	onSubmit: (
		playerInfos: {
			pid: number;
			season: number | "career";
		}[],
	) => void;
}) => {
	const [allPlayersState, setAllPlayersState] = useState<
		"init" | "loading" | "done"
	>("init");
	const [allPlayers, setAllPlayers] = useState<
		| { pid: number; name: string; firstSeason: number; lastSeason: number }[]
		| undefined
	>();
	const availablePlayers = allPlayers ?? initialAvailablePlayers;

	const [currentPlayers, setCurrentPlayers] = useState(
		players.map(info => {
			return {
				pid: info.p.pid,
				season: info.season,
			};
		}),
	);

	// Synchronize with new state after submitting form, in case something changed on backend in validation or something
	useEffect(() => {
		setCurrentPlayers(
			players.map(info => {
				return {
					pid: info.p.pid,
					season: info.season,
				};
			}),
		);
	}, [players]);

	const playersByPid = useMemo(
		() => groupByUnique(availablePlayers, "pid"),
		[availablePlayers],
	);

	return (
		<form
			onSubmit={event => {
				event.preventDefault();
				onSubmit(currentPlayers);
			}}
		>
			{currentPlayers.map(({ pid, season }, i) => {
				const p = playersByPid[pid];
				return (
					<div className="d-flex mb-3" style={{ maxWidth: 500 }} key={i}>
						<div className="me-3 flex-grow-1">
							<SelectMultiple
								value={playersByPid[pid]}
								options={availablePlayers}
								onChange={p => {
									if (!p) {
										return;
									}

									const newPid = p.pid;
									let newSeason;
									if (season === "career") {
										newSeason = "career";
									} else if (season < p.firstSeason || season > p.lastSeason) {
										newSeason = p.firstSeason;
									} else {
										newSeason = season;
									}

									setCurrentPlayers(players => {
										const newPlayers = [...players];

										newPlayers[i] = {
											...newPlayers[i],
											pid: newPid,
											season: newSeason,
										};

										return newPlayers;
									});
								}}
								getOptionLabel={p => p.name}
								getOptionValue={p => String(p.pid)}
								loading={allPlayersState === "loading"}
								isClearable={false}
							/>
						</div>
						<div className="me-2 flex-shrink-0">
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
								value={season}
							>
								<option value="career">Career</option>
								{range(p.firstSeason, p.lastSeason + 1).map(season => {
									return (
										<option key={season} value={season}>
											{season}
										</option>
									);
								})}
							</select>
						</div>
					</div>
				);
			})}

			<button className="btn btn-primary mb-3" type="submit">
				Update players
			</button>
		</form>
	);
};

export default PlayersForm;
