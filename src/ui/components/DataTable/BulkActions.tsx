import { Dropdown } from "react-bootstrap";
import { Flag } from "../WatchBlock";
import { helpers, realtimeUpdate, toWorker, useLocalPartial } from "../../util";
import type { DataTableRow, DataTableRowMetadata } from ".";
import { useState } from "react";

export const BulkActions = ({
	hasSomeSelected,
	name,
	selectedRows,
}: {
	hasSomeSelected: boolean;
	name: string;
	selectedRows: Map<DataTableRow["key"], DataTableRowMetadata>;
}) => {
	const { numWatchColors } = useLocalPartial(["numWatchColors"]);
	const [nextWatch, setNextWatch] = useState<undefined | number>(undefined);

	const onComparePlayers = async () => {
		const seasonTypes = {
			combined: "c",
			playoffs: "p",
			regularSeason: "r",
		};
		const players = Array.from(selectedRows.values()).map(metadata => {
			return `${metadata.pid}-${metadata.season}-${seasonTypes[metadata.playoffs]}`;
		});

		await realtimeUpdate(
			[],
			helpers.leagueUrl(["compare_players", players.join(",")]),
		);
	};

	const onExportPlayers = () => {};

	const onWatchPlayers = async () => {
		const pids = Array.from(selectedRows.values()).map(metadata => {
			return metadata.pid;
		});
		await toWorker("main", "updatePlayersWatch", pids);
	};

	return (
		<Dropdown
			className="float-start"
			onToggle={async opening => {
				if (!opening || selectedRows.size === 0) {
					return;
				}

				const pids = Array.from(selectedRows.values()).map(metadata => {
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
				title="Bulk actions"
				variant={hasSomeSelected ? "primary" : "secondary"}
			>
				Bulk actions
			</Dropdown.Toggle>
			<Dropdown.Menu>
				<Dropdown.Item onClick={hasSomeSelected ? onComparePlayers : undefined}>
					Compare players
				</Dropdown.Item>
				<Dropdown.Item onClick={hasSomeSelected ? onExportPlayers : undefined}>
					Export players
				</Dropdown.Item>
				<Dropdown.Item onClick={hasSomeSelected ? onWatchPlayers : undefined}>
					{numWatchColors > 1 ? "Cycle" : "Toggle"} watch list{" "}
					<Flag watch={nextWatch} />
				</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
	);
};
