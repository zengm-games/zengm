import React from "react";
import useTitleBar from "../../hooks/useTitleBar";
import Login from "./Login";
import Register from "./Register";
const ajaxErrorMsg =
	"Error connecting to server. Check your Internet connection or try again later.";
const otherSport =
	process.env.SPORT === "basketball" ? "Football" : "Basketball";

const LoginOrRegister = () => {
	useTitleBar({
		title: "Login or Register",
	});
	return (
		<>
			<div className="row">
				<div className="col-sm-12 col-md-10 col-lg-8">
					<p>Creating an account enables two features:</p>
					<ol>
						<li>
							Your achievements will be stored in the cloud. If you don't make
							an account, you can still{" "}
							<a href="/account">
								view your achievements from leagues in this browser
							</a>
							.
						</li>
						<li>
							You can sign up for GM Gold, which removes all ads from this game
							and{" "}
							<a href={`https://play.${otherSport.toLowerCase()}-gm.com/`}>
								{otherSport} GM
							</a>
							.
						</li>
					</ol>
					<p>
						That's it. It won't sync your leagues across devices yet. I hope it
						will some day!
					</p>
				</div>
			</div>

			<div className="row">
				<div className="col-sm-6 col-md-5 col-lg-4">
					<Login ajaxErrorMsg={ajaxErrorMsg} />
				</div>
				<div className="col-sm-6 col-md-5 col-lg-4">
					<Register ajaxErrorMsg={ajaxErrorMsg} />
				</div>
			</div>
		</>
	);
};

export default LoginOrRegister;
