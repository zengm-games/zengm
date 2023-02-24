import { useMemo, useState } from "react";
import { groupByUnique } from "../../../common/groupBy";
import type { GameAttributesLeague } from "../../../common/types";
import {
	ActionButton,
	HelpPopover,
	RatingsStatsPopover,
} from "../../components";
import SelectMultiple from "../../components/SelectMultiple";
import { helpers, toWorker } from "../../util";

const RelativesForm = ({
	gender,
	godMode,
	handleChange,
	initialPlayers,
	relatives,
}: {
	gender: GameAttributesLeague["gender"];
	godMode: boolean;
	handleChange: (
		type: string,
		field: string,
		event: {
			target: {
				value: any;
			};
		},
	) => void;
	initialPlayers: {
		name: string;
		pid: number;
	}[];
	relatives: {
		name: string;
		pid: number | string;
		type: string;
	}[];
}) => {
	const [allPlayersState, setAllPlayersState] = useState<
		"init" | "loading" | "done"
	>("init");
	const [allPlayers, setAllPlayers] = useState<
		{ pid: number; name: string }[] | undefined
	>();
	const candidateRelatives = allPlayers ?? initialPlayers;

	const playersByPid = useMemo(
		() => groupByUnique(candidateRelatives, "pid"),
		[candidateRelatives],
	);

	const handleRelativesChange = (
		index: number,
		field: "pid" | "type" | "add" | "delete",
		value?: string,
	) => {
		if (field === "delete") {
			relatives.splice(index, 1);
		} else if (field === "add") {
			relatives.push({
				name: "",
				pid: 0,
				type: "brother",
			});
		} else {
			relatives[index][field] = value!;
		}
		handleChange("root", "relatives", {
			target: {
				value: relatives,
			},
		});
	};

	return (
		<>
			{relatives.map(({ pid, type }, i) => {
				const pidInt = parseInt(pid as any);

				return (
					<div className="d-flex align-items-end mb-3" key={i}>
						<div className="me-3 flex-shrink-0">
							{i === 0 ? <label className="form-label">Type</label> : null}
							<select
								className="form-select"
								onChange={event => {
									handleRelativesChange(i, "type", event.target.value);
								}}
								value={type}
								disabled={!godMode}
							>
								<option value="brother">
									{helpers.getRelativeType(gender, "brother")}
								</option>
								<option value="father">
									{helpers.getRelativeType(gender, "father")}
								</option>
								<option value="son">
									{helpers.getRelativeType(gender, "son")}
								</option>
							</select>
						</div>
						<div className="me-2 flex-grow-1">
							{i === 0 ? <label className="form-label">Player</label> : null}
							<SelectMultiple
								value={playersByPid[pid]}
								options={candidateRelatives}
								onChange={p => {
									handleRelativesChange(i, "pid", String(p!.pid));
								}}
								getOptionLabel={p => p.name}
								getOptionValue={p => String(p.pid)}
								disabled={!godMode}
								loading={allPlayersState === "loading"}
								isClearable={false}
							/>
						</div>
						<div className="flex-shrink-0" style={{ fontSize: 20 }}>
							<RatingsStatsPopover pid={pidInt} />
							<button
								className="ms-3 text-danger btn btn-link p-0 border-0"
								onClick={() => {
									handleRelativesChange(i, "delete");
								}}
								title="Delete"
								style={{ fontSize: 20 }}
								disabled={!godMode}
								type="button"
							>
								<span className="glyphicon glyphicon-remove" />
							</button>
						</div>
					</div>
				);
			})}
			<div className="d-flex align-items-center">
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => {
						handleRelativesChange(-1, "add");
					}}
					disabled={!godMode}
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
					{allPlayersState === "done" ? "Done!" : "Load Retired Players"}
				</ActionButton>
				<HelpPopover title="Load Retired Players">
					<p>
						By default, only active players are shown as selectable options in
						the relatives form. This is for performance reasons, to handle
						leagues where people have played many seasons.
					</p>
					<p>
						If you press the "Load Retired Players" button and wait for it to
						load, then retired players will be available to select as well.
					</p>
				</HelpPopover>
			</div>
		</>
	);
};

export default RelativesForm;
