import { createNanoEvents } from "nanoevents";

export type Message = {
	id: number;
	message: string;
	title?: string;
	extraClass?: string;
	persistent: boolean;
};

export const emitter = createNanoEvents<{
	notification: (message: Message) => void;
}>();

let id = 0;

const notify = (
	message: string,
	title?: string,
	{
		extraClass,
		persistent = false,
	}: {
		extraClass?: string;
		persistent?: boolean;
	} = {},
) => {
	emitter.emit("notification", {
		id,
		message,
		title,
		extraClass,
		persistent,
	});

	id += 1;
};

export default notify;
