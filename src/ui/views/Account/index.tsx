import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
	ACCOUNT_API_URL,
	STRIPE_PUBLISHABLE_KEY,
} from "../../../common/constants.ts";
import useTitleBar from "../../hooks/useTitleBar.tsx";
import { toWorker } from "../../util/toWorker.ts";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import type { View } from "../../../common/types.ts";
import { GoldPitchText } from "../../components/GoldPitchText.tsx";
import { ajaxErrorMsg } from "../LoginOrRegister/index.tsx";
import AccountInfoForm from "./AccountInfoForm.tsx";
import DeleteAccountForm from "./DeleteAccountForm.tsx";
import { getScript } from "../../util/getScript.ts";
import { confirm } from "../../util/confirm.tsx";
import { fetchWrapper } from "../../../common/fetchWrapper.ts";
import { TEXT_MAX_WIDTH } from "../AwardSettings/Documentation.tsx";
import {
	ActionButton,
	ProcessingSpinner,
} from "../../components/ActionButton.tsx";

// Calls one of the gold_*.php APIs and then refreshes the account page to show the result. Resolves after the page has refreshed, so callers can show a processing state until then.
const goldRequest = async (
	api: "gold_start" | "gold_cancel",
	data: Record<string, string>,
) => {
	let goldResult;
	try {
		goldResult = await fetchWrapper({
			url: `${ACCOUNT_API_URL}/${api}.php`,
			method: "POST",
			data: {
				sport: __SPORT,
				...data,
			},
			credentials: "include",
		});
	} catch (error) {
		console.error(error);
		goldResult = {
			success: false,
			message: ajaxErrorMsg,
		};
	}

	if (api === "gold_start" && goldResult.success) {
		await toWorker("main", "initGold", undefined);
	}

	await realtimeUpdate(["account"], "/account", {
		goldResult,
	});
};

const StripeButton = ({ email }: { email: string }) => {
	const [handler, setHandler] = useState<StripeCheckoutHandler | undefined>();

	// From when Stripe Checkout returns a token until the account page is refreshed with the result, which can take several seconds
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		(async () => {
			if (!window.StripeCheckout) {
				await getScript("https://checkout.stripe.com/checkout.js");
			}

			setHandler(
				window.StripeCheckout.configure({
					key: STRIPE_PUBLISHABLE_KEY,
					image: "/ico/icon128.png",
					token: async (token) => {
						setProcessing(true);
						await goldRequest("gold_start", { token: token.id });
						setProcessing(false);
					},
				}),
			);
		})();
	}, []);

	const handleClick = () => {
		if (handler) {
			handler.open({
				name: "ZenGM Gold",
				description: "",
				amount: 500,
				email,
				allowRememberMe: false,
				panelLabel: "Subscribe for $5/month",
			});
		}
	};

	return (
		<>
			<ActionButton
				size="lg"
				disabled={!handler}
				onClick={handleClick}
				processing={processing}
				processingText="Processing payment"
			>
				Subscribe to ZenGM Gold - $5/month
			</ActionButton>
			{processing ? (
				<p className="text-body-secondary mt-2 mb-0">
					This can take a few seconds, please don't leave this page.
				</p>
			) : null}
			<div className="alert alert-info mt-3 mb-0">
				If you would rather make a single payment rather than subscribe, send
				money by{" "}
				<a href="https://paypal.me/zengmgames" className="fw-bold">
					PayPal to jeremy@zengm.com
				</a>{" "}
				and include your username in the message. I will then manually credit
				your account with however many months you pay for.
			</div>
		</>
	);
};

const UserInfo = ({
	goldUntilDateString,
	loggedIn,
	showGoldActive,
	showGoldCancelled,
	username,
}: {
	goldUntilDateString: string;
	loggedIn: boolean;
	showGoldActive: boolean;
	showGoldCancelled: boolean;
	username?: string;
}) => {
	const [logoutError, setLogoutError] = useState<string | undefined>();
	const [cancelling, setCancelling] = useState(false);

	const handleLogout = async (event: MouseEvent) => {
		event.preventDefault();
		setLogoutError(undefined);

		try {
			await fetchWrapper({
				url: `${ACCOUNT_API_URL}/logout.php`,
				method: "POST",
				data: {
					sport: __SPORT,
				},
				credentials: "include",
			});
		} catch (error) {
			console.error(error);
			setLogoutError(ajaxErrorMsg);
			return;
		}

		await toWorker("main", "checkAccount", undefined);
		await toWorker("main", "realtimeUpdate", ["account"]);
		await realtimeUpdate([], "/");
	};

	const handleCancel = async (event: MouseEvent) => {
		event.preventDefault();
		const result = await confirm(
			"Are you sure you want to cancel your ZenGM Gold subscription?",
			{
				okText: "Cancel subscription",
				cancelText: "Keep subscription",
			},
		);

		if (result) {
			setCancelling(true);
			await goldRequest("gold_cancel", {});
			setCancelling(false);
		}
	};

	return (
		<>
			{!loggedIn ? (
				<p>
					You are not logged in!{" "}
					<a href="/account/login_or_register">
						Click here to log in or create an account.
					</a>{" "}
					If you have an account, your achievements will be stored in the cloud,
					combining achievements from leagues in different browsers and
					different devices.
				</p>
			) : (
				<p>
					Logged in as: <b>{username}</b> (
					<button
						type="button"
						className="btn btn-link p-0 border-0 align-baseline"
						onClick={handleLogout}
					>
						Logout
					</button>
					)
				</p>
			)}
			{logoutError ? <p className="text-danger">{logoutError}</p> : null}
			{showGoldActive ? (
				<p>
					ZenGM Gold: Active, renews for $5 on {goldUntilDateString}{" "}
					{cancelling ? (
						<span className="text-warning">
							<ProcessingSpinner text="Canceling" />
						</span>
					) : (
						<>
							(<a href="/account/update_card">Update card</a> or{" "}
							<button
								type="button"
								className="btn btn-link p-0 border-0 align-baseline"
								onClick={handleCancel}
							>
								cancel
							</button>
							)
						</>
					)}
				</p>
			) : null}
			{showGoldCancelled ? (
				<p>ZenGM Gold: Canceled, expires {goldUntilDateString}</p>
			) : null}
		</>
	);
};

const Account = ({
	email,
	goldMessage,
	goldSuccess,
	goldUntilDateString,
	loggedIn,
	showGoldActive,
	showGoldCancelled,
	showGoldPitch,
	username,
}: View<"account">) => {
	useTitleBar({
		title: "Your Account",
		hideNewWindow: true,
	});

	let goldPitchDiv: ReactNode = null;
	if (showGoldPitch) {
		goldPitchDiv = (
			<>
				<h2>ZenGM Gold</h2>

				<div style={TEXT_MAX_WIDTH}>
					<GoldPitchText />

					<p>You can cancel a subscription at any time from this page.</p>

					{!loggedIn ? (
						<p className="mb-0">
							<a href="/account/login_or_register">
								Log in or create an account
							</a>{" "}
							to sign up for ZenGM Gold.
						</p>
					) : (
						<StripeButton email={email} />
					)}
				</div>
			</>
		);
	}

	return (
		<>
			<div className="row">
				<div className="col-lg-8 col-md-10 ">
					<UserInfo
						goldUntilDateString={goldUntilDateString}
						loggedIn={loggedIn}
						showGoldActive={showGoldActive}
						showGoldCancelled={showGoldCancelled}
						username={username}
					/>
				</div>
			</div>

			{goldSuccess === true ? (
				<div className="alert alert-success d-inline-block">{goldMessage}</div>
			) : null}
			{goldSuccess === false ? (
				<div className="alert alert-danger d-inline-block">{goldMessage}</div>
			) : null}

			{goldPitchDiv}

			{loggedIn ? (
				<>
					<h2 className="mt-5">Update Account Info</h2>

					<AccountInfoForm initialEmail={email} initialUsername={username} />

					<h2 className="mt-5">Delete Account</h2>

					<div style={TEXT_MAX_WIDTH}>
						<DeleteAccountForm
							username={username}
							showGoldActive={showGoldActive}
						/>
					</div>
				</>
			) : null}

			<h2 className="mt-5">Achievements</h2>

			<a href="/achievements">Click here to view your achievements.</a>
		</>
	);
};

export default Account;
