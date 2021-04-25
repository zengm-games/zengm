const EditInfoContraction = ({
	tid,
	onChange,
	teams,
}: {
	tid: number;
	onChange: (tid: number) => void;
	teams: {
		tid: number;
		region: string;
		name: string;
		disabled: boolean;
		future: boolean;
	}[];
}) => {
	const availableTeams = teams.filter(t => !t.disabled);

	return (
		<div className="row">
			<div className="form-group col-6">
				<label htmlFor="contraction-tid">Team</label>
				<select
					id="contraction-tid"
					className="form-control"
					onChange={event => {
						const tid = parseInt(event.target.value);
						onChange(tid);
					}}
					value={tid}
				>
					{availableTeams.map(t => (
						<option key={t.tid} value={t.tid}>
							{t.region} {t.name}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

export default EditInfoContraction;
