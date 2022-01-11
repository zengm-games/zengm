import { SPORT_HAS_REAL_PLAYERS } from "../../../common";

const DefaultNewLeagueSettings = () => {
	return (
		<>
			<h2>Default New League Settings</h2>

			<p>Here you can override the normal default settings for new leagues.</p>

			<p>
				If you set a setting here, it will only apply in a new league that does
				not have that setting specified. So if you are uploading an exported
				league containing league settings, it will not be changed by whatever
				you specify here.
				{SPORT_HAS_REAL_PLAYERS
					? " Also, real players leagues have some non-default settings already applied, and those will also not be altered by your specified defaults."
					: null}
			</p>
		</>
	);
};

export default DefaultNewLeagueSettings;
