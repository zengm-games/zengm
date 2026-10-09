import { useEffect, useState } from "react";
import SelectMultiple from "../../components/SelectMultiple/index.tsx";
import { toWorker } from "../../util/toWorker.ts";
import { type EditProps, FormButtons } from "./common.tsx";

type PlayerOption = {
	pid: number;
	name: string;
	// Team, retired year, or draft year
	info: string;
};

const EditPlayer = ({
	event,
	onCancel,
	onSave,
	saving,
	type,
}: EditProps<"retirePlayer" | "unretirePlayer"> & {
	type: "retirePlayer" | "unretirePlayer";
}) => {
	const [players, setPlayers] = useState<PlayerOption[] | undefined>();
	const [player, setPlayer] = useState<PlayerOption | null>(null);

	// The player can't be changed when editing an existing event, so no need to load players
	const existingEvent = !!event;

	useEffect(() => {
		if (existingEvent) {
			return;
		}

		let active = true;
		(async () => {
			const players = await toWorker(
				"main",
				"getPlayersForScheduledEvents",
				undefined,
			);
			if (active) {
				setPlayers(players);
			}
		})();

		return () => {
			active = false;
		};
	}, [existingEvent]);

	const pid = event ? event.info.pid : player?.pid;

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (pid !== undefined) {
					onSave({ pid });
				}
			}}
		>
			<label className="form-label">Player</label>
			{event ? (
				<div>{event.info.name}</div>
			) : (
				<div style={{ maxWidth: 400 }}>
					<SelectMultiple
						options={players ?? []}
						value={player}
						getOptionLabel={(p) => `${p.name} (${p.info})`}
						getOptionValue={(p) => String(p.pid)}
						onChange={setPlayer}
						loading={!players}
					/>
				</div>
			)}
			<FormButtons
				disabled={pid === undefined}
				onCancel={onCancel}
				saving={saving}
			/>
		</form>
	);
};

export default EditPlayer;
