import { useCallback, type MouseEvent } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { confirm, local, realtimeUpdate, toWorker } from "../util/index.ts";
import type { Option } from "../../common/types.ts";
import clsx from "clsx";
import {
	formatKeyboardShortcut,
	useKeyboardShortcuts,
} from "../hooks/useKeyboardShortcuts.ts";

const handleOptionClick = (option: Option, event: MouseEvent) => {
	if (!option.url) {
		event.preventDefault();
		toWorker("playMenu", option.id as any, undefined);
	}
};

const PlayMenu = ({
	lid,
	spectator,
	options,
}: {
	lid: number | undefined;
	spectator: boolean;
	options: Option[];
}) => {
	useKeyboardShortcuts(
		"playMenu",
		undefined,
		useCallback(
			async (id) => {
				const option = options.find(
					(option2) => option2.keyboardShortcut === id,
				);

				if (!option) {
					return;
				}

				if (window.location.pathname.includes("/live_game")) {
					const liveGameInProgress = local.getState().liveGameInProgress;
					if (liveGameInProgress) {
						const proceed = await confirm(
							"Are you sure you meant to press a Play Menu keyboard shortcut while watching a live sim?",
							{
								okText: "Yes",
								cancelText: "Cancel",
							},
						);
						if (!proceed) {
							return;
						}
					}
				}

				if (option.url) {
					realtimeUpdate([], option.url);
				} else {
					toWorker("playMenu", option.id as any, undefined);
				}
			},
			[options],
		),
	);

	if (lid === undefined) {
		return null;
	}

	return (
		<Dropdown
			className={`play-button-wrapper${
				window.mobile ? " dropdown-mobile" : ""
			}`}
			as={Nav.Item}
		>
			<Dropdown.Toggle
				className={clsx(
					"play-button",
					spectator ? "play-button-danger" : "play-button-success",
				)}
				id="play-button"
				as={Nav.Link}
			>
				Play
			</Dropdown.Toggle>
			<Dropdown.Menu>
				{options.map((option, i) => {
					return (
						<Dropdown.Item
							key={i}
							href={option.url}
							onClick={(event: MouseEvent<any>) =>
								handleOptionClick(option, event)
							}
							className="kbd-parent"
						>
							{option.label}
							{option.keyboardShortcut ? (
								<span className="text-body-secondary kbd">
									{formatKeyboardShortcut("playMenu", option.keyboardShortcut)}
								</span>
							) : null}
						</Dropdown.Item>
					);
				})}
			</Dropdown.Menu>
		</Dropdown>
	);
};

export default PlayMenu;
