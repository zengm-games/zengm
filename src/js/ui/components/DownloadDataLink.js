// @flow

import PropTypes from 'prop-types';
import React from 'react';

type Props = {
    data?: string,
    downloadText: string,
    filename?: string,
    mimeType: string,
    status: React.Element<*> | string,
};

type State = {
    url?: string,
};

class DownloadDataLink extends React.Component {
    props: Props;
    state: State;

    constructor(props: Props) {
        super(props);
        this.state = {
            url: undefined,
        };
    }

    componentWillReceiveProps(nextProps: Props) {
        if (this.props.data !== nextProps.data) {
            // Expire any current URL from the old data
            if (this.state.url) {
                window.URL.revokeObjectURL(this.state.url);
            }

            if (nextProps.data) {
                // Magic number from http://stackoverflow.com/a/18925211/786644 to force UTF-8 encoding
                const blob = new Blob(["\ufeff", nextProps.data], {type: nextProps.mimeType});
                const url = window.URL.createObjectURL(blob);

                this.setState({
                    url,
                });
            } else {
                this.setState({
                    url: undefined,
                });
            }
        }
    }

    componentWillUnmount() {
        if (this.state.url) {
            window.URL.revokeObjectURL(this.state.url);
        }
    }

    render() {
        const {downloadText, filename, status} = this.props;

        if (status) {
            return <span>{status}</span>;
        }
        if (this.state.url !== undefined) {
            // Would be better to auto-download, like some of the answers at http://stackoverflow.com/q/3665115/786644
            return <a href={this.state.url} download={filename}>
                {downloadText}
            </a>;
        }

        return null;
    }
}

DownloadDataLink.propTypes = {
    data: PropTypes.string,
    downloadText: PropTypes.string.isRequired,
    filename: PropTypes.string,
    mimeType: PropTypes.string.isRequired,
    status: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
};

export default DownloadDataLink;
