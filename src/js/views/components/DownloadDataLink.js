const React = require('react');

class DownloadDataLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            url: null,
        };
    }

    componentWillUnmount() {
        if (this.state.url) {
            window.URL.revokeObjectURL(this.state.url);
        }
    }

    componentWillReceiveProps(nextProps) {
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
                    url: null,
                });
            }
        }
    }

    render() {
        const {downloadText, filename, status} = this.props;

        if (status) {
            return <span>{status}</span>;
        }
        if (this.state.url) {
            // Would be better to auto-download, like some of the answers at http://stackoverflow.com/q/3665115/786644
            return <a href={this.state.url} download={filename} data-no-davis="true">
                {downloadText}
            </a>;
        }

        return null;
    }
}
DownloadDataLink.propTypes = {
    data: React.PropTypes.string,
    downloadText: React.PropTypes.string.isRequired,
    filename: React.PropTypes.string,
    mimeType: React.PropTypes.string.isRequired,
    status: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.string,
    ]),
};

module.exports = DownloadDataLink;
