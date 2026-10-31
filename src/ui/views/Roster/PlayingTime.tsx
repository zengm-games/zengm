import { helpers } from "../../util/helpers.ts";
import { toWorker } from "../../util/toWorker.ts";
import type { NonEmptyArray, View } from "../../../common/types.ts";
import { showNotification } from "../../util/showNotification.ts";
import { last } from "../../../common/utils.ts";
import type { CSSProperties } from "react";

type Player = View<"roster">["players"][number];

export const ptModifiers: NonEmptyArray<{
	ptModifier: number;
	style: CSSProperties;
	text: string;
	title: string;
}> = [
	{
		ptModifier: 0,
		style: {
			backgroundColor: "#dc3545",
			color: "#fff",
		},
		text: "0",
		title: "No playing time",
	},
	{
		ptModifier: 0.75,
		style: {
			backgroundColor: "#ffc107",
			color: "#000",
		},
		text: "-",
		title: "Less playing time",
	},
	{
		ptModifier: 1,
		style: {
			backgroundColor: "rgb(204, 204, 204)",
			color: "#000",
		},
		text: " ",
		title: "Normal playing time",
	},
	{
		ptModifier: 1.25,
		style: {
			backgroundColor: "#17a2b8",
			color: "#fff",
		},
		text: "+",
		title: "More playing time",
	},
	{
		ptModifier: 1.5,
		style: {
			backgroundColor: "#007bff",
			color: "#fff",
		},
		text: "++",
		title: "Even more playing time",
	},
];

const PlayingTime = ({ p, userTid }: { p: Player; userTid: number }) => {
	const { ptModifier, style } =
		ptModifiers.find(({ ptModifier }) => ptModifier >= p.ptModifier) ??
		last(ptModifiers);

	return (
		<select
			className="form-select pt-modifier-select"
			value={ptModifier}
			onChange={async (event) => {
				const ptModifier = event.currentTarget.value;

				// NEVER UPDATE AI TEAMS
				// This shouldn't be necessary, but just in case...
				if (p.tid !== userTid) {
					return;
				}

				try {
					await toWorker("main", "updatePlayingTime", {
						pid: p.pid,
						ptModifier: helpers.localeParseFloat(ptModifier),
					});
				} catch (error) {
					// Reset if error
					showNotification({
						type: "error",
						text: `Error updating playing time: ${error.message}`,
					});
					throw error;
				}
			}}
			style={style}
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
