import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../util";
import { View } from "../../../common/types";

const Summary = ({
	accepted,
	message,
	salaryCap,
	summary,
}: Pick<View<"trade">, "salaryCap" | "summary"> & {
	accepted: boolean;
	message: null | string;
}) => {
	return (
		<>
			<div className="row">
				{summary.teams.map((t, i) => (
					<div key={i} className="col-md-12 col-6 mb-3">
						<h3>{t.name}</h3>
						<h4>Trade Away:</h4>
						<ul className="list-unstyled">
							{t.trade.map(p => (
								<li key={`p${p.pid}`}>
									<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
									{helpers.formatCurrency(p.contract.amount, "M")})
								</li>
							))}
							{t.picks.map(pick => (
								<li key={pick.dpid}>{pick.desc}</li>
							))}
							<li>{helpers.formatCurrency(t.total, "M")} Total</li>
						</ul>
						<h4>Receive:</h4>
						<ul className="list-unstyled">
							{summary.teams[t.other].trade.map(p => (
								<li key={`p${p.pid}`}>
									<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
									{helpers.formatCurrency(p.contract.amount, "M")})
								</li>
							))}
							{summary.teams[t.other].picks.map(pick => (
								<li key={pick.dpid}>{pick.desc}</li>
							))}
							<li>
								{helpers.formatCurrency(summary.teams[t.other].total, "M")}{" "}
								Total
							</li>
						</ul>
						<h4>
							Payroll after trade:{" "}
							{helpers.formatCurrency(t.payrollAfterTrade, "M")}
						</h4>
						<h4>Salary cap: {helpers.formatCurrency(salaryCap, "M")}</h4>
					</div>
				))}
			</div>

			{summary.warning ? (
				<p className="alert alert-danger">
					<strong>Warning!</strong> {summary.warning}
				</p>
			) : null}
			{message ? (
				<p
					className={classNames(
						"alert",
						accepted ? "alert-success" : "alert-info",
					)}
				>
					{message}
				</p>
			) : null}
		</>
	);
};
Summary.propTypes = {
	accepted: PropTypes.bool.isRequired,
	message: PropTypes.string,
	salaryCap: PropTypes.number.isRequired,
	summary: PropTypes.object.isRequired,
};

export default Summary;
