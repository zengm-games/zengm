import React from "react";

const CustomizeTeams = ({
	onCancel,
	onSave,
}: {
	onCancel: () => void;
	onSave: (teams: any[]) => void;
}) => {
	return (
		<>
			<h1>Customize Teams</h1>
			<form
				onSubmit={() => {
					onSave([]);
				}}
			>
				<button className="btn btn-primary mr-2" type="submit">
					Save Teams
				</button>
				<button className="btn btn-secondary" type="button" onClick={onCancel}>
					Cancel
				</button>
			</form>
		</>
	);
};

export default CustomizeTeams;
