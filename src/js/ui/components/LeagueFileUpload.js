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
    status: "initial" | "loading" | "parsing" | "error" | "done",
};

class LeagueFileUpload extends React.Component<Props, State> {
    handleFile: Function;

    constructor(props: Props) {
        super(props);

        this.state = {
            status: "initial",
        };

        this.handleFile = this.handleFile.bind(this);
    }

    handleFile(event: SyntheticInputEvent<HTMLInputElement>) {
        this.setState({
            status: "loading",
        });
        if (this.props.onLoading) {
            this.props.onLoading();
        }

        const file = event.currentTarget.files[0];
        if (!file) {
            this.setState({
                status: "error",
            });
            this.props.onDone(new Error("No file found"));
        }

        const reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = event2 => {
            this.setState({
                status: "parsing",
            });

            let leagueFile;
            try {
                leagueFile = JSON.parse(event2.currentTarget.result);
            } catch (err) {
                this.setState({
                    status: "error",
                });
                this.props.onDone(err);
                return;
            }

            this.props.onDone(null, leagueFile);
            this.setState({
                status: "done",
            });
        };
    }

    render() {
        return (
            <input
                type="file"
                onChange={this.handleFile}
                disabled={
                    this.state.status === "loading" ||
                    this.state.status === "parsing"
                }
            />
        );
    }
}

LeagueFileUpload.propTypes = {
    onLoading: PropTypes.func,
    onDone: PropTypes.func.isRequired,
};

export default LeagueFileUpload;
