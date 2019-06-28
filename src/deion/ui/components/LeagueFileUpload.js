// @flow

import Ajv from "ajv";
import PropTypes from "prop-types";
import React, {
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from "react";

// This is dynamically resolved with aliasify
// $FlowFixMe
const schema = require("league-schema.json"); // eslint-disable-line

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
});
const validate = ajv.compile(schema);

type Props = {
    // onDone is called in errback style when parsing is done or when an error occurs
    onDone: (Error | null, any) => void,

    enterURL?: boolean,

    // onLoading is called when it starts reading the file into memory
    onLoading?: () => void,
};

type State = {
    error: Error | null,
    jsonSchemaErrors: any[],
    status: "initial" | "loading" | "parsing" | "error" | "done",
};

const resetFileInput = (event: SyntheticInputEvent<HTMLInputElement>) => {
    // Without this, then selecting the same file twice will do nothing because the browser dedupes by filename.
    // That is very annoying when repeatedly editing/checking a file.
    event.target.value = "";
};

const initialState = {
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
            return {
                ...state,
                jsonSchemaErrors: action.jsonSchemaErrors,
            };
        case "error":
            return {
                ...state,
                error: action.error,
                status: "error",
            };
        case "done":
            return {
                ...state,
                error: null,
                status: "done",
            };
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

const LeagueFileUpload = ({ enterURL, onDone, onLoading }: Props) => {
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
        dispatch({ type: "init" });
    }, [enterURL]);

    const beforeFile = useCallback(() => {
        dispatch({ type: "loading" });
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

            try {
                await onDone(null, leagueFile);
            } catch (error) {
                if (isMounted) {
                    dispatch({ type: "error", error });
                    onDone(error);
                }
                return;
            }

            if (isMounted) {
                dispatch({ type: "done" });
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
                    dispatch({ type: "error", error });
                    onDone(error);
                }
                return;
            }

            dispatch({ type: "parsing" });

            try {
                leagueFile = await response.json();
            } catch (error) {
                if (isMounted) {
                    dispatch({ type: "error", error });
                    onDone(error);
                }
                return;
            }

            await withLeagueFile(leagueFile);
        },
        [beforeFile, onDone, url, withLeagueFile],
    );

    const handleFileUpload = useCallback(
        (event: SyntheticInputEvent<HTMLInputElement>) => {
            beforeFile();

            const file = event.currentTarget.files[0];
            if (!file) {
                dispatch({ type: "init" });
                return;
            }

            const reader = new window.FileReader();
            reader.readAsText(file);
            reader.onload = async event2 => {
                dispatch({ type: "parsing" });

                let leagueFile;
                try {
                    leagueFile = JSON.parse(event2.currentTarget.result);
                } catch (error) {
                    if (isMounted) {
                        dispatch({ type: "error", error });
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
                            className="form-control mb-2 mr-2"
                            placeholder="URL"
                            value={url}
                            onChange={event => {
                                setURL(event.target.value);
                            }}
                        />
                    </div>
                    <div className="col-auto">
                        <button
                            className="btn btn-secondary mb-2"
                            onClick={handleFileURL}
                            disabled={
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
                        state.status === "loading" || state.status === "parsing"
                    }
                />
            )}
            {state.status === "error" ? (
                <p className="alert alert-danger mt-3">
                    Error: {state.error ? state.error.message : "Unknown error"}
                </p>
            ) : null}
            {state.jsonSchemaErrors.length > 0 ? (
                <p className="alert alert-warning mt-3">
                    Warning: {state.jsonSchemaErrors.length} JSON schema
                    validation errors. More detail is available in the
                    JavaScript console. Also, see{" "}
                    <a
                        href={`https://${process.env.SPORT}-gm.com/manual/customization/json-schema/`}
                    >
                        the manual
                    </a>{" "}
                    for more information. You can still use this file, but these
                    errors may cause bugs.
                </p>
            ) : null}
            {state.status === "loading" ? (
                <p className="alert alert-info mt-3">Loading league file...</p>
            ) : null}
            {state.status === "parsing" ? (
                <p className="alert alert-info mt-3">Parsing league file...</p>
            ) : null}
            {state.status === "done" ? (
                <p className="alert alert-success mt-3">Loaded!</p>
            ) : null}
        </>
    );
};

LeagueFileUpload.propTypes = {
    enterURL: PropTypes.bool,
    onLoading: PropTypes.func,
    onDone: PropTypes.func.isRequired,
};

export default LeagueFileUpload;
