import type { Settings } from "../../../worker/views/settings";
import SettingsForm from "../Settings/SettingsForm";

const CustomizeSettings = ({
	onCancel,
	onSave,
	initial,
}: {
	onCancel: () => void;
	onSave: (settings: Settings) => void;
	initial: Settings;
}) => {
	return (
		<SettingsForm
			onSave={onSave}
			saveText="Create League"
			onCancel={onCancel}
			{...initial}
			newLeague
		/>
	);
};

export default CustomizeSettings;
