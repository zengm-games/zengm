import { useEffect, type MouseEvent } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { confirm, local, realtimeUpdate, toWorker } from "../util/index.ts";
import type { Option } from "../../common/types.ts";
import clsx from "clsx";
import { formatModifierKeyLabel } from "../util/formatModifierKeyLabel.ts";
import { canSimulateGames, getCurrentCloudId } from "../util/cloudSync.ts";

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
	useEffect(() => {
		const handleKeydown = async (event: KeyboardEvent) => {
			// alt + letter -  CANNOT USE KeyboardEvent.key BECAUSE ALT+P ON MAC IS PI!
			if (
				event.altKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!event.metaKey
			) {
				const option = options.find((option2) => option2.code === event.code);

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
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [options]);

	if (lid === undefined) {
		return null;
	}

	// Check cloud permissions - only commissioner can simulate in cloud leagues
	const isCloudLeague = !!getCurrentCloudId();
	const canSim = canSimulateGames();

	// If in a cloud league and user can't simulate, show disabled button with explanation
	if (isCloudLeague && !canSim) {
		return (
			<div
				className={`play-button-wrapper${window.mobile ? " dropdown-mobile" : ""}`}
				style={{ display: "inline-block" }}
			>
				<button
					className="btn btn-secondary play-button"
					disabled
					title="Only the commissioner can simulate games in cloud leagues"
				>
					Play (Commissioner Only)
				</button>
			</div>
		);
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
							{option.key ? (
								<span className="text-body-secondary kbd">
									{formatModifierKeyLabel(option.key.toUpperCase())}
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
