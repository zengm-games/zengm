const React = require('react');

module.exports = Component => {
    return class Clickable extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
        }

        toggleClicked(clickedNode) {
            // Don't toggle the row if a link was clicked.
            if (clickedNode.target.nodeName === 'A') {
                return true;
            }

            this.setState({
                clicked: !this.state.clicked,
            });
        }

        render() {
            return <Component {...this.props} {...this.state} toggleClicked={clickedNode => this.toggleClicked(clickedNode)} />;
        }
    };
};
