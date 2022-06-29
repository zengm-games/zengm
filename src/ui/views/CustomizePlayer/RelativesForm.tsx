import { useState } from "react";
import { WEBSITE_PLAY } from "../../../common";
import {
	ActionButton,
	HelpPopover,
	RatingsStatsPopover,
} from "../../components";
import { toWorker } from "../../util";

const RelativesForm = ({
	godMode,
	handleChange,
	relatives,
}: {
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

	const handleRelativesChange = (
		index: number,
		field: "pid" | "type" | "add" | "delete",
		event?: any,
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
			relatives[index][field] = event.target.value;
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
						<div className="me-3">
							{i === 0 ? <label className="form-label">Type</label> : null}
							<select
								className="form-select"
								onChange={event => {
									handleRelativesChange(i, "type", event);
								}}
								value={type}
								disabled={!godMode}
							>
								<option value="brother">Brother</option>
								<option value="father">Father</option>
								<option value="son">Son</option>
							</select>
						</div>
						<div className="me-2">
							{i === 0 ? (
								<label className="form-label">
									Player ID number{" "}
									<HelpPopover title="Player ID number">
										<p>Enter the player ID number of the relative here.</p>
										<p>
											To find a player ID number, go to the player page for that
											player and look at the end of the URL. For instance, if
											the URL is https://{WEBSITE_PLAY}/l/19/player/6937, then
											the player ID number is 6937.
										</p>
										<p>
											Ideally this would be a search box that would
											automatically find the ID number when you type in a
											player's name, but oh well.
										</p>
									</HelpPopover>
								</label>
							) : null}
							<input
								type="text"
								className="form-control"
								onChange={event => {
									handleRelativesChange(i, "pid", event);
								}}
								value={pid}
								disabled={!godMode}
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
							console.log(newPlayers);
							setAllPlayers(newPlayers);
							setAllPlayersState("done");
						} catch (error) {
							setAllPlayersState("init");
							throw error;
						}
					}}
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
