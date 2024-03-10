import { useEffect, useMemo, useState } from "react";
import type { View } from "../../../common/types";
import { groupByUnique } from "../../../common/utils";
import SelectMultiple from "../../components/SelectMultiple";

const PlayersForm = ({
	initialAvailablePlayers,
	players,
}: Pick<View<"comparePlayers">, "initialAvailablePlayers" | "players">) => {
	const [allPlayersState, setAllPlayersState] = useState<
		"init" | "loading" | "done"
	>("init");
	const [allPlayers, setAllPlayers] = useState<
		{ pid: number; name: string }[] | undefined
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
			}}
		>
			{currentPlayers.map(({ pid, season }, i) => {
				const p = playersByPid[pid];
				return (
					<div className="d-flex mb-2">
						<SelectMultiple
							value={playersByPid[pid]}
							options={availablePlayers}
							onChange={p => {
								setCurrentPlayers(players => {
									const newPlayers = [...players];
									newPlayers[i] = {
										...newPlayers[i],
										pid: p!.pid,
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
				);
			})}

			<button className="btn btn-primary" type="submit">
				Update players
			</button>
		</form>
	);
};

export default PlayersForm;
