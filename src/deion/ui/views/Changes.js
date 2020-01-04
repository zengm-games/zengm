// @flow

import PropTypes from "prop-types";
import React from "react";
import { NewWindowLink, SafeHtml } from "../components";
import { setTitleBar } from "../util";

const Changes = ({ changes }: { changes: { date: string, msg: string }[] }) => {
	setTitleBar({ title: "Changes" });

	return (
		<>
			<p>
				Only fairly significant user-facing changes are listed here, so you
				won't get bugged for every little new feature.
			</p>

			<ul>
				{changes.map((c, i) => {
					return (
						<li key={i}>
							<b>{c.date}</b>: <SafeHtml dirty={c.msg} />
						</li>
					);
				})}
			</ul>
		</>
	);
};
Changes.propTypes = {
	changes: PropTypes.arrayOf(
		PropTypes.shape({
			date: PropTypes.string.isRequired,
			msg: PropTypes.string.isRequired,
		}),
	),
};

export default Changes;
