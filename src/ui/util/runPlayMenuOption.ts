import { confirm } from "./confirm.tsx";
import { toWorker } from "./toWorker.ts";

// Every way of picking a play menu option (the menu, its keyboard shortcuts, the command palette) goes through here, so an option that needs confirmation gets it however it was picked. Confirmation happens here rather than in the worker, so the worker never waits on the user in the middle of league work.
export const runPlayMenuOption = async (id: string) => {
	if (id === "untilFreeAgency") {
		const warning = await toWorker(
			"main",
			"getUntilFreeAgencyWarning",
			undefined,
		);
		if (warning !== undefined) {
			const proceed = await confirm(warning, {
				okText: "Proceed",
			});
			if (!proceed) {
				return;
			}
		}
	}

	await toWorker("playMenu", id as any, undefined);
};
