import { useState } from "react";
import { bySport } from "../../../common";
import { getCols, toWorker } from "../../util";

const GOATFormula = ({
	awards,
	formula,
	stats,
}: {
	awards: Record<string, string>;
	formula: string;
	stats: string[];
}) => {
	const [goatFormula, setGoatFormula] = useState(formula);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const cols = getCols(...stats.map(stat => `stat:${stat}`));

	const exampleStat = bySport({
		basketball: "pts",
		football: "pssYds",
		hockey: "sv",
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
				<div className="form-group mb-2 overflow-auto">
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
					There are many variables available for the GOAT formula, for award
					counts and stats.
				</p>
				<details className="mb-3">
					<summary>Full list of award variables</summary>
					<ul
						className="list-unstyled mb-0"
						style={{
							columnWidth: 100,
						}}
					>
						{Object.entries(awards).map(([short, long]) => (
							<li key={short}>
								<abbr title={long}>{short}</abbr>
							</li>
						))}
					</ul>
				</details>
				<details className="mb-3">
					<summary>Full list of career total stat variables</summary>
					<ul
						className="list-unstyled mb-0"
						style={{
							columnWidth: 100,
						}}
					>
						{stats.map((stat, i) => (
							<li key={stat}>
								<abbr title={cols[i].desc}>{stat}</abbr>
							</li>
						))}
					</ul>
				</details>
				<p>
					Additionally, you can stick <code>Peak</code> at the end of any stat
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
					with very few games played are ignored for the career total variables.
				</p>
			</div>
		</div>
	);
};

export default GOATFormula;
