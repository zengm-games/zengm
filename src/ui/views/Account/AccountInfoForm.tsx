import classNames from "classnames";
import { ChangeEvent, useState } from "react";
import { ActionButton } from "../../components";
import { helpers } from "../../util";
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
			} else if (field === "email") {
				newState.email = initialEmail;
			} else if (field === "password") {
				newState.newPassword = "";
				newState.newPassword2 = "";
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

				const toSubmit: {
					username?: string;
					email?: string;
					newPassword?: string;
					newPassword2?: string;
					oldPassword: string;
				} = {
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

				console.log("toSubmit", toSubmit);
			}}
		>
			<div
				className="d-md-flex"
				style={{
					gap: "3rem",
				}}
			>
				<div style={formGroupStyle}>
					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessageUsername,
						})}
						style={formGroupStyle}
					>
						<label htmlFor="account-username">Username</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageUsername,
								})}
								id="account-username"
								{...fields.username.inputProps}
								value={state.username}
								onChange={handleChange("username")}
								disabled={!state.editUsername}
								required={state.editUsername}
							/>
							<div className="input-group-append">
								<button
									className="btn btn-secondary"
									type="button"
									onClick={handleEditCancel("username")}
								>
									{state.editUsername ? "Cancel" : "Edit"}
								</button>
							</div>
						</div>
						<span className="form-text text-muted">
							{fields.username.description}
						</span>
						<span className="form-text">{state.errorMessageUsername}</span>
					</div>

					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessageEmail,
						})}
						style={formGroupStyle}
					>
						<label htmlFor="account-email">Email</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageEmail,
								})}
								id="account-email"
								{...fields.email.inputProps}
								value={state.email}
								onChange={handleChange("email")}
								disabled={!state.editEmail}
								required={state.editEmail}
							/>
							<div className="input-group-append">
								<button
									className="btn btn-secondary"
									type="button"
									onClick={handleEditCancel("email")}
								>
									{state.editEmail ? "Cancel" : "Edit"}
								</button>
							</div>
						</div>
						<span className="form-text">{state.errorMessageEmail}</span>
					</div>
				</div>

				<div style={formGroupStyle}>
					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessageNewPassword,
						})}
						style={formGroupStyle}
					>
						<label htmlFor="account-new-password">New Password</label>
						<div className="input-group">
							<input
								className={classNames("form-control", {
									"is-invalid": state.errorMessageNewPassword,
								})}
								id="account-new-password"
								{...fields.password.inputProps}
								value={state.newPassword}
								onChange={handleChange("newPassword")}
								disabled={!state.editPassword}
								required={state.editPassword}
								autoComplete="new-password"
							/>
							<div className="input-group-append">
								<button
									className="btn btn-secondary"
									type="button"
									onClick={handleEditCancel("password")}
								>
									{state.editPassword ? "Cancel" : "Edit"}
								</button>
							</div>
						</div>
						<span className="form-text">{state.errorMessageNewPassword}</span>
					</div>

					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessageNewPassword2,
						})}
						style={formGroupStyle}
					>
						<label htmlFor="account-new-password-2">Repeat New Password</label>
						<input
							className={classNames("form-control", {
								"is-invalid": state.errorMessageNewPassword2,
							})}
							id="account-new-password-2"
							{...fields.password.inputProps}
							value={state.newPassword2}
							onChange={handleChange("newPassword2")}
							disabled={!state.editPassword}
							required={state.editPassword}
							autoComplete="new-password"
						/>
						<span className="form-text">{state.errorMessageNewPassword2}</span>
					</div>
				</div>
			</div>

			<div
				className={classNames("form-group", {
					"text-danger": state.errorMessageOldPassword,
				})}
				style={formGroupStyle}
			>
				<label htmlFor="account-old-password">Confirm Current Password</label>
				<input
					className={classNames("form-control", {
						"is-invalid": state.errorMessageOldPassword,
					})}
					id="account-old-password"
					{...fields.password.inputProps}
					value={state.oldPassword}
					onChange={handleChange("oldPassword")}
					autoComplete="current-password"
				/>
				<span className="form-text">{state.errorMessageOldPassword}</span>
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
