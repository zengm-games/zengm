import { useState } from "react";
import { bySport } from "../../../common";
import { getCols, toWorker } from "../../util";

const GOATFormula = ({
	formula,
	stats,
}: {
	formula: string;
	stats: string[];
}) => {
	const [goatFormula, setGoatFormula] = useState(formula);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const cols = getCols(...stats.map(stat => `stat:${stat}`));

	const exampleStat = bySport({
		basketball: "pts",
		football: "pssYds",
	});

	return (
		<div className="row">
			<form
				className="col-md-6 mb-3"
				onSubmit={async event => {
					event.preventDefault();

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
				{errorMessage ? (
					<p className="text-danger mt-3">{errorMessage}</p>
				) : null}
			</form>
			<div className="col-md-6">
				<p>
					There are many variables available for the GOAT formula. First, all of
					these are available, containing career total values:
				</p>
				<ul
					className="list-unstyled"
					style={{
						columnCount: 2,
					}}
				>
					{stats.map((stat, i) => (
						<li key={stat}>
							<code>{stat}</code>: {cols[i].desc}
						</li>
					))}
				</ul>
				<p>
					Additionally, you can stick <code>Peak</code> at the end of any
					variable to get the single season peak total value, and{" "}
					<code>PeakPerGame</code> to get the single season peak per-game value.
					For example, <code>{exampleStat}Peak</code> or{" "}
					<code>{exampleStat}PeakPerGame</code>.
				</p>
				<p>
					What if you want the career per game average? There is not a special
					variable for that, just do <code>{exampleStat}/gp</code>.
				</p>
				<p>
					Seasons with very few games played are ignored for the{" "}
					<code>Peak</code> and <code>PeakPerGame</code> variables, and careers
					iwth very few games played are ignored for the career total variables.
				</p>
			</div>
		</div>
	);
};

export default GOATFormula;
