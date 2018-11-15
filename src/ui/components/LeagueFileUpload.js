// @flow

import Ajv from "ajv";
import PropTypes from "prop-types";
import * as React from "react";

// eslint-disable-next-line
const schema = require("../../../public/files/league-schema.json");

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
        };

        this.handleFile = this.handleFile.bind(this);
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    handleFile(event: SyntheticInputEvent<HTMLInputElement>) {
        this.setState({
            error: null,
            jsonSchemaErrors: [],
            status: "loading",
        });
        if (this.props.onLoading) {
            this.props.onLoading();
        }

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
        };
    }

    render() {
        return (
            <>
                <input
                    type="file"
                    onClick={resetFileInput}
                    onChange={this.handleFile}
                    disabled={
                        this.state.status === "loading" ||
                        this.state.status === "parsing"
                    }
                />
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
                        <a href="https://basketball-gm.com/manual/customization/json-schema/">
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
            </>
        );
    }
}

LeagueFileUpload.propTypes = {
    onLoading: PropTypes.func,
    onDone: PropTypes.func.isRequired,
};

export default LeagueFileUpload;
