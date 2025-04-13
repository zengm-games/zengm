import useTitleBar from "../../hooks/useTitleBar.tsx";
import type { View } from "../../../common/types.ts";
import SettingsForm from "./SettingsForm.tsx";
import { localActions, logEvent, toWorker } from "../../util/index.ts";
import { useEffect } from "react";

const Settings = ({ initialSettings }: View<"settings">) => {
	useTitleBar({ title: "League Settings" });

	useEffect(() => {
		localActions.update({
			dirtySettings: false,
		});
	}, []);

	return (
		<SettingsForm
			initialSettings={initialSettings}
			onUpdateExtra={() => {
				localActions.update({
					dirtySettings: true,
				});
			}}
			onSave={async (settings) => {
				await toWorker("main", "updateGameAttributesGodMode", settings);

				localActions.update({
					dirtySettings: false,
				});

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
