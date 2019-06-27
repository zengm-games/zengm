// @flow

import Ajv from "ajv";
import PropTypes from "prop-types";
import React from "react";

// This is dynamically resolved with aliasify
// $FlowFixMe
const schema = require("league-schema.json"); // eslint-disable-line

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
});
const validate = ajv.compile(schema);

type Props = {
    // onLoading is called when it starts reading the file into memory
    onLoading?: () => void,

    // onDone is called in errback style when parsing is done or when an error occurs
    onDone: (Error | null, any) => void,
};

type State = {
    error: Error | null,
    jsonSchemaErrors: any[],
    status: "initial" | "loading" | "parsing" | "error" | "done",
    url: string,
};

const resetFileInput = (event: SyntheticInputEvent<HTMLInputElement>) => {
    // Without this, then selecting the same file twice will do nothing because the browser dedupes by filename.
    // That is very annoying when repeatedly editing/checking a file.
    event.target.value = "";
};

class LeagueFileUpload extends React.Component<Props, State> {
    handleFile: Function;

    unmounted: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            error: null,
            jsonSchemaErrors: [],
            status: "initial",
            url: "",
        };

        this.handleFileURL = this.handleFileURL.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    beforeFile() {
        this.setState({
            error: null,
            jsonSchemaErrors: [],
            status: "loading",
        });

        if (this.props.onLoading) {
            this.props.onLoading();
        }
    }

    async withLeagueFile(leagueFile) {
        const valid = validate(leagueFile);
        if (!valid && Array.isArray(validate.errors)) {
            console.log("JSON Schema validation errors:");
            console.log(validate.errors);
            this.setState({
                jsonSchemaErrors: validate.errors.slice(),
            });
        }

        try {
            await this.props.onDone(null, leagueFile);
        } catch (err) {
            if (!this.unmounted) {
                this.setState({
                    error: err,
                    status: "error",
                });
            }
            return;
        }

        if (!this.unmounted) {
            this.setState({
                error: null,
                status: "done",
            });
        }
    }

    async handleFileURL() {
        this.beforeFile();

        let leagueFile;
        try {
            const response = await fetch(this.state.url);

            this.setState({
                error: null,
                jsonSchemaErrors: [],
                status: "parsing",
            });

            leagueFile = await response.json();
        } catch (err) {
            if (!this.unmounted) {
                this.setState({
                    error: err,
                    status: "error",
                });
            }
            this.props.onDone(err);
            return;
        }

        await this.withLeagueFile(leagueFile);
    }

    handleFileUpload(event: SyntheticInputEvent<HTMLInputElement>) {
        this.beforeFile();

        const file = event.currentTarget.files[0];
        if (!file) {
            this.setState({
                error: null,
                jsonSchemaErrors: [],
                status: "initial",
            });
            return;
        }

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = async event2 => {
            this.setState({
                error: null,
                jsonSchemaErrors: [],
                status: "parsing",
            });

            let leagueFile;
            try {
                leagueFile = JSON.parse(event2.currentTarget.result);
            } catch (err) {
                this.setState({
                    error: err,
                    jsonSchemaErrors: [],
                    status: "error",
                });
                this.props.onDone(err);
                return;
            }

            await this.withLeagueFile(leagueFile);
        };
    }

    render() {
        return (
            <>
                {this.props.url ? (
                    <div className="form-inline">
                        <input
                            type="text"
                            className="form-control mb-2 mr-sm-2"
                            placeholder="URL"
                            value={this.state.url}
                            onChange={event => {
                                this.setState({ url: event.target.value });
                            }}
                        />
                        <button
                            type="submit"
                            className="btn btn-secondary mb-2"
                            onClick={this.handleFileURL}
                            disabled={
                                this.state.status === "loading" ||
                                this.state.status === "parsing"
                            }
                        >
                            Load
                        </button>
                    </div>
                ) : (
                    <input
                        type="file"
                        onClick={resetFileInput}
                        onChange={this.handleFileUpload}
                        disabled={
                            this.state.status === "loading" ||
                            this.state.status === "parsing"
                        }
                    />
                )}
                {this.state.status === "error" ? (
                    <p className="alert alert-danger mt-3">
                        Error:{" "}
                        {this.state.error
                            ? this.state.error.message
                            : "Unknown error"}
                    </p>
                ) : null}
                {this.state.jsonSchemaErrors.length > 0 ? (
                    <p className="alert alert-warning mt-3">
                        Warning: {this.state.jsonSchemaErrors.length} JSON
                        schema validation errors. More detail is available in
                        the JavaScript console. Also, see{" "}
                        <a
                            href={`https://${process.env.SPORT}-gm.com/manual/customization/json-schema/`}
                        >
                            the manual
                        </a>{" "}
                        for more information. You can still use this file, but
                        these errors may cause bugs.
                    </p>
                ) : null}
                {this.state.status === "loading" ? (
                    <p className="alert alert-info mt-3">
                        Loading league file...
                    </p>
                ) : null}
                {this.state.status === "parsing" ? (
                    <p className="alert alert-info mt-3">
                        Parsing league file...
                    </p>
                ) : null}
                {this.state.status === "done" ? (
                    <p className="alert alert-success mt-3">Loaded!</p>
                ) : null}
            </>
        );
    }
}

LeagueFileUpload.propTypes = {
    onLoading: PropTypes.func,
    onDone: PropTypes.func.isRequired,
    url: PropTypes.bool,
};

export default LeagueFileUpload;
