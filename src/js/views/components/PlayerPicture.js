const faces = require('facesjs');
const React = require('react');

class PlayerPicture extends React.Component {
    componentDidMount() {
        if (this.wrapper) {
            faces.display(this.wrapper, this.props.face);
        }
    }

    componentDidUpdate() {
        if (this.wrapper) {
            faces.display(this.wrapper, this.props.face);
        }
    }

    render() {
        if (this.props.imgURL) {
            this.wrapper = null;
            return <img
                src={this.props.imgURL}
                style={{maxHeigth: '100%', maxWidth: '100%'}}
            />;
        }

        if (this.props.face) {
            return <div ref={wrapper => {
                this.wrapper = wrapper;
            }} />;
        }

        return null;
    }
}
PlayerPicture.propTypes = {
    face: React.PropTypes.object,
    imgURL: React.PropTypes.string,
};

module.exports = PlayerPicture;
