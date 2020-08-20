import PropTypes from "prop-types";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import {
	ACCOUNT_API_URL,
	STRIPE_PUBLISHABLE_KEY,
	fetchWrapper,
} from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { getScript, realtimeUpdate } from "../util";
import type { View } from "../../common/types";

const ajaxErrorMsg =
	"Error connecting to server. Check your Internet connection or try again later.";

const AccountUpdateCard = (props: View<"accountUpdateCard">) => {
	const [state, setState] = useState({
		disabled: true,
		formError: undefined as string | undefined,
		number: "",
		cvc: "",
		exp_month: "",
		exp_year: "",
	});

	useEffect(() => {
		(async () => {
			if (!window.Stripe) {
				await getScript("https://js.stripe.com/v2/");
				(window.Stripe as stripe.StripeStatic).setPublishableKey(
					STRIPE_PUBLISHABLE_KEY,
				);
			}

			setState(prevState => ({
				...prevState,
				disabled: false,
			}));
		})();
	}, []);

	const handleChange = (name: string) => (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const value = event.target.value;
		setState(prevState => ({
			...prevState,
			[name]: value,
		}));
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();

		setState(prevState => ({
			...prevState,
			disabled: true,
		}));

		window.Stripe.card.createToken(
			{
				number: state.number,
				cvc: state.cvc,
				// @ts-ignore
				exp_month: state.exp_month,
				// @ts-ignore
				exp_year: state.exp_year,
			},
			async (status: number, response: stripe.StripeCardTokenResponse) => {
				const error = response.error;
				if (error) {
					setState(prevState => ({
						...prevState,
						disabled: false,
						formError: error.message,
					}));
				} else {
					const token = response.id;

					try {
						const data = await fetchWrapper({
							url: `${ACCOUNT_API_URL}/gold_card_update.php`,
							method: "POST",
							data: {
								sport: process.env.SPORT,
								token,
							},
							credentials: "include",
						});
						realtimeUpdate(["account"], "/account", {
							goldResult: data,
						});
					} catch (err) {
						setState(prevState => ({
							...prevState,
							disabled: false,
							formError: ajaxErrorMsg,
						}));
					}
				}
			},
		);
	};

	const { goldCancelled, expMonth, expYear, last4, username } = props;

	useTitleBar({ title: "Update Card", hideNewWindow: true });

	let errorMessage;
	if (username === undefined || username === null || username === "") {
		errorMessage = "Log in to view this page.";
	}
	if (goldCancelled) {
		errorMessage =
			"Cannot update card because your GM Gold account is cancelled.";
	}
	if (errorMessage) {
		return (
			<>
				<h2>Error</h2>
				<p>{errorMessage}</p>
			</>
		);
	}

	return (
		<>
			<h2>Saved Card Info</h2>
			<p>
				Last 4 Digits: {last4}
				<br />
				Expiration: {expMonth}/{expYear}
			</p>

			<hr />

			<p>To replace your saved card with a new one, fill out this form:</p>

			<form onSubmit={handleSubmit}>
				{state.formError ? (
					<div className="alert alert-danger">{state.formError}</div>
				) : null}

				<div style={{ maxWidth: "300px" }}>
					<div className="form-group">
						<label htmlFor="card-number">Card Number</label>
						<input
							type="text"
							onChange={handleChange("number")}
							value={state.number}
							id="card-number"
							className="form-control"
						/>
					</div>

					<div className="form-group" style={{ maxWidth: "100px" }}>
						<label htmlFor="cvc">CVC</label>
						<input
							type="text"
							onChange={handleChange("cvc")}
							value={state.cvc}
							id="cvc"
							className="form-control"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="exp-month">Expiration (MM/YYYY)</label>
						<div className="row">
							<div className="col-5">
								<input
									type="text"
									onChange={handleChange("exp_month")}
									value={state.exp_month}
									placeholder="MM"
									id="exp-month"
									className="form-control"
								/>
							</div>
							<div className="col-7">
								<input
									type="text"
									onChange={handleChange("exp_year")}
									value={state.exp_year}
									placeholder="YYYY"
									className="form-control"
								/>
							</div>
						</div>
					</div>

					<button
						type="submit"
						disabled={state.disabled}
						className="btn btn-primary"
					>
						Update Card
					</button>
				</div>
			</form>
		</>
	);
};

AccountUpdateCard.propTypes = {
	goldCancelled: PropTypes.bool.isRequired,
	expMonth: PropTypes.number.isRequired,
	expYear: PropTypes.number.isRequired,
	last4: PropTypes.string.isRequired,
	username: PropTypes.string,
};

export default AccountUpdateCard;
