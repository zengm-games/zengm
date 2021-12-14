import classNames from "classnames";
import { ChangeEvent, useState } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { ActionButton } from "../../components";
import { helpers, realtimeUpdate } from "../../util";
import { ajaxErrorMsg } from "../LoginOrRegister";
import { fields } from "../LoginOrRegister/Register";

const formGroupStyle = {
	width: 300,
};

const AccountInfoForm = ({
	initialEmail,
	initialUsername,
}: {
	initialEmail: string;
	initialUsername: string;
}) => {
	const [state, setState] = useState({
		submitting: false,
		errorMessageOverall: undefined as string | undefined,
		errorMessageUsername: undefined as string | undefined,
		errorMessageEmail: undefined as string | undefined,
		errorMessageNewPassword: undefined as string | undefined,
		errorMessageNewPassword2: undefined as string | undefined,
		errorMessageOldPassword: undefined as string | undefined,

		editUsername: false,
		editEmail: false,
		editPassword: false,

		username: initialUsername,
		email: initialEmail,
		newPassword: "",
		newPassword2: "",
		oldPassword: "",
	});

	const handleChange =
		(
			field:
				| "username"
				| "email"
				| "newPassword"
				| "newPassword2"
				| "oldPassword",
		) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setState({
				...state,
				[field]: event.target.value,
			});
		};

	const handleEditCancel = (field: "username" | "email" | "password") => () => {
		const editField = `edit${helpers.upperCaseFirstLetter(field)}` as const;

		if (state[editField]) {
			const newState = {
				...state,
				[editField]: false,
			};

			if (field === "username") {
				newState.username = initialUsername;
				newState.errorMessageUsername = undefined;
			} else if (field === "email") {
				newState.email = initialEmail;
				newState.errorMessageEmail = undefined;
			} else if (field === "password") {
				newState.newPassword = "";
				newState.newPassword2 = "";
				newState.errorMessageNewPassword = undefined;
				newState.errorMessageNewPassword2 = undefined;
			}

			setState(newState);
		} else {
			setState({
				...state,
				[editField]: true,
			});
		}
	};

	return (
		<form
			onSubmit={async event => {
				event.preventDefault();

				setState(state2 => ({
					...state2,
					submitting: true,
					errorMessageEmail: undefined,
					errorMessageOverall: undefined,
					errorMessageNewPassword: undefined,
					errorMessageNewPassword2: undefined,
					errorMessageOldPassword: undefined,
					errorMessageUsername: undefined,
				}));

				const toSubmit: {
					sport: string;
					username?: string;
					email?: string;
					newPassword?: string;
					newPassword2?: string;
					oldPassword: string;
				} = {
					sport: process.env.SPORT,
					oldPassword: state.oldPassword,
				};

				if (state.editUsername) {
					toSubmit.username = state.username;
				}
				if (state.editEmail) {
					toSubmit.email = state.email;
				}
				if (state.editPassword) {
					toSubmit.newPassword = state.newPassword;
					toSubmit.newPassword2 = state.newPassword2;
				}

				try {
					const data = await fetchWrapper({
						url: `${ACCOUNT_API_URL}/update_account.php`,
						method: "POST",
						data: toSubmit,
						credentials: "include",
					});

					if (data.success) {
						await realtimeUpdate(["account"], "/account");

						setState(state2 => ({
							...state2,
							editUsername: false,
							editEmail: false,
							editPassword: false,
							oldPassword: "",
							submitting: false,
						}));
					} else {
						const updatedState: Partial<typeof state> = {};

						for (const error of Object.keys(data.errors)) {
							if (error === "username") {
								updatedState.errorMessageUsername = data.errors[error];
							} else if (error === "email") {
								updatedState.errorMessageEmail = data.errors[error];
							} else if (error === "newPassword") {
								updatedState.errorMessageNewPassword = data.errors[error];
							} else if (error === "newPassword2") {
								updatedState.errorMessageNewPassword2 = data.errors[error];
							} else if (error === "newPasswords") {
								updatedState.errorMessageNewPassword =
									updatedState.errorMessageNewPassword ?? ""; // So it gets highlighted too
								updatedState.errorMessageNewPassword2 = data.errors[error];
							} else if (error === "oldPassword") {
								updatedState.errorMessageOldPassword = data.errors[error];
							} else if (error === "overall") {
								updatedState.errorMessageOverall = data.errors[error];
							}
						}

						setState(state2 => ({
							...state2,
							...updatedState,
							submitting: false,
						}));
					}
				} catch (error) {
					console.error(error);
					setState(state2 => ({
						...state2,
						submitting: false,
						errorMessageOverall: ajaxErrorMsg,
					}));
				}
			}}
		>
			<div
				className="d-md-flex"
				style={{
					gap: "3rem",
				}}
			>
				<div style={formGroupStyle}>
					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-username">
							Username
						</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageUsername !== undefined,
								})}
								id="account-username"
								{...fields.username.inputProps}
								value={state.username}
								onChange={handleChange("username")}
								disabled={!state.editUsername}
								required={state.editUsername}
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("username")}
							>
								{state.editUsername ? "Cancel" : "Edit"}
							</button>
						</div>
						<span className="form-text text-muted">
							{fields.username.description}
						</span>
						<span
							className={classNames("form-text", {
								"text-danger": state.errorMessageUsername,
							})}
						>
							{state.errorMessageUsername}
						</span>
					</div>

					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-email">
							Email
						</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageEmail !== undefined,
								})}
								id="account-email"
								{...fields.email.inputProps}
								value={state.email}
								onChange={handleChange("email")}
								disabled={!state.editEmail}
								required={state.editEmail}
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("email")}
							>
								{state.editEmail ? "Cancel" : "Edit"}
							</button>
						</div>
						<span
							className={classNames("form-text", {
								"text-danger": state.errorMessageEmail,
							})}
						>
							{state.errorMessageEmail}
						</span>
					</div>
				</div>

				<div style={formGroupStyle}>
					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-new-password">
							New Password
						</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageNewPassword !== undefined,
								})}
								id="account-new-password"
								{...fields.password.inputProps}
								value={state.newPassword}
								onChange={handleChange("newPassword")}
								disabled={!state.editPassword}
								required={state.editPassword}
								autoComplete="new-password"
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("password")}
							>
								{state.editPassword ? "Cancel" : "Edit"}
							</button>
						</div>
						<span
							className={classNames("form-text", {
								"text-danger": state.errorMessageNewPassword,
							})}
						>
							{state.errorMessageNewPassword}
						</span>
					</div>

					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-new-password-2">
							Repeat New Password
						</label>
						<input
							className={classNames("form-control", {
								"is-invalid": state.errorMessageNewPassword2 !== undefined,
							})}
							id="account-new-password-2"
							{...fields.password.inputProps}
							value={state.newPassword2}
							onChange={handleChange("newPassword2")}
							disabled={!state.editPassword}
							required={state.editPassword}
							autoComplete="new-password"
						/>
						<span
							className={classNames("form-text", {
								"text-danger": state.errorMessageNewPassword2,
							})}
						>
							{state.errorMessageNewPassword2}
						</span>
					</div>
				</div>
			</div>

			<div className="mb-3" style={formGroupStyle}>
				<label className="form-label" htmlFor="account-old-password">
					Confirm Current Password
				</label>
				<input
					className={classNames("form-control", {
						"is-invalid": state.errorMessageOldPassword !== undefined,
					})}
					id="account-old-password"
					{...fields.password.inputProps}
					value={state.oldPassword}
					onChange={handleChange("oldPassword")}
					autoComplete="current-password"
				/>
				<span
					className={classNames("form-text", {
						"text-danger": state.errorMessageOldPassword,
					})}
				>
					{state.errorMessageOldPassword}
				</span>
			</div>

			<ActionButton
				type="submit"
				processing={state.submitting}
				disabled={
					!state.editUsername && !state.editEmail && !state.editPassword
				}
			>
				Save Changes
			</ActionButton>
			{state.errorMessageOverall ? (
				<p className="text-danger mt-3 mb-0">{state.errorMessageOverall}</p>
			) : null}
		</form>
	);
};

export default AccountInfoForm;
