import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import SettingsForm from "./SettingsForm";
import { localActions, logEvent, toWorker } from "../../util";
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
			onSave={async settings => {
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
