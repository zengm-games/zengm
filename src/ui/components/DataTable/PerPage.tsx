const PerPage = ({
	onChange,
	value,
}: {
	onChange: (perPage: number) => void;
	value: number;
}) => {
	return (
		<div className="datatable-perpage">
			<label className="form-label">
				<select
					className="form-select form-select-sm"
					onChange={(event) => {
						const perPage = Number.parseInt(event.currentTarget.value);
						if (!Number.isNaN(perPage)) {
							onChange(perPage);
						}
					}}
					value={value}
				>
					<option value="10">10</option>
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>{" "}
				per page
			</label>
		</div>
	);
};

export default PerPage;
