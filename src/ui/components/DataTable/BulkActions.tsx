import { Dropdown } from "react-bootstrap";
import { Flag } from "../WatchBlock";
import {
	confirm,
	helpers,
	realtimeUpdate,
	toWorker,
	useLocalPartial,
} from "../../util";
import { useState } from "react";
import type { SelectedRows } from "./useBulkSelectRows";

// Even at 20 the UI is kind of silly, and if you put in too many players it gets slow/crashes
const MAX_NUM_TO_COMPARE = 20;

export const BulkActions = ({
	name,
	selectedRows,
}: {
	name: string;
	selectedRows: SelectedRows;
}) => {
	const { godMode, numWatchColors } = useLocalPartial([
		"godMode",
		"numWatchColors",
	]);
	const [nextWatch, setNextWatch] = useState<undefined | number>(undefined);

	const hasSomeSelected = selectedRows.map.size > 0;

	const onComparePlayers = async () => {
		const seasonTypes = {
			combined: "c",
			playoffs: "p",
			regularSeason: "r",
		};
		const players = Array.from(selectedRows.map.values())
			.slice(0, MAX_NUM_TO_COMPARE)
			.map(metadata => {
				return `${metadata.pid}-${metadata.season}-${seasonTypes[metadata.playoffs]}`;
			});

		await realtimeUpdate(
			[],
			helpers.leagueUrl(["compare_players", players.join(",")]),
		);
	};

	const onExportPlayers = () => {};

	const onWatchPlayers = async () => {
		const pids = Array.from(selectedRows.map.values()).map(metadata => {
			return metadata.pid;
		});
		await toWorker("main", "updatePlayersWatch", pids);
	};

	const onDeletePlayers = async () => {
		const proceed = await confirm(
			`Are you sure you want to delete ${selectedRows.map.size} ${helpers.plural("player", selectedRows.map.size)}?`,
			{
				okText: helpers.plural("Delete player", selectedRows.map.size),
			},
		);
		if (proceed) {
			const pids = Array.from(selectedRows.map.values()).map(metadata => {
				return metadata.pid;
			});
			await toWorker("main", "removePlayers", pids);

			// Clear because the selected players no longer exist!
			selectedRows.clear();
		}
	};

	return (
		<Dropdown
			className="float-start"
			onToggle={async opening => {
				if (!opening || selectedRows.map.size === 0) {
					return;
				}

				const pids = Array.from(selectedRows.map.values()).map(metadata => {
					return metadata.pid;
				});

				const newNextWatch = await toWorker(
					"main",
					"getPlayersNextWatch",
					pids,
				);
				setNextWatch(newNextWatch);
			}}
		>
			<Dropdown.Toggle
				id={`datatable-bulk-actions-${name}`}
				size="sm"
				variant={hasSomeSelected ? "primary" : "secondary"}
			>
				Bulk actions
			</Dropdown.Toggle>
			<Dropdown.Menu>
				<Dropdown.Item onClick={hasSomeSelected ? onComparePlayers : undefined}>
					Compare players
					{selectedRows.map.size > MAX_NUM_TO_COMPARE
						? ` (first ${MAX_NUM_TO_COMPARE} players only)`
						: null}
				</Dropdown.Item>
				<Dropdown.Item onClick={hasSomeSelected ? onExportPlayers : undefined}>
					Export players
				</Dropdown.Item>
				<Dropdown.Item onClick={hasSomeSelected ? onWatchPlayers : undefined}>
					{numWatchColors > 1 ? "Cycle" : "Toggle"} watch list{" "}
					<Flag watch={nextWatch} />
				</Dropdown.Item>
				{godMode ? (
					<Dropdown.Item
						className="god-mode"
						onClick={hasSomeSelected ? onDeletePlayers : undefined}
					>
						Delete players
					</Dropdown.Item>
				) : null}
			</Dropdown.Menu>
		</Dropdown>
	);
};
