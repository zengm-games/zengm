import { createNanoEvents } from "nanoevents";
import type { ReactNode } from "react";

export type Message = {
	id: number;
	message: ReactNode;
	title?: string;
	extraClass?: string;
	htmlIsSafe?: boolean;
	onClose?: () => void;
	persistent: boolean;
};

export const emitter = createNanoEvents<{
	notification: (message: Message) => void;
}>();

let id = 0;

export const notify = (
	message: ReactNode,
	title?: string,
	{
		extraClass,
		htmlIsSafe,
		onClose,
		persistent = false,
	}: {
		extraClass?: string;
		htmlIsSafe?: boolean;
		onClose?: () => void;
		persistent?: boolean;
	} = {},
) => {
	emitter.emit("notification", {
		id,
		message,
		title,
		extraClass,
		htmlIsSafe,
		onClose,
		persistent,
	});

	id += 1;
};
