import { forwardRef } from "react";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import classNames from "classnames";

const Summary = forwardRef(
	(
		{ salaryCap, summary }: Pick<View<"trade">, "salaryCap" | "summary">,
		ref: any,
	) => {
		return (
			<div className="row trade-items mb-3" ref={ref}>
				{summary.teams.map((t, i) => (
					<div
						key={i}
						className={classNames("col-md-12 col-6 d-flex flex-column", {
							"mb-md-3": i === 0,
						})}
					>
						<h4 className="font-weight-bold mb-1">{t.name} receive:</h4>
						<ul className="list-unstyled mb-1">
							{summary.teams[t.other].trade.map(p => (
								<li key={`p${p.pid}`}>
									<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
									{helpers.formatCurrency(p.contract.amount, "M")})
								</li>
							))}
							{summary.teams[t.other].picks.map(pick => (
								<li key={pick.dpid}>{pick.desc}</li>
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
						<p className="mb-0">
							Salary cap: {helpers.formatCurrency(salaryCap, "M")}
						</p>
					</div>
				))}
			</div>
		);
	},
);

export default Summary;
