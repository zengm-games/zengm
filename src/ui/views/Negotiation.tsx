import clsx from "clsx";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import useTitleBar from "../hooks/useTitleBar";
import {
	helpers,
	logEvent,
	realtimeUpdate,
	toWorker,
	useLocalPartial,
} from "../util";
import type { View } from "../../common/types";
import { Mood, RatingsStatsPopover } from "../components";
import { isSport } from "../../common";

// Show the negotiations list if there are more ongoing negotiations
const redirectNegotiationOrRoster = async (cancelled: boolean) => {
	const count = await toWorker("main", "countNegotiations", undefined);
	if (count > 0) {
		realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
	} else if (cancelled || isSport("football")) {
		// After signing player in football, go back to free agents screen, cause you probably need more
		realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
	} else {
		realtimeUpdate([], helpers.leagueUrl(["roster"]));
	}
};

const cancel = async (pid: number) => {
	await toWorker("main", "cancelContractNegotiation", pid);
	redirectNegotiationOrRoster(true);
};

const SignButton = ({
	pid,
	amount,
	exp,
	disabledReason,
}: {
	pid: number;
	amount: number;
	exp: number;
	disabledReason: string | undefined;
}) => {
	const button = (
		<button
			className={`btn ${disabledReason !== undefined ? "btn-secondary" : "btn-success"}`}
			disabled={disabledReason !== undefined}
			onClick={async () => {
				const errorMsg = await toWorker("main", "acceptContractNegotiation", {
					pid: pid,
					amount: Math.round(amount * 1000),
					exp,
				});
				if (errorMsg !== undefined && errorMsg) {
					logEvent({
						type: "error",
						text: errorMsg,
						saveToDb: false,
					});
				}
				redirectNegotiationOrRoster(false);
			}}
		>
			Sign
			<span className="d-none d-sm-inline"> Contract</span>
		</button>
	);

	if (disabledReason === undefined) {
		return button;
	}

	// CSS/HTML hacks!
	// position-fixed is for https://stackoverflow.com/a/75264190/786644 otherwise the scrollback flicker appears/disappears on desktop when the react-bootstrap Tooltip is shown.
	// Wrapper div around button is because otherwise there is no hover over the disabled button and no tooltip is shown.
	return (
		<OverlayTrigger
			overlay={<Tooltip className="position-fixed">{disabledReason}</Tooltip>}
		>
			<div>{button}</div>
		</OverlayTrigger>
	);
};

const Negotiation = ({
	capSpace,
	contractOptions,
	payroll,
	p,
	resigning,
	salaryCap,
	salaryCapType,
}: View<"negotiation">) => {
	useTitleBar({ title: "Contract Negotiation" });

	const { gender } = useLocalPartial(["gender"]);

	let message;
	if (resigning && salaryCapType === "soft") {
		message = (
			<>
				You are allowed to go over the salary cap to make this deal because you
				are re-signing{" "}
				<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> to a
				contract extension.{" "}
				<b>
					If you do not come to an agreement here,{" "}
					<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> will
					become a free agent.
				</b>{" "}
				{helpers.pronoun(gender, "He")} will then be able to sign with any team,
				and you won't be able to go over the salary cap to sign{" "}
				{helpers.pronoun(gender, "him")}.
			</>
		);
	} else if (salaryCapType !== "none") {
		const extra =
			salaryCapType === "soft" ? (
				<>
					{" "}
					because <a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> is
					a free agent
				</>
			) : null;

		message = (
			<>
				You are not allowed to go over the salary cap to make this deal (unless
				it is for a minimum contract){extra}.
			</>
		);
	}

	return (
		<>
			<div className="row">
				<div className="col-sm-10 col-md-8 col-lg-6">
					<h1 className="d-flex mb-3">
						<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>
						<div className="ms-2 fs-6 d-flex align-items-center">
							<Mood defaultType="user" p={p} />
							<RatingsStatsPopover pid={p.pid} />
						</div>
					</h1>
					<div className="list-group">
						{contractOptions.map((contract, i) => {
							return (
								<div
									key={i}
									className={clsx("d-flex align-items-center list-group-item", {
										"list-group-item-success": contract.smallestAmount,
									})}
								>
									<div className="flex-grow-1">
										{helpers.formatCurrency(contract.amount, "M")} per year
										<span className="d-none d-sm-inline">
											, through {contract.exp}
										</span>{" "}
										({contract.years} {helpers.plural("season", contract.years)}
										)
									</div>

									<SignButton
										pid={p.pid}
										amount={contract.amount}
										exp={contract.exp}
										disabledReason={contract.disabledReason}
									/>
								</div>
							);
						})}
					</div>

					<div className="mt-3">
						{resigning ? (
							<a
								className="btn btn-secondary"
								href={helpers.leagueUrl(["negotiation"])}
							>
								Return to Re-Sign Players page
							</a>
						) : (
							<button className="btn btn-danger" onClick={() => cancel(p.pid)}>
								Can't reach a deal? End negotiation
							</button>
						)}
					</div>

					<div className="d-flex justify-content-between mt-5">
						<div>Current Payroll: {helpers.formatCurrency(payroll, "M")}</div>
						{salaryCapType !== "none" ? (
							<>
								<div>Salary Cap: {helpers.formatCurrency(salaryCap, "M")}</div>
								<div>Cap Space: {helpers.formatCurrency(capSpace, "M")}</div>
							</>
						) : null}
					</div>
				</div>
			</div>

			{message ? <div className="mt-5">{message}</div> : null}
		</>
	);
};

export default Negotiation;
