import PropTypes from "prop-types";
import React, { useEffect, MouseEvent } from "react";
import NavDropdown from "react-bootstrap/NavDropdown";
import { realtimeUpdate, toWorker } from "../util";
import type { Option } from "../../common/types";

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
		const handleKeydown = (event: KeyboardEvent) => {
			// alt + letter
			if (
				event.altKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!event.metaKey
			) {
				const option = options.find(option2 => option2.code === event.code);

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

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [options]);

	if (lid === undefined) {
		return null;
	}

	return (
		<NavDropdown className="play-button" id="play-button" title="Play">
			{options.map((option, i) => {
				return (
					<NavDropdown.Item
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
					</NavDropdown.Item>
				);
			})}
		</NavDropdown>
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
