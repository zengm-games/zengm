import { useState } from "react";
import type { AllStarPlayer, View } from "../../../common/types";
import SelectMultiple from "../../components/SelectMultiple";
import { toWorker } from "../../util";

const divStyle = {
	width: 300,
};

type MyAllStarPlayer = View<"allStarTeams">["allPossiblePlayers"][number];

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

const Section = ({
	className,
	name,
	players,
	allowHealthy,
	allowInjured,
	selectedPIDs,
	allPossibleHealthy,
	allPossibleInjured,
	sectionIndex,
	onChange,
	onAdd,
}: {
	className?: string;
	name: string;
	players: MyAllStarPlayer[];
	allowHealthy: boolean;
	allowInjured: boolean;
	selectedPIDs: number[];
	allPossibleHealthy: MyAllStarPlayer[];
	allPossibleInjured: MyAllStarPlayer[];
	sectionIndex: number;
	onChange: (
		sectionIndex: number,
		prevPlayer: MyAllStarPlayer,
	) => (p: MyAllStarPlayer | null) => void;
	onAdd: (sectionIndex: number) => (p: MyAllStarPlayer | null) => void;
}) => {
	let healthy: typeof players = [];
	let injured: typeof players = [];
	if (allowHealthy && allowInjured) {
		healthy = [];
		injured = [];
		for (const p of players) {
			if (p === null || p.injury.gamesRemaining > 0) {
				injured.push(p);
			} else {
				healthy.push(p);
			}
		}
	} else if (allowHealthy) {
		healthy = players;
	} else if (allowInjured) {
		injured = players;
	}

	return (
		<div className={className}>
			{allowHealthy ? (
				<>
					<h2>{name}</h2>
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
									onChange={onChange(sectionIndex, p)}
									p={p}
									selectedPIDs={selectedPIDs}
								/>
							);
						})}
					</div>
				</>
			) : null}

			{allowInjured ? (
				<>
					<h2 className="mt-4">
						{name}
						{allowHealthy ? " (Injured)" : null}
					</h2>
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
									onChange={onChange(sectionIndex, p)}
									p={p}
									selectedPIDs={selectedPIDs}
									isClearable
								/>
							);
						})}
						<Player
							allPossiblePlayers={allPossibleInjured}
							onChange={onAdd(sectionIndex)}
							p={null}
							selectedPIDs={selectedPIDs}
							isClearable
						/>
					</div>
				</>
			) : null}
		</div>
	);
};

const EditAllStars = ({
	allPossiblePlayers,
	initialSections,
	onDone,
	type,
}: {
	allPossiblePlayers: MyAllStarPlayer[];
	initialSections: {
		name: string;
		players: MyAllStarPlayer[];
		allowHealthy: boolean;
		allowInjured: boolean;
	}[];
	onDone: () => void;
	type: View<"allStarTeams">["type"];
}) => {
	const [sections, setSections] = useState(initialSections);

	const selectedPIDs = sections
		.map(section => section.players.map(p => p?.pid))
		.flat();

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
		(sectionIndex: number, prevPlayer: MyAllStarPlayer) =>
		(p: MyAllStarPlayer | null) => {
			const players = sections[sectionIndex].players;
			const playerIndex = players.indexOf(prevPlayer);

			if (playerIndex >= 0) {
				if (p) {
					const newPlayers = [...players];
					newPlayers[playerIndex] = p;
					setSections(
						sections.map((section, i) => {
							if (i === sectionIndex) {
								return {
									...section,
									players: newPlayers,
								};
							}

							return section;
						}),
					);
				} else {
					setSections(
						sections.map((section, i) => {
							if (i === sectionIndex) {
								return {
									...section,
									players: section.players.filter((p, i) => i !== playerIndex),
								};
							}

							return section;
						}),
					);
				}
			}
		};

	const onAdd = (sectionIndex: number) => (p: MyAllStarPlayer | null) => {
		if (p) {
			const players = sections[sectionIndex].players;
			setSections(
				sections.map((section, i) => {
					if (i === sectionIndex) {
						return {
							...section,
							players: [...players, p],
						};
					}

					return section;
				}),
			);
		}
	};

	return (
		<form
			onSubmit={async event => {
				event.preventDefault();

				// Get rid of any other properties, like abbrev
				const minimalSections = sections.map(section => ({
					...section,
					players: section.players
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
						}),
				}));

				const players = {
					teams: [[], []] as [AllStarPlayer[], AllStarPlayer[]],
					remaining: [] as AllStarPlayer[],
				};
				if (type === "draft") {
					players.teams[0].push(minimalSections[0].players[0]);
					players.teams[1].push(minimalSections[0].players[1]);
					players.remaining.push(...minimalSections[1].players);
				} else {
					players.teams[0].push(...minimalSections[0].players);
					players.teams[1].push(...minimalSections[1].players);
					players.remaining.push(...minimalSections[2].players);
				}

				await toWorker("main", "allStarDraftSetPlayers", players);

				onDone();
			}}
		>
			{sections.map((section, i) => (
				<Section
					key={i}
					className={i === 0 ? undefined : "mt-4"}
					{...section}
					selectedPIDs={selectedPIDs}
					allPossibleHealthy={allPossibleHealthy}
					allPossibleInjured={allPossibleInjured}
					sectionIndex={i}
					onChange={onChange}
					onAdd={onAdd}
				/>
			))}

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
