import { Modal } from "./Modal.tsx";
import clsx from "clsx";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { helpers } from "../util/helpers.ts";
import { logEvent } from "../util/logEvent.ts";
import { toWorker } from "../util/toWorker.ts";
import { useLocalPartial } from "../util/local.ts";
import { HelpPopover } from "../components/HelpPopover.tsx";
import { RatingsStatsPopover } from "../components/RatingsStatsPopover/index.tsx";
import { Mood } from "../components/Mood.tsx";
import { PlayerPicture } from "../components/PlayerPicture.tsx";
import { useRef, useState } from "react";
import type api from "../../worker/api/index.ts";

type NegotaitionModalProps = Exclude<
	Awaited<ReturnType<typeof api.main.getNegotiationProps>>,
	string
>;

const SignButton = ({
	pid,
	amount,
	exp,
	disabledReason,
	onSuccess,
}: {
	pid: number;
	amount: number;
	exp: number;
	disabledReason: string | undefined;
	onSuccess: () => void;
}) => {
	const button = (
		<button
			className={`btn ${disabledReason !== undefined ? "btn-secondary" : "btn-success"}`}
			disabled={disabledReason !== undefined}
			onClick={async () => {
				const errorMessage = await toWorker(
					"main",
					"acceptContractNegotiation",
					{
						pid,
						amount: Math.round(amount * 1000),
						exp,
					},
				);
				if (errorMessage !== undefined) {
					logEvent({
						type: "error",
						text: errorMessage,
						saveToDb: false,
					});
				} else {
					onSuccess();
				}
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
	// position-fixed is for https://stackoverflow.com/a/75264190/786644 https://github.com/react-bootstrap/react-bootstrap/issues/6563 otherwise the scrollback flicker appears/disappears on desktop when the react-bootstrap Tooltip is shown. However this breaks if you scroll, but this page doesn't need to scroll.
	// Wrapper div around button is because otherwise there is no hover over the disabled button and no tooltip is shown.
	return (
		<OverlayTrigger
			overlay={<Tooltip className="position-fixed">{disabledReason}</Tooltip>}
		>
			<div>{button}</div>
		</OverlayTrigger>
	);
};

const widthStyle = { maxWidth: 575 };

const NegotiationHeader = ({
	capSpace,
	challengeNoRatings,
	payroll,
	p,
	resigning,
	salaryCap,
	salaryCapType,
	t,
}: Pick<
	NegotaitionModalProps,
	| "capSpace"
	| "challengeNoRatings"
	| "payroll"
	| "p"
	| "resigning"
	| "salaryCap"
	| "salaryCapType"
	| "t"
>) => {
	const { gender } = useLocalPartial(["gender"]);

	let message;
	if (salaryCapType === "soft") {
		if (resigning) {
			message = (
				<>
					You are allowed to go over the salary cap when re-signing players.{" "}
					<b>
						If you do not come to an agreement here,{" "}
						<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> will
						become a free agent.
					</b>{" "}
					{helpers.pronoun(gender, "He")} will then be able to sign with any
					team, and you won't be able to go over the salary cap to sign{" "}
					{helpers.pronoun(gender, "him")} unless{" "}
					{helpers.pronoun(gender, "he")}'s asking for a minimum contract.
				</>
			);
		} else {
			message =
				"You are not allowed to go over the salary cap to sign free agents, unless it's for a minimum contract.";
		}
	} else if (salaryCapType === "hard") {
		message =
			"You are not allowed to go over the salary cap to sign players, unless it's for a minimum contract.";
	}

	return (
		<>
			<div className="d-flex gap-2 mb-3" style={widthStyle}>
				<div
					style={{
						maxHeight: 90,
						width: 60,
						marginTop: p.imgURL ? 0 : -10,
					}}
					className="flex-shrink-0 d-flex justify-content-center align-items-center"
				>
					<PlayerPicture
						face={p.face}
						imgURL={p.imgURL}
						colors={t.colors}
						jersey={t.jersey}
						lazy
					/>
				</div>
				<div className="d-flex flex-column justify-content-end">
					<div className="d-flex flex-wrap gap-2">
						<h1 className="mb-0 text-nowrap">
							<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a>
						</h1>
						<div className="d-flex align-items-center">
							<Mood defaultType="user" p={p} />
							<RatingsStatsPopover pid={p.pid} defaultWatch={p.watch} />
						</div>
					</div>
					<div>
						{p.age} years old
						{!challengeNoRatings
							? `; Overall: ${p.ratings.ovr}; Potential: ${p.ratings.pot}`
							: null}
					</div>
					<div>
						{resigning ? "Re-signing" : "Free Agent"}
						{message ? (
							<HelpPopover className="ms-1">{message}</HelpPopover>
						) : null}
					</div>
				</div>
				<div className="ms-auto d-none d-sm-flex flex-column justify-content-end align-items-end text-nowrap">
					<div>Payroll: {helpers.formatCurrency(payroll, "M")}</div>
					{salaryCapType !== "none" ? (
						<>
							<div>Salary Cap: {helpers.formatCurrency(salaryCap, "M")}</div>
							<div>Cap Space: {helpers.formatCurrency(capSpace, "M")}</div>
						</>
					) : null}
				</div>
			</div>
		</>
	);
};

const Negotiation = ({
	contractOptions,
	close,
	p,
}: Pick<NegotaitionModalProps, "contractOptions" | "p"> & {
	close: () => void;
}) => {
	return (
		<>
			<div className="list-group" style={widthStyle}>
				{contractOptions.map((contract, i) => {
					return (
						<div
							key={i}
							className={clsx("d-flex align-items-center list-group-item", {
								"list-group-item-success": contract.smallestAmount,
							})}
						>
							<div className="flex-grow-1">
								<b>{helpers.formatCurrency(contract.amount, "M")}</b>/year for{" "}
								{contract.years} {helpers.plural("year", contract.years)}{" "}
								(through {contract.exp})
							</div>

							<SignButton
								pid={p.pid}
								amount={contract.amount}
								exp={contract.exp}
								disabledReason={contract.disabledReason}
								onSuccess={close}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};

export const NegotiationModal = ({
	close,
	negotiationProps,
	show,
}: {
	close: () => void;
	negotiationProps: NegotaitionModalProps | undefined;
	show: boolean;
}) => {
	return (
		<Modal show={show} onHide={close}>
			<Modal.Body>
				<button
					type="button"
					className="btn-close"
					aria-label="Close"
					onClick={close}
					style={{
						position: "absolute",
						top: 16,
						right: 16,
					}}
				></button>
				{negotiationProps ? (
					<>
						<NegotiationHeader {...negotiationProps} />
						<Negotiation {...negotiationProps} close={close} />
					</>
				) : null}
			</Modal.Body>
		</Modal>
	);
};

export const useNegotiaionModal = () => {
	const [state, setState] = useState<
		| {
				status: "loaded";
				props: NegotaitionModalProps;
				show: boolean;
		  }
		| {
				status: "init";
		  }
	>({
		status: "init",
	});

	const show = state.status === "loaded" && state.show;

	const loadingPid = useRef<number | undefined>(undefined);

	const props = {
		close: () => {
			if (show) {
				setState((state) => {
					if (state.status === "loaded") {
						return { ...state, show: false };
					}

					return state;
				});
			}
		},
		negotiationProps: state.status === "loaded" ? state.props : undefined,
		show,
	};

	return {
		negotiate: async (pid: number) => {
			loadingPid.current = pid;

			const newProps = await toWorker("main", "getNegotiationProps", pid);

			if (loadingPid.current !== pid) {
				// Must have clicked another button
				return;
			}

			if (typeof newProps === "string") {
				logEvent({
					type: "error",
					text: newProps,
					saveToDb: false,
				});
			} else {
				setState({
					status: "loaded",
					props: newProps,
					show: true,
				});
			}
		},
		props,
	};
};
