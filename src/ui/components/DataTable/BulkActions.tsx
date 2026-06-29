import { Flag } from "../WatchBlock.tsx";
import { helpers } from "../../util/helpers.ts";
import { logEvent } from "../../util/logEvent.ts";
import { toWorker } from "../../util/toWorker.ts";
import { useLocal } from "../../util/local.ts";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from "react";
import type { SelectedRows } from "./useBulkSelectRows.ts";
import { watchListDialog } from "./watchListDialog.tsx";
import { exportPlayers } from "../../views/ExportPlayers.tsx";
import { createPortal } from "react-dom";
import { Modal } from "../Modal.tsx";
import type { DataTableRowMetadata, Props } from "./index.tsx";
import clsx from "clsx";
import { confirm } from "../../util/confirm.tsx";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";

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
	season: Extract<DataTableRowMetadata, { type: "player" }>["season"],
	type: "compare" | "export",
) => {
	if (typeof season === "string" || typeof season === "number") {
		return season;
	}

	return season[type] ?? season.default;
};

export type BulkAction = {
	godMode?: boolean;
	onClick: (selectedRows: SelectedRows) => void;
	text: ReactNode;
	textLong?: ReactNode;
};

export const BulkActions = ({
	extraActions,
	hasTitle,
	hideAllControls,
	name,
	selectedRows,
	wrapperRef,
}: {
	extraActions: BulkAction[] | undefined;
	hasTitle: boolean;
	hideAllControls: Props["hideAllControls"];
	name: string;
	selectedRows: SelectedRows;
	wrapperRef: RefObject<HTMLDivElement | null>;
}) => {
	const { godMode, numWatchColors } = useLocal(["godMode", "numWatchColors"]);
	const [exportModalStatus, setExportModalStatus] = useState<ExportModalStatus>(
		{
			show: false,
		},
	);

	const numExtraActions = extraActions?.length ?? 0;

	const getUpdatedShowInlineButtons = useCallback(() => {
		// Never show inline if there's a title, because there's no room!
		if (hasTitle || !wrapperRef.current) {
			return false;
		}

		// Cutoff for when there is enough room to show inline buttons - changes when more buttons are shown or more space is available
		let baseCutoff = 460;

		// Assume 80 pixels per button
		baseCutoff += numExtraActions * 80;

		if (godMode) {
			baseCutoff += 108;
		}

		if (hideAllControls) {
			baseCutoff -= 220;
		}

		return wrapperRef.current.offsetWidth >= baseCutoff;
	}, [godMode, hasTitle, hideAllControls, numExtraActions, wrapperRef]);

	const [showInlineButtons, setShowInlineButtons] = useState(false);

	useEffect(() => {
		if (wrapperRef.current) {
			getUpdatedShowInlineButtons();

			const update = () => {
				setShowInlineButtons(getUpdatedShowInlineButtons);
			};

			const resizeObserver = new ResizeObserver(update);
			resizeObserver.observe(wrapperRef.current);

			return () => {
				resizeObserver.disconnect();
			};
		}
	}, [getUpdatedShowInlineButtons, wrapperRef]);

	const hasSomeSelected = selectedRows.map.size > 0;

	const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
	const bulkMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!bulkMenuOpen) {
			return;
		}
		const handler = (e: globalThis.MouseEvent) => {
			if (
				bulkMenuRef.current &&
				!bulkMenuRef.current.contains(e.target as Node)
			) {
				setBulkMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [bulkMenuOpen]);

	const onComparePlayers = async () => {
		const seasonTypes = {
			combined: "c",
			playoffs: "p",
			regularSeason: "r",
		};
		const players = Array.from(selectedRows.map.values())
			.slice(0, MAX_NUM_TO_COMPARE)
			.filter((metadata) => metadata.type === "player")
			.map((metadata) => {
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
			if (metadata.type === "player") {
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
		const pids = Array.from(selectedRows.map.values())
			.filter((metadata) => metadata.type === "player")
			.map((metadata) => {
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
			`Are you sure you want to delete ${helpers.numberWithCommas(selectedRows.map.size)} ${helpers.plural("player", selectedRows.map.size)}?`,
			{
				okText: helpers.plural("Delete player", selectedRows.map.size),
			},
		);
		if (proceed) {
			const pids = Array.from(selectedRows.map.values())
				.filter((metadata) => metadata.type === "player")
				.map((metadata) => {
					return metadata.pid;
				});
			await toWorker("main", "removePlayers", pids);

			// Clear because the selected players no longer exist!
			selectedRows.clear();
		}
	};

	const onHealPlayers = async () => {
		const pids = Array.from(selectedRows.map.values())
			.filter((metadata) => metadata.type === "player")
			.map((metadata) => {
				return metadata.pid;
			});
		await toWorker("main", "clearInjuries", pids);
	};

	const actions: BulkAction[] = [
		{
			onClick: onComparePlayers,
			text: "Compare",
			textLong: (
				<>
					Compare
					{selectedRows.map.size > MAX_NUM_TO_COMPARE
						? ` (first ${MAX_NUM_TO_COMPARE} players only)`
						: null}
				</>
			),
		},
		{
			onClick: onExportPlayers,
			text: "Export",
			textLong: "Export players",
		},
		{
			onClick: onWatchPlayers,
			text: (
				<>
					Watch <Flag />
				</>
			),
			textLong: (
				<>
					{numWatchColors > 1 ? "Set" : "Toggle"} watch list <Flag />
				</>
			),
		},
		...(extraActions ?? []),
		{
			godMode: true,
			onClick: onDeletePlayers,
			text: "Delete",
			textLong: "Delete players",
		},
		{
			godMode: true,
			onClick: onHealPlayers,
			text: "Heal",
			textLong: "Heal players",
		},
	];

	if (showInlineButtons) {
		return (
			<div className="d-flex align-items-start gap-2 mb-2">
				{actions.map((action, i) => {
					if (action.godMode && !godMode) {
						return null;
					}

					return (
						<button
							key={i}
							className={clsx(
								"btn btn-sm",
								action.godMode ? "btn-god-mode" : "btn-primary",
							)}
							disabled={!hasSomeSelected}
							onClick={() => {
								action.onClick(selectedRows);
							}}
						>
							{action.text}
						</button>
					);
				})}
			</div>
		);
	}

	return (
		<>
			<div ref={bulkMenuRef} className="dropdown mb-2">
				<button
					id={`datatable-bulk-actions-${name}`}
					className="btn btn-sm btn-primary dropdown-toggle"
					onClick={() => setBulkMenuOpen((o) => !o)}
					type="button"
				>
					Bulk actions
				</button>
				{bulkMenuOpen ? (
					<ul className="dropdown-menu show">
						{actions.map((action, i) => {
							if (action.godMode && !godMode) {
								return null;
							}

							return (
								<li key={i}>
									<button
										className={clsx(
											"dropdown-item",
											action.godMode && "god-mode",
										)}
										disabled={!hasSomeSelected}
										onClick={() => {
											action.onClick(selectedRows);
											setBulkMenuOpen(false);
										}}
										type="button"
									>
										{action.textLong ?? action.text}
									</button>
								</li>
							);
						})}
						<li>
							<h6 className="dropdown-header">
								{selectedRows.map.size}{" "}
								{helpers.plural("player", selectedRows.map.size)} selected
							</h6>
						</li>
					</ul>
				) : null}
			</div>
			<ExportModal {...exportModalStatus} />
		</>
	);
};
