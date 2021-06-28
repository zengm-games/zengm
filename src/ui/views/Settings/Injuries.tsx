import { godModeRequiredMessage } from "./SettingsForm";

const Injuries = ({
	disabled,
	godModeRequired,
}: {
	disabled: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
}) => {
	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;
	return (
		<button
			className="btn btn-secondary"
			type="button"
			disabled={disabled}
			title={title}
		>
			Customize
		</button>
	);
};

export default Injuries;
