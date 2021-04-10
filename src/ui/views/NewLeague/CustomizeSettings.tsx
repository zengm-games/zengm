import type { Settings } from "../../../worker/views/settings";
import SettingsForm from "../Settings/SettingsForm";

const CustomizeSettings = ({
	onCancel,
	onSave,
	initial,
	getDefault,
}: {
	onCancel: () => void;
	onSave: (settings: Settings) => void;
	initial: Settings;
	getDefault: () => Settings;
}) => {
	return <SettingsForm onSave={onSave} {...initial} />;
};

export default CustomizeSettings;
