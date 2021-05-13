import { createNanoEvents } from "nanoevents";

export type Message = {
	id: number;
	message: string;
	title?: string;
	extraClass?: string;
	htmlIsSafe?: boolean;
	onClose?: () => void;
	persistent: boolean;
};

export const emitter =
	createNanoEvents<{
		notification: (message: Message) => void;
	}>();

let id = 0;

const notify = (
	message: string,
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

export default notify;
