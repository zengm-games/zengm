import { createNanoEvents } from "nanoevents";
import type { ReactNode } from "react";

export type Message = {
	id: number;
	message: ReactNode;
	title?: string;
	extraClass?: string;
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
		onClose,
		persistent = false,
	}: {
		extraClass?: string;
		onClose?: () => void;
		persistent?: boolean;
	} = {},
) => {
	emitter.emit("notification", {
		id,
		message,
		title,
		extraClass,
		onClose,
		persistent,
	});

	id += 1;
};
