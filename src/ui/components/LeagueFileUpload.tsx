import {
	useEffect,
	useReducer,
	useRef,
	useState,
	ChangeEvent,
	MouseEvent,
} from "react";
import { ProgressBarText } from ".";
import {
	MAX_SUPPORTED_LEAGUE_VERSION,
	GAME_NAME,
	WEBSITE_ROOT,
} from "../../common";
import type { BasicInfo } from "../../worker/api/leagueFileUpload";
import {
	localActions,
	resetFileInput,
	toWorker,
	useLocalShallow,
} from "../util";

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
	basicInfo: BasicInfo;
	file?: File;
	url?: string;
};

type State = {
	error: Error | null;
	schemaErrors: any[];
	status: "initial" | "checking" | "error" | "done";
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
	includePlayersInBasicInfo,
	onDone,
	onLoading,
}: {
	// onDone is called in errback style when parsing is done or when an error occurs
	onDone: (b: Error | null, a?: LeagueFileUploadOutput) => void;
	disabled?: boolean;
	enterURL?: boolean;
	includePlayersInBasicInfo?: boolean;
	// onLoading is called when it starts reading the file into memory
	onLoading?: () => void;
}) => {
	const [url, setURL] = useState("");
	const [state, dispatch] = useReducer(reducer, initialState);
	const isMounted = useRef(true);
	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	const leagueCreationID = useRef(Math.random());
	const { leagueCreation, leagueCreationPercent } = useLocalShallow(state => ({
		leagueCreation: state.leagueCreation,
		leagueCreationPercent: state.leagueCreationPercent,
	}));

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
		url,
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
				url,
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

		beforeFile();

		dispatch({
			type: "checking",
		});

		try {
			const { basicInfo, schemaErrors } = await toWorker(
				"leagueFileUpload",
				"initialCheck",
				{
					file: url,
					includePlayersInBasicInfo,
					leagueCreationID: leagueCreationID.current,
				},
			);

			await afterCheck({
				basicInfo,
				schemaErrors,
				url,
			});

			localActions.update({
				leagueCreation: undefined,
				leagueCreationPercent: undefined,
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
				{
					file,
					includePlayersInBasicInfo,
					leagueCreationID: leagueCreationID.current,
				},
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
				<div className="d-flex">
					<input
						type="text"
						className="form-control me-2"
						placeholder="URL"
						value={url}
						onChange={event => {
							setURL(event.target.value);
						}}
					/>
					<button
						className="btn btn-secondary ml-2"
						onClick={handleFileURL}
						disabled={disabled || state.status === "checking"}
					>
						Load
					</button>
				</div>
			) : (
				<input
					type="file"
					onClick={resetFileInput}
					onChange={handleFileUpload}
					disabled={disabled || state.status === "checking"}
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
				{state.status === "checking" ? (
					<>
						<div className="alert alert-info mt-3">
							{leagueCreationPercent?.id === leagueCreationID.current ||
							leagueCreation?.id === leagueCreationID.current ? (
								<ProgressBarText
									text={`Validating ${
										leagueCreation?.status ?? "league file"
									}...`}
									percent={leagueCreationPercent?.percent ?? 0}
								/>
							) : null}
						</div>
					</>
				) : null}
				{state.status === "done" ? (
					<p className="alert alert-success mt-3">Done!</p>
				) : null}
			</div>
		</>
	);
};

export default LeagueFileUpload;
