import $ from 'jquery';
import React from 'react';
import g from '../../globals';
import bbgmViewReact from '../../util/bbgmViewReact';

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

class LostPassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lostpwError: null,
            lostpwSuccess: null,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }


    async handleSubmit(e) {
        e.preventDefault();

        const $lostpw = $("#lostpw");

        this.setState({
            lostpwError: null,
            lostpwSuccess: null,
        });

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/lost_password.php`,
            data: `${$lostpw.serialize()}&sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
            success: data => {
                if (data.success) {
                    this.setState({lostpwSuccess: 'Check your email for further instructions.'});
                } else {
                    this.setState({lostpwError: 'Account not found.'});
                }
            },
            error: () => {
                this.setState({lostpwError: ajaxErrorMsg});
            },
        });
    }

    render() {
        bbgmViewReact.title('Lost Password');

        return <div>
            <div className="row">
                <div className="col-lg-4 col-md-4 col-sm-3 hidden-xs" />
                <div className="col-lg-4 col-md-4 col-sm-6">
                    <h1>Lost Password</h1>
                    <p>Enter your username or email address below to recover your login information.</p>
                    <form onSubmit={this.handleSubmit} id="lostpw">
                        <div className="form-group">
                            <label className="control-label" htmlFor="lostpw-entry">Username or Email Address</label>
                            <input type="text" className="form-control" id="lostpw-entry" name="entry" required="required" />
                        </div>
                        <button type="submit" className="btn btn-default btn-primary">Recover Login Info</button>
                        <p className="text-danger" id="lostpw-error" style={{marginTop: '1em'}}>{this.state.lostpwError}</p>
                        <p className="text-success" id="lostpw-success" style={{marginTop: '1em'}}>{this.state.lostpwSuccess}</p>
                    </form>
                </div>
            </div>
        </div>;
    }
}

export default LostPassword;
