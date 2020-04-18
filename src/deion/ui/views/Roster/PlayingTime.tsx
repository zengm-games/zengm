import PropTypes from "prop-types";
import React, { ChangeEvent } from "react";
import { toWorker } from "../../util";
import type { View } from "../../../common/types";

type Player = View<"roster">["players"][number];

export const ptStyles = {
	0: {
		backgroundColor: "#dc3545",
		color: "#fff",
	},
	0.75: {
		backgroundColor: "#ffc107",
		color: "#000",
	},
	1: {
		backgroundColor: "rgb(204, 204, 204)",
		color: "#000",
	},
	1.25: {
		backgroundColor: "#17a2b8",
		color: "#fff",
	},
	1.75: {
		backgroundColor: "#007bff",
		color: "#fff",
	},
};

const handlePtChange = async (
	p: Player,
	userTid: number,
	event: ChangeEvent<HTMLSelectElement>,
) => {
	const ptModifier = parseFloat(event.currentTarget.value);

	if (Number.isNaN(ptModifier)) {
		return;
	}

	// NEVER UPDATE AI TEAMS
	// This shouldn't be necessary, but just in case...
	if (p.tid !== userTid) {
		return;
	}

	await toWorker("main", "updatePlayingTime", p.pid, ptModifier);
};

const PlayingTime = ({ p, userTid }: { p: Player; userTid: number }) => {
	const ptModifiers = [
		{ text: "0", ptModifier: "0" },
		{ text: "-", ptModifier: "0.75" },
		{ text: " ", ptModifier: "1" },
		{ text: "+", ptModifier: "1.25" },
		{ text: "++", ptModifier: "1.75" },
	];

	return (
		<select
			className="form-control pt-modifier-select"
			value={p.ptModifier}
			onChange={event => handlePtChange(p, userTid, event)}
			style={(ptStyles as any)[String(p.ptModifier)]}
		>
			{ptModifiers.map(({ text, ptModifier }) => {
				return (
					<option key={ptModifier} value={ptModifier}>
						{text}
					</option>
				);
			})}
		</select>
	);
};

PlayingTime.propTypes = {
	p: PropTypes.object.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayingTime;
