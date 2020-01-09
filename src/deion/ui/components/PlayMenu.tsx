import PropTypes from "prop-types";
import React, { useEffect } from "react";
import DropdownItem from "reactstrap/lib/DropdownItem";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import { realtimeUpdate, toWorker } from "../util";

const handleOptionClick = (option, event) => {
	if (!option.url) {
		event.preventDefault();
		toWorker(`actions.playMenu.${option.id}`);
	}
};

type Props = {
	lid: number | void;
	options: {
		id: string;
		label: string;
		url?: string;
		key?: string;
	}[];
};
const keyCodes = {
	"65": "a",
	"68": "d",
	"76": "l",
	"77": "m",
	"80": "p",
	"83": "s",
	"87": "w",
	"89": "y",
};

const PlayMenu = ({ lid, options }: Props) => {
	useEffect(() => {
		const handleKeyup = (event: SyntheticKeyboardEvent) => {
			// alt + letter
			if (event.altKey && keyCodes[event.keyCode]) {
				const option = options.find(
					option2 => option2.key === keyCodes[event.keyCode],
				);

				if (!option) {
					return;
				}

				if (option.url) {
					realtimeUpdate([], option.url);
				} else {
					toWorker(`actions.playMenu.${option.id}`);
				}
			}
		}; // $FlowFixMe

		document.addEventListener("keyup", handleKeyup);
		return () => {
			// $FlowFixMe
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
