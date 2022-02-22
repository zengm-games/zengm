import { forwardRef } from "react";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import classNames from "classnames";
import { SafeHtml } from "../../components";
import { ContractAmount } from "../../components/contract";
import type { HandleToggle } from ".";

const Summary = forwardRef(
	(
		{
			handleToggle,
			salaryCap,
			salaryCapType,
			summary,
		}: Pick<View<"trade">, "salaryCap" | "salaryCapType" | "summary"> & {
			handleToggle: HandleToggle;
		},
		ref: any,
	) => {
		return (
			<div className="row trade-items mb-3" ref={ref}>
				{summary.teams.map((t, i) => {
					const userOrOther = i === 0 ? "other" : ("user" as const);

					return (
						<div
							key={i}
							className={classNames("col-md-12 col-6 d-flex flex-column", {
								"mb-md-3": i === 0,
							})}
						>
							<h4 className="fw-bold mb-1">{t.name} receive:</h4>
							<ul className="list-unstyled mb-1">
								{summary.teams[t.other].trade.map(p => (
									<li key={`p${p.pid}`} className="d-flex">
										<div>
											<a href={helpers.leagueUrl(["player", p.pid])}>
												{p.name}
											</a>{" "}
											({<ContractAmount p={p} />})
										</div>
										<button
											type="button"
											className="btn-close ms-1"
											title="Remove player from trade"
											onClick={() => {
												handleToggle(userOrOther, "player", "include", p.pid);
											}}
										/>
									</li>
								))}
								{summary.teams[t.other].picks.map(pick => (
									<li key={pick.dpid} className="d-flex">
										<SafeHtml dirty={pick.desc} />
										<button
											type="button"
											className="btn-close ms-1"
											title="Remove pick from trade"
											onClick={() => {
												handleToggle(userOrOther, "pick", "include", pick.dpid);
											}}
										/>
									</li>
								))}
								{summary.teams[t.other].trade.length > 0 ? (
									<li className="mt-1">
										{helpers.formatCurrency(summary.teams[t.other].total, "M")}{" "}
										total
									</li>
								) : null}
								{summary.teams[t.other].trade.length === 0 &&
								summary.teams[t.other].picks.length === 0 ? (
									<li>Nothing</li>
								) : null}
							</ul>
							<p className="mt-auto mb-0">
								Payroll after trade:{" "}
								<span
									className={
										t.payrollAfterTrade > salaryCap ? "text-danger" : undefined
									}
								>
									{helpers.formatCurrency(t.payrollAfterTrade, "M")}
								</span>
							</p>
							{salaryCapType !== "none" ? (
								<p className="mb-0">
									Salary cap: {helpers.formatCurrency(salaryCap, "M")}
								</p>
							) : null}
						</div>
					);
				})}
			</div>
		);
	},
);

export default Summary;
