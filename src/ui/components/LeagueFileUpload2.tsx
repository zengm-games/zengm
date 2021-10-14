import PropTypes from "prop-types";
import {
	useEffect,
	useReducer,
	useRef,
	useState,
	ChangeEvent,
	MouseEvent,
} from "react";
import {
	MAX_SUPPORTED_LEAGUE_VERSION,
	GAME_NAME,
	WEBSITE_ROOT,
} from "../../common";
import { resetFileInput, toWorker } from "../util";

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
				href={`https://${WEBSITE_ROOT}/manual/faq/#latest-version`}
				rel="noopener noreferrer"
				target="_blank"
			>
				make sure you have the latest version of the game loaded
			</a>
			.
		</>
	);
};

const styleStatus = {
	maxWidth: 400,
};

export type LeagueFileUploadOutput = {
	basicInfo: any;
	file: File;
};

export type LeagueFileUploadProps = {
	// onDone is called in errback style when parsing is done or when an error occurs
	onDone: (b: Error | null, a?: LeagueFileUploadOutput) => void;
	disabled?: boolean;
	enterURL?: boolean;
	hideLoadedMessage?: boolean;
	// onLoading is called when it starts reading the file into memory
	onLoading?: () => void;
};
type State = {
	error: Error | null;
	schemaErrors: any[];
	status: "initial" | "loading" | "checking" | "error" | "done";
};

const initialState: State = {
	error: null,
	schemaErrors: [],
	status: "initial",
};

const reducer = (state: State, action: any): State => {
	switch (action.type) {
		case "init":
			return {
				error: null,
				schemaErrors: [],
				status: "initial",
			};

		case "loading":
			return {
				error: null,
				schemaErrors: [],
				status: "loading",
			};

		case "schemaErrors":
			console.log("JSON Schema validation errors:");
			console.log(action.schemaErrors);
			return { ...state, schemaErrors: action.schemaErrors };

		case "error": {
			console.error(action.error);
			return { ...state, error: action.error, status: "error" };
		}

		case "done":
			return { ...state, error: null, status: "done" };

		case "checking":
			return {
				error: null,
				schemaErrors: [],
				status: "checking",
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
}: LeagueFileUploadProps) => {
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

	const beforeFile = () => {
		if (onLoading) {
			onLoading();
		}
	};

	const afterCheck = async ({
		basicInfo,
		file,
		schemaErrors,
	}: LeagueFileUploadOutput & {
		schemaErrors: any[];
	}) => {
		if (schemaErrors.length > 0) {
			dispatch({
				type: "schemaErrors",
				schemaErrors,
			});
		}

		if (
			basicInfo &&
			typeof (basicInfo as any).version === "number" &&
			(basicInfo as any).version > MAX_SUPPORTED_LEAGUE_VERSION
		) {
			const error = new Error(
				`This league file is a newer format (version ${
					(basicInfo as any).version
				}) than is supported by your version of ${GAME_NAME} (version ${MAX_SUPPORTED_LEAGUE_VERSION}).`,
			);
			(error as any).version = true;

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
			await onDone(null, {
				basicInfo,
				file,
			});
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
	};

	const handleFileURL = async (event: MouseEvent) => {
		event.preventDefault();
		throw new Error("Not implemented");
		/*
		dispatch({
			type: "loading",
		});

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
            type: "checking",
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

        await afterCheck(leagueFile);*/
	};

	const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		beforeFile();
		const file = event.currentTarget.files?.[0];

		if (!file) {
			dispatch({
				type: "init",
			});
			return;
		}

		dispatch({
			type: "checking",
		});

		try {
			const { basicInfo, schemaErrors } = await toWorker(
				"leagueFileUpload",
				"initialCheck",
				file,
			);

			await afterCheck({
				basicInfo,
				file,
				schemaErrors,
			});
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
	};

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
								state.status === "checking"
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
						disabled ||
						state.status === "loading" ||
						state.status === "checking"
					}
				/>
			)}
			<div style={styleStatus}>
				{state.status === "error" ? (
					<p className="alert alert-danger mt-3">
						Error: <ErrorMessage error={state.error} />
					</p>
				) : null}
				{state.schemaErrors.length > 0 ? (
					<p className="alert alert-warning mt-3">
						Warning: {state.schemaErrors.length} JSON schema validation errors.
						More detail is available in the JavaScript console. Also, see{" "}
						<a
							href={`https://${WEBSITE_ROOT}/manual/customization/json-schema/`}
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
				{state.status === "checking" ? (
					<p className="alert alert-info mt-3">Checking league file...</p>
				) : null}
				{state.status === "done" && !hideLoadedMessage ? (
					<p className="alert alert-success mt-3">Done!</p>
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
