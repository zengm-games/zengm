import { useEffect, MouseEvent, forwardRef } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { confirm, local, realtimeUpdate, toWorker } from "../util";
import type { Option } from "../../common/types";
import classNames from "classnames";

type Props = {
	lid: number | undefined;
	spectator: boolean;
	options: Option[];
};

const handleOptionClick = (option: Option, event: MouseEvent) => {
	if (!option.url) {
		event.preventDefault();
		toWorker("playMenu", option.id as any, undefined);
	}
};

const PlayMenu = forwardRef(({ lid, spectator, options }: Props, ref) => {
	useEffect(() => {
		const handleKeydown = async (event: KeyboardEvent) => {
			// alt + letter
			if (
				event.altKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!event.metaKey
			) {
				const key = event.key.toLowerCase();
				const option = options.find(option2 => option2.key === key);

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

	return (
		<Dropdown
			className={`play-button-wrapper${
				window.mobile ? " dropdown-mobile" : ""
			}`}
			as={Nav.Item}
			ref={ref}
		>
			<Dropdown.Toggle
				className={classNames(
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
								<span className="text-muted kbd">
									Alt+{option.key.toUpperCase()}
								</span>
							) : null}
						</Dropdown.Item>
					);
				})}
			</Dropdown.Menu>
		</Dropdown>
	);
});

export default PlayMenu;
