const React = require('react');

module.exports = Component => {
    return class Clickable extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
        }

        toggleClicked(event) {
            const ignoredElements = ['A', 'BUTTON', 'SELECT'];

            // Don't toggle the row if a link was clicked.
            if (ignoredElements.indexOf(event.target.nodeName) > -1) {
                return;
            }

            this.setState({
                clicked: !this.state.clicked,
            });
        }

        render() {
            return <Component {...this.props} {...this.state} toggleClicked={event => this.toggleClicked(event)} />;
        }
    };
};
