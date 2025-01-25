import { Dropdown } from "react-bootstrap";
import { Flag } from "../WatchBlock";
import {
	confirm,
	helpers,
	logEvent,
	realtimeUpdate,
	toWorker,
	useLocalPartial,
} from "../../util";
import { useState } from "react";
import type { SelectedRows } from "./useBulkSelectRows";
import { watchListDialog } from "./watchListDialog";
import { exportPlayers } from "../../views/ExportPlayers";
import { createPortal } from "react-dom";
import Modal from "../Modal";
import type { DataTableRowMetadata } from ".";

// Even at 20 the UI is kind of silly, and if you put in too many players it gets slow/crashes
const MAX_NUM_TO_COMPARE = 20;

type ExportModalStatus =
	| {
			show: false;
			abortController?: undefined;
	  }
	| {
			show: true;
			abortController: AbortController;
	  };

const ExportModal = ({ abortController, show }: ExportModalStatus) => {
	return (
		<>
			{show &&
				createPortal(
					<Modal animation show={show}>
						<Modal.Body>
							<h3 className="mb-0">Exporting players...</h3>
						</Modal.Body>

						<Modal.Footer>
							<button
								className="btn btn-danger"
								onClick={() => {
									abortController?.abort();
								}}
							>
								Cancel
							</button>
						</Modal.Footer>
					</Modal>,
					document.body,
				)}
		</>
	);
};

const getSeason = (
	season: DataTableRowMetadata["season"],
	type: "compare" | "export",
) => {
	if (typeof season === "string" || typeof season === "number") {
		return season;
	}

	return season[type] ?? season.default;
};

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
	const [exportModalStatus, setExportModalStatus] = useState<ExportModalStatus>(
		{
			show: false,
		},
	);

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
				return `${metadata.pid}-${getSeason(metadata.season, "compare")}-${seasonTypes[metadata.playoffs]}`;
			});

		await realtimeUpdate(
			[],
			helpers.leagueUrl(["compare_players", players.join(",")]),
		);
	};

	const onExportPlayers = async () => {
		const seasonsByPids = new Map<number, number | "latest">();
		let duplicatePids = false;
		for (const metadata of selectedRows.map.values()) {
			const seasonRaw = getSeason(metadata.season, "export");

			// Exported player must be at a specific season, so use latest season if career is specified
			const season = seasonRaw === "career" ? "latest" : seasonRaw;

			const prev = seasonsByPids.get(metadata.pid);
			if (prev !== undefined) {
				duplicatePids = true;
				if (prev === "latest" || (season !== "latest" && season < prev)) {
					continue;
				}
			}

			seasonsByPids.set(metadata.pid, season);
		}

		if (duplicatePids) {
			logEvent({
				type: "error",
				text: "Exporting the same player from multiple seasons is not supported, only the latest season will be exported.",
				saveToDb: false,
			});
		}

		const abortController = new AbortController();
		abortController.signal.addEventListener(
			"abort",
			() => {
				setExportModalStatus({
					show: false,
				});
			},
			{ once: true },
		);

		setExportModalStatus({
			show: true,
			abortController,
		});

		try {
			await exportPlayers(seasonsByPids, abortController.signal);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
			});
		}

		setExportModalStatus({
			show: false,
		});
	};

	const onWatchPlayers = async () => {
		const pids = Array.from(selectedRows.map.values()).map(metadata => {
			return metadata.pid;
		});

		if (numWatchColors <= 1) {
			// Toggle watch colors
			await toWorker("main", "updatePlayersWatch", { pids });
		} else {
			// Show popup to select colors
			const watch = await watchListDialog({
				numPlayers: selectedRows.map.size,
				numWatchColors,
			});
			if (watch !== null) {
				await toWorker("main", "updatePlayersWatch", { pids, watch });
			}
		}
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
		<>
			<Dropdown
				onToggle={async opening => {
					if (!opening || selectedRows.map.size === 0) {
						return;
					}

					if (numWatchColors <= 1) {
						// Only dynamically update color if there is 1 watch list, otherwise we open a popup to let the user select the color manually
						const pids = Array.from(selectedRows.map.values()).map(metadata => {
							return metadata.pid;
						});

						const newNextWatch = await toWorker(
							"main",
							"getPlayersNextWatch",
							pids,
						);
						setNextWatch(newNextWatch);
					} else {
						// Reset
						if (nextWatch !== undefined) {
							setNextWatch(undefined);
						}
					}
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
					<Dropdown.Item
						onClick={hasSomeSelected ? onComparePlayers : undefined}
					>
						Compare players
						{selectedRows.map.size > MAX_NUM_TO_COMPARE
							? ` (first ${MAX_NUM_TO_COMPARE} players only)`
							: null}
					</Dropdown.Item>
					<Dropdown.Item
						onClick={hasSomeSelected ? onExportPlayers : undefined}
					>
						Export players
					</Dropdown.Item>
					<Dropdown.Item onClick={hasSomeSelected ? onWatchPlayers : undefined}>
						{numWatchColors > 1 ? "Set" : "Toggle"} watch list{" "}
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
					<Dropdown.Header>
						{selectedRows.map.size}{" "}
						{helpers.plural("player", selectedRows.map.size)} selected
					</Dropdown.Header>
				</Dropdown.Menu>
			</Dropdown>
			<ExportModal {...exportModalStatus} />
		</>
	);
};
