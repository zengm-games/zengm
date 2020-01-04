// @flow

import PropTypes from "prop-types";
import React, { useCallback } from "react";
import { helpers } from "../util";

type Props = {
	parts?: (number | string)[],
};

const NewWindowLink = ({ parts }: Props) => {
	const handleClick = useCallback(() => {
		const url = parts ? helpers.leagueUrl(parts) : document.URL;

		// Window name is set to the current time, so each window has a unique name and thus a new window is always opened
		window.open(
			`${url}?w=popup`,
			Date.now(),
			"height=600,width=800,scrollbars=yes",
		);
	}, [parts]);

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 272.8 272.9"
			alt="Open In New Window"
			className="new_window ml-1"
			title="Open In New Window"
			onClick={handleClick}
		>
			<path fill="none" stroke="#000" strokeWidth="20" d="M60 10h203v203H60z" />
			<path
				d="M107 171L216 55v75-75h-75"
				fill="none"
				stroke="#000"
				strokeWidth="30"
				strokeLinejoin="bevel"
			/>
			<path fill="#000" d="M205 40h26v15h-26z" />
			<path d="M10 50v223" fill="#000" stroke="#000" strokeWidth="20" />
			<path
				d="M10 263h213M1 60h60M213 220v46"
				fill="#000"
				stroke="#000"
				strokeWidth="20"
			/>
		</svg>
	);
};

NewWindowLink.propTypes = {
	parts: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	),
};

export default NewWindowLink;
