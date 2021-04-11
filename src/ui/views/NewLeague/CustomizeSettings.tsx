import type { Settings } from "../../../worker/views/settings";
import SettingsForm from "../Settings/SettingsForm";

const CustomizeSettings = ({
	onCancel,
	onSave,
	initial,
	saveText,
}: {
	onCancel: () => void;
	onSave: (settings: Settings) => void;
	initial: Settings;
	saveText: string;
}) => {
	return (
		<SettingsForm
			onSave={onSave}
			saveText={saveText}
			onCancel={onCancel}
			{...initial}
			newLeague
		/>
	);
};

export default CustomizeSettings;
