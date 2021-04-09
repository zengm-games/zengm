import useTitleBar from "../../hooks/useTitleBar";
import type { View } from "../../../common/types";
import SettingsForm from "./SettingsForm";

const Settings = (props: View<"settings">) => {
	useTitleBar({ title: "League Settings" });

	return <SettingsForm {...props} />;
};

export default Settings;
