import useTitleBar from "../../hooks/useTitleBar.tsx";
import type { View } from "../../../common/types.ts";
import SettingsForm from "./SettingsForm.tsx";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
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

				showNotification({
					type: "success",
					text: "League settings successfully updated.",
				});
			}}
		/>
	);
};

export default Settings;
