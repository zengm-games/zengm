import { useState } from "react";
import type { View } from "../../../common/types";
import SelectMultiple from "../../components/SelectMultiple";
import { toWorker } from "../../util";

const divStyle = {
	width: 300,
};

type AllStarPlayer = View<"allStarDraft">["allPossiblePlayers"][number];

const Player = ({
	allPossiblePlayers,
	index,
	onChange,
	p,
	selectedPIDs,
}: {
	allPossiblePlayers: AllStarPlayer[];
	index: number;
	onChange: (p: AllStarPlayer | null) => void;
	p: AllStarPlayer;
	selectedPIDs: number[];
}) => {
	return (
		<div style={divStyle}>
			<SelectMultiple
				options={allPossiblePlayers.filter(p => {
					// Keep this player and any other non-selected players
					const selectedIndex = selectedPIDs.indexOf(p.pid);
					return selectedIndex === index || selectedIndex < 0;
				})}
				value={allPossiblePlayers.find(p2 => p.pid === p2.pid)}
				getOptionLabel={p => `${p.name}, ${p.abbrev}`}
				getOptionValue={p => String(p.pid)}
				onChange={onChange}
				isClearable={false}
			/>
		</div>
	);
};

const EditAllStars = ({
	allPossiblePlayers,
	initialPlayers,
	onDone,
}: {
	allPossiblePlayers: AllStarPlayer[];
	initialPlayers: AllStarPlayer[];
	onDone: () => void;
}) => {
	console.log(allPossiblePlayers, initialPlayers);

	const [players, setPlayers] = useState([...initialPlayers]);

	const selectedPIDs = players.map(p => p.pid);

	const NUM_CAPTAINS = 2;

	const captains = players.slice(0, NUM_CAPTAINS);
	const others = players.slice(NUM_CAPTAINS);

	const onChange = (index: number) => (p: AllStarPlayer | null) => {
		if (p) {
			const newPlayers = [...players];
			newPlayers[index] = p;
			setPlayers(newPlayers);
		}
	};

	return (
		<form
			onSubmit={async event => {
				event.preventDefault();

				// Get rid of any other properties, like abbrev
				const minimalPlayers = players.map(p => ({
					pid: p.pid,
					tid: p.tid,
					name: p.name,
				}));

				// await toWorker("main", "contestSetPlayers", minimalPlayers);
				console.log("CALL TOWORKER", minimalPlayers);

				onDone();
			}}
		>
			<h2>Captains</h2>
			<div
				className="d-flex flex-wrap"
				style={{
					gap: "1rem",
				}}
			>
				{captains.map((p, i) => {
					const index = i;
					return (
						<Player
							key={i}
							allPossiblePlayers={allPossiblePlayers}
							index={index}
							onChange={onChange(index)}
							p={p}
							selectedPIDs={selectedPIDs}
						/>
					);
				})}
			</div>

			<h2 className="mt-4">Other All-Stars</h2>
			<div
				className="d-flex flex-wrap"
				style={{
					gap: "1rem",
				}}
			>
				{others.map((p, i) => {
					const index = i + NUM_CAPTAINS;
					return (
						<Player
							key={i}
							allPossiblePlayers={allPossiblePlayers}
							index={index}
							onChange={onChange(index)}
							p={p}
							selectedPIDs={selectedPIDs}
						/>
					);
				})}
			</div>

			<div className="mt-4">
				<button className="btn btn-primary" type="submit">
					Update All-Stars
				</button>

				<button className="btn btn-danger ml-2" type="button" onClick={onDone}>
					Cancel
				</button>
			</div>
		</form>
	);
};

export default EditAllStars;
