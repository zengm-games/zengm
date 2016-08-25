const React = require('react');

class DownloadJsonLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expired: false,
            url: null,
        };
    }

    componentWillUnmount() {
        if (this.state.url) {
            window.URL.revokeObjectURL(this.state.url);
        }
        if (this.state.timeoutId) {
            window.clearTimeout(this.state.timeoutId);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.data !== nextProps.data) {
            // Expire any current URL from the old data
            if (this.state.url) {
                window.URL.revokeObjectURL(this.state.url);
            }
            if (this.state.timeoutId) {
                window.clearTimeout(this.state.timeoutId);
            }

            if (nextProps.data) {
                const json = JSON.stringify(nextProps.data, undefined, 2);
                const blob = new Blob([json], {type: "application/json"});
                const url = window.URL.createObjectURL(blob);

                // Delete object, eventually
                const timeoutId = window.setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    this.setState({
                        expired: true,
                        url: null,
                        timeoutId: null,
                    });
                }, 60 * 1000);

                this.setState({
                    expired: false,
                    url,
                    timeoutId,
                });
            } else {
                this.setState({
                    expired: false,
                    url: null,
                    timeoutId: null,
                });
            }
        }
    }

    render() {
        const {downloadText, filename, status} = this.props;

        if (status) {
            return <span>{status}</span>;
        }
        if (this.state.expired) {
            return <span>Download link expired</span>;
        }
        if (this.state.url) {
            return <a href={this.state.url} download={filename} data-no-davis="true">
                {downloadText}
            </a>;
        }

        return null;
    }
}
DownloadJsonLink.propTypes = {
    data: React.PropTypes.object,
    downloadText: React.PropTypes.string.isRequired,
    filename: React.PropTypes.string,
    status: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.string,
    ]),
};

module.exports = DownloadJsonLink;
