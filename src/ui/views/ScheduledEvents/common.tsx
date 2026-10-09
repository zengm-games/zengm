import type { ReactNode } from "react";
import { PHASE_TEXT } from "../../../common/constants.ts";
import type { ScheduledEventsTeam } from "../../../common/scheduledEvents.ts";
import type {
	GameAttributesLeague,
	ScheduledEvent,
	View,
} from "../../../common/types.ts";
import { helpers } from "../../util/helpers.ts";
import { settings } from "../Settings/settings.tsx";

export type AugmentedScheduledEvent =
	View<"scheduledEvents">["scheduledEvents"][number];

// Props for the component for each type of scheduled event. onSave is only called with valid info, otherwise setError is called.
export type EditProps<Type extends ScheduledEvent["type"]> = {
	confs: GameAttributesLeague["confs"];
	divs: GameAttributesLeague["divs"];

	// Undefined when creating a new event
	event: Extract<AugmentedScheduledEvent, { type: Type }> | undefined;

	onCancel: () => void;
	onSave: (
		info: Extract<ScheduledEvent, { type: Type }>["info"],
	) => Promise<void>;
	saving: boolean;
	setError: (error: string | undefined) => void;

	// State of the teams right before this event will be processed
	teams: ScheduledEventsTeam[];
};

const godModeOptions: Partial<
	Record<(typeof settings)[number]["key"], (typeof settings)[number]>
> = {};
for (const option of settings) {
	godModeOptions[option.key] = option;
}

export const gameAttributeName = (key: string) => {
	if ((godModeOptions as any)[key]) {
		return (godModeOptions as any)[key].name;
	}

	if (key === "confs") {
		return "Conferences";
	}

	if (key === "divs") {
		return "Divisions";
	}

	if (key === "awards") {
		return "Awards";
	}

	return key;
};

export const formatPhase = (phase: number) => {
	const text = (PHASE_TEXT as Record<number, string | undefined>)[phase];
	return text === undefined ? "???" : helpers.upperCaseFirstLetter(text);
};

export const formatType = (type: ScheduledEvent["type"]) => {
	if (type === "contraction") {
		return "Contraction";
	}

	if (type === "expansionDraft") {
		return "Expansion";
	}

	if (type === "gameAttributes") {
		return "League settings";
	}

	if (type === "teamInfo") {
		return "Team info";
	}

	if (type === "retirePlayer") {
		return "Retire player";
	}

	if (type === "unretirePlayer") {
		return "Unretire player";
	}

	throw new Error("Invalid type");
};

export const formatTeamOption = (t: ScheduledEventsTeam) => {
	let text = `${t.region} ${t.name}`;
	if (t.future) {
		text += " (future expansion team)";
	}
	if (!t.active) {
		text += " (inactive)";
	}
	return text;
};

export const FormButtons = ({
	children,
	disabled,
	onCancel,
	saving,
}: {
	children?: ReactNode;
	disabled?: boolean;
	onCancel: () => void;
	saving: boolean;
}) => {
	return (
		<div className="d-flex align-items-center gap-2 mt-3">
			{children}
			<button
				className="btn btn-secondary ms-auto"
				type="button"
				disabled={saving}
				onClick={onCancel}
			>
				Cancel
			</button>
			<button
				className="btn btn-primary"
				type="submit"
				disabled={disabled || saving}
			>
				Save
			</button>
		</div>
	);
};
