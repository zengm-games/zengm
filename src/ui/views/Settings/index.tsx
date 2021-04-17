import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import SettingsForm from "./SettingsForm";
import { logEvent, toWorker } from "../../util";

const Settings = (props: View<"settings">) => {
	useTitleBar({ title: "League Settings" });

	return (
		<SettingsForm
			{...props}
			onSave={async settings => {
				await toWorker("main", "updateGameAttributesGodMode", settings);
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
