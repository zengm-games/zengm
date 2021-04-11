import type { Settings } from "../../../worker/views/settings";
import SettingsForm from "../Settings/SettingsForm";

const CustomizeSettings = ({
	onCancel,
	onSave,
	initial,
	saveText,
	hasPlayers,
}: {
	onCancel: () => void;
	onSave: (settings: Settings) => void;
	initial: Settings;
	saveText: string;
	hasPlayers: boolean;
}) => {
	return (
		<SettingsForm
			onSave={onSave}
			saveText={saveText}
			onCancel={onCancel}
			{...initial}
			newLeagueType={hasPlayers ? "newLeagueWithPlayers" : "newLeague"}
		/>
	);
};

export default CustomizeSettings;
