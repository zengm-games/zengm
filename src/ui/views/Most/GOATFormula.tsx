import { useState } from "react";
import { bySport } from "../../../common/sportFunctions.ts";
import { toWorker } from "../../util/toWorker.ts";
import { getCols } from "../../../common/getCols.ts";
import { ActionButton } from "../../components/ActionButton.tsx";
import { helpers } from "../../util/helpers.ts";
import { FunctionDocs } from "../AwardSettings/Documentation.tsx";

const GOATFormula = ({
	customAwards,
	formula,
	oldAwards,
	simpleAwards,
	stats,
	type,
}: {
	customAwards: Record<string, string>;
	formula: string;
	oldAwards: Record<string, string>;
	simpleAwards: Record<string, string>;
	stats: string[];
	type: "career" | "season";
}) => {
	const [goatFormula, setGoatFormula] = useState(formula);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [submitting, setSubmitting] = useState(false);

	const cols = getCols(stats.map((stat) => `stat:${stat}`));

	const exampleStat = bySport({
		baseball: "hr",
		basketball: "pts",
		football: "pssYds",
		hockey: "sv",
	});

	return (
		<div className="row">
			<form
				className="col-md-6 mb-3"
				onSubmit={async (event) => {
					event.preventDefault();

					setErrorMessage(undefined);
					setSubmitting(true);

					try {
						await toWorker("main", "setGOATFormula", {
							formula: goatFormula,
							type,
						});
					} catch (error) {
						setErrorMessage(error.message);
					}
					setSubmitting(false);
				}}
			>
				<div className="mb-2 overflow-auto small-scrollbar">
					<label className="form-label" htmlFor="goat-formula">
						GOAT Formula
					</label>
					<textarea
						className="form-control"
						id="goat-formula"
						rows={5}
						value={goatFormula}
						onChange={(event) => {
							setGoatFormula(event.target.value);
						}}
					/>
				</div>
				<ActionButton
					type="submit"
					processing={submitting}
					processingText="Updating"
				>
					Save
				</ActionButton>
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
					<summary>Award variables</summary>
					<ul
						className="list-unstyled"
						style={{
							columnWidth: 100,
						}}
					>
						{Object.entries(simpleAwards).map(([short, long]) => (
							<li key={short}>
								<abbr className="font-monospace" title={long}>
									{short}
								</abbr>
							</li>
						))}
					</ul>
					<p>
						These variables are based on your current{" "}
						<a href={helpers.leagueUrl(["award_settings"])}>award settings</a>.
						If you had some other awards in past seasons, you can use those too
						in the same format, <code>award.ABBREV</code>.
					</p>
					<ul
						className="list-unstyled"
						style={{
							columnWidth: 100,
						}}
					>
						{Object.entries(customAwards).map(([short, long]) => (
							<li key={short}>
								<abbr className="font-monospace" title={long}>
									awards.{short}
								</abbr>
							</li>
						))}
					</ul>
					<p>
						These were the original award variables, and they still work, but
						with the new customizable awards feature you are better off using
						the above "award.X" variables instead because they support any
						customizations.
					</p>
					<ul
						className="list-unstyled mb-0"
						style={{
							columnWidth: 100,
						}}
					>
						{Object.entries(oldAwards).map(([short, long]) => (
							<li key={short}>
								<abbr className="font-monospace" title={long}>
									{short}
								</abbr>
							</li>
						))}
					</ul>
				</details>
				<details className="mb-3">
					<summary>Stat variables</summary>
					<ul
						className="list-unstyled"
						style={{
							columnWidth: 100,
						}}
					>
						{stats.map((stat, i) => (
							<li key={stat}>
								<abbr className="font-monospace" title={cols[i]!.desc}>
									{stat}
								</abbr>
							</li>
						))}
					</ul>
					<p>
						The above variables all are{" "}
						{type === "career" ? "career" : "season"} totals. If you want
						something besides {type === "career" ? "career" : "season"} totals,
						you can put any of these suffixes at the end of a stat, such as{" "}
						<code>{exampleStat}PerGame</code>.
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
						{type === "career" ? (
							<>
								<li>
									<code>Peak</code> - total value of stat's single season peak
								</li>
								<li>
									<code>PeakPerGame</code> - per-game value of stat's single
									season peak
								</li>
							</>
						) : null}
					</ul>
					{type === "career" ? (
						<p>
							Seasons with very few games played are ignored for the{" "}
							<code>Peak</code> and <code>PeakPerGame</code> variables, and
							careers with very few games played are ignored for the career
							total variables.
						</p>
					) : (
						<p>Seasons with very few games played are ignored.</p>
					)}
				</details>
				<details className="mb-3">
					<summary>Functions</summary>

					<FunctionDocs />
				</details>
			</div>
		</div>
	);
};

export default GOATFormula;
