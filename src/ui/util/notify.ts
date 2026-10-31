import { createNanoEvents } from "nanoevents";
import type { ReactNode } from "react";
import type { LogEventType } from "../../common/types.ts";

export type Message = {
	id: number;
	message: ReactNode;
	title?: string;
	extraClass?: string;
	onClose?: () => void;
	persistent: boolean;
	type: LogEventType;
};

export const emitter = createNanoEvents<{
	notification: (message: Message) => void;
}>();

let id = 0;

export const notify = (
	message: ReactNode,
	title: string | undefined,
	{
		extraClass,
		onClose,
		persistent = false,
		type,
	}: {
		extraClass?: string;
		onClose?: () => void;
		persistent?: boolean;
		type: LogEventType;
	},
) => {
	emitter.emit("notification", {
		id,
		message,
		title,
		extraClass,
		onClose,
		persistent,
		type,
	});

	id += 1;
};
