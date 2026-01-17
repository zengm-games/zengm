import useTitleBar from "../../hooks/useTitleBar.tsx";
import type { View } from "../../../common/types.ts";
import SettingsForm from "./SettingsForm.tsx";
import { logEvent, toWorker } from "../../util/index.ts";
import { useBlocker } from "../../hooks/useBlocker.ts";

const Settings = ({ initialSettings }: View<"settings">) => {
	useTitleBar({ title: "League Settings" });

	const { setDirty } = useBlocker();

	return (
		<SettingsForm
			initialSettings={initialSettings}
			onUpdateExtra={() => {
				setDirty(true);
			}}
			onSave={async (settings) => {
				await toWorker("main", "updateGameAttributesGodMode", settings);

				setDirty(false);

				logEvent({
					type: "success",
					text: "League settings successfully updated.",
					saveToDb: false,
				});
			}}
		/>
	);
};

export default Settings;
