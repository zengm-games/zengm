// @flow

import Ajv from "ajv";
import PropTypes from "prop-types";
import * as React from "react";

// eslint-disable-next-line
const schema = require("../../../files/league-schema.json");

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
            <div>
                <input
                    type="file"
                    onChange={this.handleFile}
                    disabled={
                        this.state.status === "loading" ||
                        this.state.status === "parsing"
                    }
                />
                {this.state.status === "error" ? (
                    <p className="text-danger" style={{ marginTop: "1em" }}>
                        Error:{" "}
                        {this.state.error
                            ? this.state.error.message
                            : "Unknown error"}
                    </p>
                ) : null}
                {this.state.jsonSchemaErrors.length > 0 ? (
                    <p className="text-warning" style={{ marginTop: "1em" }}>
                        Warning: {this.state.jsonSchemaErrors.length} JSON
                        schema validation errors. See the JavaScript console for
                        more. You can still use this file, but these errors may
                        cause bugs.
                    </p>
                ) : null}
                {this.state.status === "loading" ? (
                    <p className="text-info" style={{ marginTop: "1em" }}>
                        Loading league file...
                    </p>
                ) : null}
                {this.state.status === "parsing" ? (
                    <p className="text-info" style={{ marginTop: "1em" }}>
                        Parsing league file...
                    </p>
                ) : null}
            </div>
        );
    }
}

LeagueFileUpload.propTypes = {
    onLoading: PropTypes.func,
    onDone: PropTypes.func.isRequired,
};

export default LeagueFileUpload;
