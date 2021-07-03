import { useState } from "react";
import { toWorker } from "../../util";

const GOATFormula = ({ formula }: { formula: string }) => {
	const [goatFormula, setGoatFormula] = useState(formula);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	return (
		<div className="row mb-3">
			<form
				className="col-6"
				onSubmit={async () => {
					setErrorMessage(undefined);

					try {
						await toWorker("main", "setGOATFormula", goatFormula);
					} catch (error) {
						setErrorMessage(error.message);
					}
				}}
			>
				<div className="form-group mb-2">
					<label htmlFor="goat-formula">GOAT Formula</label>
					<textarea
						className="form-control"
						id="goat-formula"
						rows={5}
						value={goatFormula}
						onChange={event => {
							setGoatFormula(event.target.value);
						}}
					/>
				</div>
				<button type="submit" className="btn btn-primary">
					Save
				</button>
				{errorMessage ? <p className="text-danger">{errorMessage}</p> : null}
			</form>
		</div>
	);
};

export default GOATFormula;
