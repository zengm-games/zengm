import { useEffect, useState } from "react";
import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import type { View } from "../../../common/types.ts";
import { showNotification } from "../../util/showNotification.ts";

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
	1.5: {
		backgroundColor: "#007bff",
		color: "#fff",
	},
};

export const ptModifiers = [
	{ text: "0", ptModifier: "0", title: "No playing time" },
	{ text: "-", ptModifier: "0.75", title: "Less playing time" },
	{ text: " ", ptModifier: "1", title: "Normal playing time" },
	{ text: "+", ptModifier: "1.25", title: "More playing time" },
	{ text: "++", ptModifier: "1.5", title: "Even more playing time" },
] as const;

const PlayingTime = ({ p, userTid }: { p: Player; userTid: number }) => {
	const [value, setValue] = useState(() => {
		const index = ptModifiers.findIndex(
			({ ptModifier }) => helpers.localeParseFloat(ptModifier) > p.ptModifier,
		);
		let value;
		if (index === 0) {
			value = ptModifiers[0].ptModifier;
		} else if (index > 0) {
			value = ptModifiers[index - 1]!.ptModifier;
		} else {
			value = ptModifiers.at(-1)!.ptModifier;
		}
		return value;
	});

	// Keep synchronized with external changes, such as from the "Reset playing time" button
	useEffect(() => {
		setValue(p.ptModifier);
	}, [p]);

	return (
		<select
			className="form-select pt-modifier-select"
			value={value}
			onChange={async (event) => {
				const ptModifier = event.currentTarget.value;

				// NEVER UPDATE AI TEAMS
				// This shouldn't be necessary, but just in case...
				if (p.tid !== userTid) {
					return;
				}

				setValue(ptModifier as any);

				try {
					await toWorker("main", "updatePlayingTime", {
						pid: p.pid,
						ptModifier: helpers.localeParseFloat(ptModifier),
					});
				} catch (error) {
					// Reset if error
					setValue(value);
					showNotification({
						type: "error",
						text: `Error updating playing time: ${error.message}`,
					});
					throw error;
				}
			}}
			style={ptStyles[value]}
			aria-label="Playing time modifier"
		>
			{ptModifiers.map(({ text, ptModifier, title }) => {
				return (
					<option key={ptModifier} value={ptModifier} aria-label={title}>
						{text}
					</option>
				);
			})}
		</select>
	);
};

export default PlayingTime;
