import type { Settings } from "../../../worker/views/settings";
import SettingsForm from "../Settings/SettingsForm";

const CustomizeSettings = ({
	onCancel,
	onSave,
	initial,
	saveText,
	hasPlayers,
	realPlayers,
}: {
	onCancel: () => void;
	onSave: (settings: Settings) => void;
	initial: Settings;
	saveText: string;
	hasPlayers: boolean;
	realPlayers: boolean;
}) => {
	return (
		<SettingsForm
			onSave={onSave}
			saveText={saveText}
			onCancel={onCancel}
			{...initial}
			newLeague
			hasPlayers={hasPlayers}
			realPlayers={realPlayers}
		/>
	);
};

export default CustomizeSettings;
