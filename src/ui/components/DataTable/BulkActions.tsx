import { Dropdown } from "react-bootstrap";
import { Flag } from "../WatchBlock.tsx";
import { helpers } from "../../util/helpers.ts";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
import { useLocal } from "../../util/local.ts";
import {
	useCallback,
	useEffect,
	useState,
	type ReactNode,
	type RefObject,
} from "react";
import type { SelectedRows } from "./useBulkSelectRows.ts";
import { watchListDialog } from "./watchListDialog.tsx";
import { exportPlayers } from "../../views/ExportPlayers.tsx";
import { createPortal } from "react-dom";
import { Modal } from "../Modal.tsx";
import type { DataTableRowMetadata, MetadataType, Props } from "./index.tsx";
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
	season: DataTableRowMetadata<"player">["season"],
	type: "compare" | "export",
) => {
	if (typeof season === "string" || typeof season === "number") {
		return season;
	}

	return season[type] ?? season.default;
};

export type BulkAction<Type extends MetadataType = undefined> = {
	godMode?: boolean;
	onClick: (selectedRows: SelectedRows<Type>) => void;
	text: ReactNode;
	textLong?: ReactNode;
};

// Built-in actions for tables where rows are players
const usePlayerBulkActions = (selectedRows: SelectedRows<"player">) => {
	const { numWatchColors } = useLocal(["numWatchColors"]);
	const [exportModalStatus, setExportModalStatus] = useState<ExportModalStatus>(
		{
			show: false,
		},
	);
	const onComparePlayers = async () => {
		const seasonTypes = {
			combined: "c",
			playoffs: "p",
			regularSeason: "r",
		};
		const players = Array.from(selectedRows.map.values())
			.slice(0, MAX_NUM_TO_COMPARE)
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
			showNotification({
				type: "error",
				text: "Exporting the same player from multiple seasons is not supported, only the latest season will be exported.",
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
			showNotification({
				type: "error",
				text: error.message,
			});
		}

		setExportModalStatus({
			show: false,
		});
	};

	const onWatchPlayers = async () => {
		const pids = Array.from(selectedRows.map.values()).map((metadata) => {
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
			const pids = Array.from(selectedRows.map.values()).map((metadata) => {
				return metadata.pid;
			});
			await toWorker("main", "removePlayers", pids);

			// Clear because the selected players no longer exist!
			selectedRows.clear();
		}
	};

	const onHealPlayers = async () => {
		const pids = Array.from(selectedRows.map.values()).map((metadata) => {
			return metadata.pid;
		});
		await toWorker("main", "clearInjuries", pids);
	};

	const actions: BulkAction<MetadataType>[] = [
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

	return {
		actions,
		exportModal: <ExportModal {...exportModalStatus} />,
	};
};

// Approximate widths, for determining if there is enough room to show inline buttons
const CONTROLS_WIDTH = 220;
const BUTTON_WIDTH = 80;

type BulkActionsProps<Type extends MetadataType> = {
	extraActions: BulkAction<Type>[] | undefined;
	hasTitle: boolean;
	hideAllControls: Props["hideAllControls"];
	metadataType: MetadataType;
	name: string;
	selectedRows: SelectedRows<Type>;
	wrapperRef: RefObject<HTMLDivElement | null>;
};

const BulkActionsUI = <Type extends MetadataType>({
	builtInActions,
	extraActions,
	hasTitle,
	hideAllControls,
	metadataType,
	name,
	selectedRows,
	wrapperRef,
}: BulkActionsProps<Type> & {
	builtInActions: BulkAction<MetadataType>[];
}) => {
	const { godMode } = useLocal(["godMode"]);

	// God mode actions go at the end, after any extra actions
	const actions: BulkAction<Type>[] = [
		...builtInActions.filter((action) => !action.godMode),
		...(extraActions ?? []),
		...builtInActions.filter((action) => action.godMode),
	].filter((action) => !action.godMode || godMode);

	const numActions = actions.length;

	const getUpdatedShowInlineButtons = useCallback(() => {
		// Never show inline if there's a title, because there's no room!
		if (hasTitle || !wrapperRef.current) {
			return false;
		}

		// Cutoff for when there is enough room to show inline buttons - changes when more buttons are shown or more space is available
		const cutoff =
			numActions * BUTTON_WIDTH + (hideAllControls ? 0 : CONTROLS_WIDTH);

		return wrapperRef.current.offsetWidth >= cutoff;
	}, [hasTitle, hideAllControls, numActions, wrapperRef]);

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

	if (showInlineButtons) {
		return (
			<div className="d-flex align-items-start gap-2 mb-2">
				{actions.map((action, i) => {
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
		<Dropdown className="mb-2">
			<Dropdown.Toggle
				id={`datatable-bulk-actions-${name}`}
				size="sm"
				variant="primary"
			>
				Bulk actions
			</Dropdown.Toggle>
			<Dropdown.Menu>
				{actions.map((action, i) => {
					return (
						<Dropdown.Item
							key={i}
							className={action.godMode ? "god-mode" : undefined}
							onClick={() => {
								action.onClick(selectedRows);
							}}
							disabled={!hasSomeSelected}
						>
							{action.textLong ?? action.text}
						</Dropdown.Item>
					);
				})}
				<Dropdown.Header>
					{selectedRows.map.size}{" "}
					{helpers.plural(metadataType ?? "row", selectedRows.map.size)}{" "}
					selected
				</Dropdown.Header>
			</Dropdown.Menu>
		</Dropdown>
	);
};

const PlayerBulkActions = <Type extends MetadataType>({
	playerSelectedRows,
	...props
}: BulkActionsProps<Type> & {
	playerSelectedRows: SelectedRows<"player">;
}) => {
	const { actions, exportModal } = usePlayerBulkActions(playerSelectedRows);

	return (
		<>
			<BulkActionsUI {...props} builtInActions={actions} />
			{exportModal}
		</>
	);
};

const noBuiltInActions: BulkAction<MetadataType>[] = [];

export const BulkActions = <Type extends MetadataType>(
	props: BulkActionsProps<Type>,
) => {
	if (props.metadataType === "player") {
		// TypeScript can't connect metadataType to Type, but if metadataType is "player" then all the selected rows are players
		return (
			<PlayerBulkActions
				{...props}
				playerSelectedRows={props.selectedRows as SelectedRows<"player">}
			/>
		);
	}

	return <BulkActionsUI {...props} builtInActions={noBuiltInActions} />;
};
