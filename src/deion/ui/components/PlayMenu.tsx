import PropTypes from "prop-types";
import React, { useEffect, MouseEvent } from "react";
import {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	UncontrolledDropdown,
} from "reactstrap";

import { realtimeUpdate, toWorker } from "../util";

type Option = {
	id: string;
	label: string;
	url?: string;
	key?: string;
};

type Props = {
	lid: number | undefined;
	options: Option[];
};

const handleOptionClick = (option: Option, event: MouseEvent) => {
	if (!option.url) {
		event.preventDefault();
		toWorker("playMenu", option.id as any);
	}
};

const PlayMenu = ({ lid, options }: Props) => {
	useEffect(() => {
		const handleKeyup = (event: KeyboardEvent) => {
			// alt + letter
			if (
				event.altKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!event.metaKey
			) {
				const option = options.find(
					// https://github.com/microsoft/TypeScript/issues/21732
					// @ts-ignore
					option2 => option2.key === event.key,
				);

				if (!option) {
					return;
				}

				if (option.url) {
					realtimeUpdate([], option.url);
				} else {
					toWorker("playMenu", option.id as any);
				}
			}
		};

		document.addEventListener("keyup", handleKeyup);
		return () => {
			document.removeEventListener("keyup", handleKeyup);
		};
	}, [options]);

	if (lid === undefined) {
		return null;
	}

	return (
		<UncontrolledDropdown nav inNavbar>
			<DropdownToggle nav caret className="play-button">
				Play
			</DropdownToggle>
			<DropdownMenu>
				{options.map((option, i) => {
					return (
						<DropdownItem
							key={i}
							href={option.url}
							onClick={event => handleOptionClick(option, event)}
							className="kbd-parent"
						>
							{option.label}
							{option.key ? (
								<span className="text-muted kbd">
									Alt+{option.key.toUpperCase()}
								</span>
							) : null}
						</DropdownItem>
					);
				})}
			</DropdownMenu>
		</UncontrolledDropdown>
	);
};

PlayMenu.propTypes = {
	lid: PropTypes.number,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
			url: PropTypes.string,
			key: PropTypes.string,
		}),
	).isRequired,
};

export default PlayMenu;
