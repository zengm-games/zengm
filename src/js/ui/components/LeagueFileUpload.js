// @flow

import PropTypes from "prop-types";
import * as React from "react";

type Props = {
    // onLoading is called when it starts reading the file into memory
    onLoading?: () => void,

    // onDone is called in errback style when parsing is done or when an error occurs
    onDone: (Error | null, any) => void,
};

type State = {
    error: Error | null,
    status: "initial" | "loading" | "parsing" | "error" | "done",
};

class LeagueFileUpload extends React.Component<Props, State> {
    handleFile: Function;

    constructor(props: Props) {
        super(props);

        this.state = {
            error: null,
            status: "initial",
        };

        this.handleFile = this.handleFile.bind(this);
    }

    handleFile(event: SyntheticInputEvent<HTMLInputElement>) {
        this.setState({
            error: null,
            status: "loading",
        });
        if (this.props.onLoading) {
            this.props.onLoading();
        }

        const file = event.currentTarget.files[0];
        if (!file) {
            this.setState({
                error: null,
                status: "initial",
            });
            return;
        }

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = event2 => {
            this.setState({
                error: null,
                status: "parsing",
            });

            let leagueFile;
            try {
                leagueFile = JSON.parse(event2.currentTarget.result);
            } catch (err) {
                this.setState({
                    error: err,
                    status: "error",
                });
                this.props.onDone(err);
                return;
            }

            this.props.onDone(null, leagueFile);
            this.setState({
                error: null,
                status: "done",
            });
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
