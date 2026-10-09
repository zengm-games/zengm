import { useEffect, useState } from "react";
import SelectMultiple from "../../components/SelectMultiple/index.tsx";
import { toWorker } from "../../util/toWorker.ts";
import { type EditProps, FormButtons } from "./common.tsx";

type RetiredPlayer = {
	pid: number;
	name: string;
	retiredYear: number;
};

const EditUnretirePlayer = ({
	event,
	onCancel,
	onSave,
	saving,
}: EditProps<"unretirePlayer">) => {
	const [players, setPlayers] = useState<RetiredPlayer[] | undefined>();
	const [player, setPlayer] = useState<RetiredPlayer | null>(null);

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
				"getRetiredPlayersForScheduledEvents",
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
						getOptionLabel={(p) => `${p.name} (retired ${p.retiredYear})`}
						getOptionValue={(p) => String(p.pid)}
						onChange={setPlayer}
						loading={!players}
					/>
				</div>
			)}
			<div className="form-text">
				{players?.length === 0
					? "There are no retired players in this league."
					: "The player will come out of retirement and become a free agent."}
			</div>
			<FormButtons
				disabled={pid === undefined}
				onCancel={onCancel}
				saving={saving}
			/>
		</form>
	);
};

export default EditUnretirePlayer;
