import Ajv from "ajv";
import PropTypes from "prop-types";
import React, {
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
	MouseEvent,
	ChangeEvent,
} from "react";
import { MAX_SUPPORTED_LEAGUE_VERSION, helpers } from "../../common";

// This is dynamically resolved with rollup-plugin-alias
import schema from "league-schema"; // eslint-disable-line

const ErrorMessage = ({ error }: { error: Error | null }) => {
	if (!error || !error.message) {
		return <>"Unknown error"</>;
	}

	if (!(error as any).version) {
		return <>{error.message}</>;
	}

	return (
		<>
			{error.message} Please{" "}
			<a
				href={`https://${process.env.SPORT}-gm.com/manual/faq/#latest-version`}
				rel="noopener noreferrer"
				target="_blank"
			>
				make sure you have the latest version of the game loaded
			</a>
			.
		</>
	);
};

const ajv = new Ajv({
	allErrors: true,
	verbose: true,
});
const validate = ajv.compile(schema);

const styleStatus = {
	maxWidth: 400,
};

type Props = {
	// onDone is called in errback style when parsing is done or when an error occurs
	onDone: (b: Error | null, a?: any) => void;
	disabled?: boolean;
	enterURL?: boolean;
	hideLoadedMessage?: boolean;
	// onLoading is called when it starts reading the file into memory
	onLoading?: () => void;
};
type State = {
	error: Error | null;
	jsonSchemaErrors: any[];
	status: "initial" | "loading" | "parsing" | "error" | "done";
};

const resetFileInput = (event: MouseEvent<HTMLInputElement>) => {
	// Without this, then selecting the same file twice will do nothing because the browser dedupes by filename.
	// That is very annoying when repeatedly editing/checking a file.
	// @ts-ignore
	event.target.value = "";
};

const initialState: State = {
	error: null,
	jsonSchemaErrors: [],
	status: "initial",
};

const reducer = (state: State, action: any): State => {
	switch (action.type) {
		case "init":
			return {
				error: null,
				jsonSchemaErrors: [],
				status: "initial",
			};

		case "loading":
			return {
				error: null,
				jsonSchemaErrors: [],
				status: "loading",
			};

		case "jsonSchemaErrors":
			console.log("JSON Schema validation errors:");
			console.log(action.jsonSchemaErrors);
			return { ...state, jsonSchemaErrors: action.jsonSchemaErrors };

		case "error": {
			console.error(action.error);
			return { ...state, error: action.error, status: "error" };
		}

		case "done":
			return { ...state, error: null, status: "done" };

		case "parsing":
			return {
				error: null,
				jsonSchemaErrors: [],
				status: "parsing",
			};

		default:
			throw new Error();
	}
};

const LeagueFileUpload = ({
	disabled,
	enterURL,
	hideLoadedMessage,
	onDone,
	onLoading,
}: Props) => {
	const [url, setURL] = useState("");
	const [state, dispatch] = useReducer(reducer, initialState);
	const isMounted = useRef(true);
	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// Reset status when switching between file upload
	useEffect(() => {
		dispatch({
			type: "init",
		});
	}, [enterURL]);
	const beforeFile = useCallback(() => {
		dispatch({
			type: "loading",
		});

		if (onLoading) {
			onLoading();
		}
	}, [onLoading]);
	const withLeagueFile = useCallback(
		async leagueFile => {
			const valid = validate(leagueFile);

			if (!valid && Array.isArray(validate.errors)) {
				dispatch({
					type: "jsonSchemaErrors",
					jsonSchemaErrors: validate.errors.slice(),
				});
			}

			if (
				leagueFile &&
				typeof leagueFile.version === "number" &&
				leagueFile.version > MAX_SUPPORTED_LEAGUE_VERSION
			) {
				const error = new Error(
					`This league file is a newer format (version ${
						leagueFile.version
					}) than is supported by your version of ${helpers.upperCaseFirstLetter(
						process.env.SPORT,
					)} GM (version ${MAX_SUPPORTED_LEAGUE_VERSION}).`,
				);
				(error as any).version = true;
				console.log(isMounted, error);

				if (isMounted) {
					dispatch({
						type: "error",
						error,
					});
					onDone(error);
				}
				return;
			}

			try {
				await onDone(null, leagueFile);
			} catch (error) {
				if (isMounted) {
					dispatch({
						type: "error",
						error,
					});
					onDone(error);
				}
				return;
			}

			if (isMounted) {
				dispatch({
					type: "done",
				});
			}
		},
		[onDone],
	);
	const handleFileURL = useCallback(
		async event => {
			event.preventDefault();
			beforeFile();
			let leagueFile;
			let response;

			try {
				response = await fetch(url);
			} catch (_) {
				const error = new Error(
					"Could be a network error, an invalid URL, or an invalid Access-Control-Allow-Origin header",
				);

				if (isMounted) {
					dispatch({
						type: "error",
						error,
					});
					onDone(error);
				}

				return;
			}

			dispatch({
				type: "parsing",
			});

			try {
				leagueFile = await response.json();
			} catch (error) {
				if (isMounted) {
					dispatch({
						type: "error",
						error,
					});
					onDone(error);
				}

				return;
			}

			await withLeagueFile(leagueFile);
		},
		[beforeFile, onDone, url, withLeagueFile],
	);
	const handleFileUpload = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			beforeFile();
			const files = event.currentTarget.files;

			if (!files) {
				dispatch({
					type: "init",
				});
				return;
			}

			const file = files[0];

			if (!file) {
				dispatch({
					type: "init",
				});
				return;
			}

			const reader = new window.FileReader();
			reader.readAsText(file);

			reader.onload = async event2 => {
				dispatch({
					type: "parsing",
				});
				let leagueFile;

				try {
					// @ts-ignore
					leagueFile = JSON.parse(event2.currentTarget.result);
				} catch (error) {
					if (isMounted) {
						dispatch({
							type: "error",
							error,
						});
						onDone(error);
					}

					return;
				}

				await withLeagueFile(leagueFile);
			};
		},
		[beforeFile, onDone, withLeagueFile],
	);
	return (
		<>
			{enterURL ? (
				<div className="form-row">
					<div className="col">
						<input
							type="text"
							className="form-control mr-2"
							placeholder="URL"
							value={url}
							onChange={event => {
								setURL(event.target.value);
							}}
						/>
					</div>
					<div className="col-auto">
						<button
							className="btn btn-secondary"
							onClick={handleFileURL}
							disabled={
								disabled ||
								state.status === "loading" ||
								state.status === "parsing"
							}
						>
							Load
						</button>
					</div>
				</div>
			) : (
				<input
					type="file"
					onClick={resetFileInput}
					onChange={handleFileUpload}
					disabled={
						disabled || state.status === "loading" || state.status === "parsing"
					}
				/>
			)}
			<div style={styleStatus}>
				{state.status === "error" ? (
					<p className="alert alert-danger mt-3">
						Error: <ErrorMessage error={state.error} />
					</p>
				) : null}
				{state.jsonSchemaErrors.length > 0 ? (
					<p className="alert alert-warning mt-3">
						Warning: {state.jsonSchemaErrors.length} JSON schema validation
						errors. More detail is available in the JavaScript console. Also,
						see{" "}
						<a
							href={`https://${process.env.SPORT}-gm.com/manual/customization/json-schema/`}
						>
							the manual
						</a>{" "}
						for more information. You can still use this file, but these errors
						may cause bugs.
					</p>
				) : null}
				{state.status === "loading" ? (
					<p className="alert alert-info mt-3">Loading league file...</p>
				) : null}
				{state.status === "parsing" ? (
					<p className="alert alert-info mt-3">Parsing league file...</p>
				) : null}
				{state.status === "done" && !hideLoadedMessage ? (
					<p className="alert alert-success mt-3">Loaded!</p>
				) : null}
			</div>
		</>
	);
};

LeagueFileUpload.propTypes = {
	disabled: PropTypes.bool,
	enterURL: PropTypes.bool,
	hideLoadedMessage: PropTypes.bool,
	onLoading: PropTypes.func,
	onDone: PropTypes.func.isRequired,
};

export default LeagueFileUpload;
