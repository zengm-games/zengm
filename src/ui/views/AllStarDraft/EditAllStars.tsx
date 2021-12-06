import { useState } from "react";
import type { AllStarPlayer, View } from "../../../common/types";
import SelectMultiple from "../../components/SelectMultiple";
import { toWorker } from "../../util";

const divStyle = {
	width: 300,
};

type MyAllStarPlayer = View<"allStarDraft">["allPossiblePlayers"][number];

const Player = ({
	allPossiblePlayers,
	isClearable = false,
	onChange,
	p,
	selectedPIDs,
}: {
	allPossiblePlayers: MyAllStarPlayer[];
	isClearable?: boolean;
	onChange: (p: MyAllStarPlayer | null) => void;
	p: MyAllStarPlayer | null;
	selectedPIDs: number[];
}) => {
	return (
		<div style={divStyle}>
			<SelectMultiple
				options={allPossiblePlayers.filter(p2 => {
					// Keep this player and any other non-selected players
					const selectedIndex = selectedPIDs.indexOf(p2.pid);
					return p2.pid === p?.pid || selectedIndex < 0;
				})}
				value={
					p === null ? null : allPossiblePlayers.find(p2 => p.pid === p2.pid)
				}
				getOptionLabel={p => `${p.name}, ${p.abbrev}`}
				getOptionValue={p => String(p.pid)}
				onChange={onChange}
				isClearable={isClearable}
			/>
		</div>
	);
};

const EditAllStars = ({
	allPossiblePlayers,
	initialPlayers,
	onDone,
}: {
	allPossiblePlayers: MyAllStarPlayer[];
	initialPlayers: MyAllStarPlayer[];
	onDone: () => void;
}) => {
	console.log(allPossiblePlayers, initialPlayers);

	const [players, setPlayers] = useState([...initialPlayers]);

	const selectedPIDs = players.map(p => p?.pid);

	const NUM_CAPTAINS = 2;

	const captains = players.slice(0, NUM_CAPTAINS);
	const others = players.slice(NUM_CAPTAINS);

	const healthy = [];
	const injured = [];
	for (const p of others) {
		if (p === null || p.injury.gamesRemaining > 0) {
			injured.push(p);
		} else {
			healthy.push(p);
		}
	}

	const allPossibleHealthy: typeof allPossiblePlayers = [];
	const allPossibleInjured: typeof allPossiblePlayers = [];
	for (const p of allPossiblePlayers) {
		if (p.injury.gamesRemaining > 0) {
			allPossibleInjured.push(p);
		} else {
			allPossibleHealthy.push(p);
		}
	}

	const onChange =
		(prevPlayer: MyAllStarPlayer) => (p: MyAllStarPlayer | null) => {
			const index = players.indexOf(prevPlayer);

			if (index >= 0) {
				if (p) {
					const newPlayers = [...players];
					newPlayers[index] = p;
					setPlayers(newPlayers);
				} else {
					setPlayers(players.filter((p, i) => i !== index));
				}
			}
		};

	const onAdd = (p: MyAllStarPlayer | null) => {
		if (p) {
			setPlayers([...players, p]);
		}
	};

	return (
		<form
			onSubmit={async event => {
				event.preventDefault();

				// Get rid of any other properties, like abbrev
				const minimalPlayers = players
					.filter(p => p !== null)
					.map(p => {
						const p2: AllStarPlayer = {
							pid: p.pid,
							tid: p.tid,
							name: p.name,
						};

						if (p.injury.gamesRemaining > 0) {
							p2.injured = true;
						}

						return p2;
					});

				await toWorker("main", "allStarDraftSetPlayers", minimalPlayers);

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
					return (
						<Player
							key={i}
							allPossiblePlayers={allPossibleHealthy}
							onChange={onChange(p)}
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
				{healthy.map((p, i) => {
					return (
						<Player
							key={i}
							allPossiblePlayers={allPossibleHealthy}
							onChange={onChange(p)}
							p={p}
							selectedPIDs={selectedPIDs}
						/>
					);
				})}
			</div>

			<h2 className="mt-4">Injured All-Stars</h2>
			<div
				className="d-flex flex-wrap"
				style={{
					gap: "1rem",
				}}
			>
				{injured.map((p, i) => {
					return (
						<Player
							key={i}
							allPossiblePlayers={allPossibleInjured}
							onChange={onChange(p)}
							p={p}
							selectedPIDs={selectedPIDs}
							isClearable
						/>
					);
				})}
				<Player
					allPossiblePlayers={allPossibleInjured}
					onChange={onAdd}
					p={null}
					selectedPIDs={selectedPIDs}
					isClearable
				/>
			</div>

			<div className="mt-4">
				<button className="btn btn-primary" type="submit">
					Update All-Stars
				</button>

				<button className="btn btn-danger ms-2" type="button" onClick={onDone}>
					Cancel
				</button>
			</div>
		</form>
	);
};

export default EditAllStars;
