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

	const cols = getCols(stats.map(stat => `stat:${stat}`));

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
				<div className="mb-2 overflow-auto">
					<label className="form-label" htmlFor="goat-formula">
						GOAT Formula
					</label>
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
					<p className="text-danger mt-2 mb-0">{errorMessage}</p>
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
								<abbr className="font-monospace" title={long}>
									{short}
								</abbr>
							</li>
						))}
					</ul>
				</details>
				<details className="mb-3">
					<summary>Full list of stat variables</summary>
					<ul
						className="list-unstyled"
						style={{
							columnWidth: 100,
						}}
					>
						{stats.map((stat, i) => (
							<li key={stat}>
								<abbr className="font-monospace" title={cols[i].desc}>
									{stat}
								</abbr>
							</li>
						))}
					</ul>
					<p>
						The above variables all are career totals. If you want something
						besides career totals, you can put any of these suffixes at the end
						of a stat, such as <code>{exampleStat}PerGame</code>.
					</p>
					<ul className="list-unstyled">
						<li>
							<code>PerGame</code> - per game stat
						</li>
						<li>
							<code>Playoffs</code> - career total playoff stat
						</li>
						<li>
							<code>PlayoffsPerGame</code> - per game playoff stat
						</li>
						<li>
							<code>Peak</code> - total value of stat's single season peak
						</li>
						<li>
							<code>PeakPerGame</code> - per-game value of stat's single season
							peak
						</li>
					</ul>
					<p>
						Seasons with very few games played are ignored for the{" "}
						<code>Peak</code> and <code>PeakPerGame</code> variables, and
						careers with very few games played are ignored for the career total
						variables.
					</p>
				</details>
			</div>
		</div>
	);
};

export default GOATFormula;
