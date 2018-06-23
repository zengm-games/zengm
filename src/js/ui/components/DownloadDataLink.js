// @flow

import PropTypes from "prop-types";
import * as React from "react";

type Props = {
    data?: string,
    downloadText: string,
    filename?: string,
    mimeType: string,
    status: React.Element<any> | string,
};

type State = {
    prevData?: string,
    url?: string,
};

class DownloadDataLink extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            prevData: undefined,
            url: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.data !== prevState.prevData) {
            // Expire any current URL from the old data
            if (prevState.url) {
                window.URL.revokeObjectURL(prevState.url);
            }

            if (nextProps.data) {
                // Magic number from http://stackoverflow.com/a/18925211/786644 to force UTF-8 encoding
                const blob = new Blob(["\ufeff", nextProps.data], {
                    type: nextProps.mimeType,
                });
                const url = window.URL.createObjectURL(blob);

                return {
                    prevData: nextProps.data,
                    url,
                };
            }

            return {
                prevData: undefined,
                url: undefined,
            };
        }

        return null;
    }

    componentWillUnmount() {
        if (this.state.url) {
            window.URL.revokeObjectURL(this.state.url);
        }
    }

    render() {
        const { downloadText, filename, status } = this.props;

        if (status) {
            return <span>{status}</span>;
        }
        if (this.state.url !== undefined) {
            // Would be better to auto-download, like some of the answers at http://stackoverflow.com/q/3665115/786644
            return (
                <a href={this.state.url} download={filename}>
                    {downloadText}
                </a>
            );
        }

        return null;
    }
}

DownloadDataLink.propTypes = {
    data: PropTypes.string,
    downloadText: PropTypes.string.isRequired,
    filename: PropTypes.string,
    mimeType: PropTypes.string.isRequired,
    status: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
};

export default DownloadDataLink;
