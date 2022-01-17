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
		<>
			<p>
				Find yourself making the same changes here in every league? Go to Tools
				&gt; Global Settings &gt; Default New League Settings and set them once
				for every league you make in the future.
			</p>
			<SettingsForm
				onSave={onSave}
				saveText={saveText}
				onCancel={onCancel}
				initialSettings={initial}
				newLeague
				hasPlayers={hasPlayers}
				realPlayers={realPlayers}
			/>
		</>
	);
};

export default CustomizeSettings;
