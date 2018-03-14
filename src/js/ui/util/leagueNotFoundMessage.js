// @flow

import * as React from "react";

// Most of this text came from basketball-gm.com and the FAQ

const leagueNotFoundMessage = (
    <div>
        <h2>League not found</h2>
        <div style={{ margin: "4em 0", textAlign: "center" }}>
            <h3>Play Basketball GM now!</h3>
            <a
                href="/new_league"
                className="btn btn-success btn-lg"
                style={{ margin: "0.5em" }}
            >
                Create a new league
            </a>
            <span className="hidden-xs" style={{ marginRight: "3em" }} />
            <a
                href="/"
                className="btn btn-primary btn-lg"
                style={{ margin: "0.5em" }}
            >
                Load an existing league
            </a>
        </div>
        <div className="row">
            <div className="col-md-6">
                <h3>New to Basketball GM?</h3>
                <p>
                    Have you ever looked at the decisions made by the front
                    office of an NBA team and thought you could do better? Well,
                    now you can! In Basketball GM, you are the general manager
                    of a basketball team.
                </p>
                <div className="row">
                    <div className="col-sm-6 col-md-12 col-lg-6">
                        <h4>You Set The Strategy</h4>
                        <p>
                            Running a basketball team requires you to make tough
                            decisions.
                        </p>
                        <ol>
                            <li>
                                Should you resign a veteran player, or leave cap
                                space open to sign a free agent?
                            </li>
                            <li>
                                Should you draft a raw player who could be a
                                star, or someone who can contribute right away?
                            </li>
                            <li>
                                Should you trade away next season's draft pick
                                for a player who can help you win now, or
                                stockpile assets for the future?
                            </li>
                            <li>
                                Should you raise ticket prices and annoy your
                                fans, or can you cut part of your budget
                                instead?
                            </li>
                        </ol>
                        <p>
                            Make the right choices and you can build a dynasty.
                            But make the wrong choices and you'll get fired!
                        </p>
                    </div>
                    <div className="col-sm-6 col-md-12 col-lg-6">
                        <h4>High Quality, No Junk</h4>
                        <p>
                            Basketball GM is completely 100% free. You can start
                            as many leagues as you want and play as many seasons
                            as you want. No limits.
                        </p>
                        <p>
                            We won't ask for your email address and send you
                            spam. We won't force you to sign in with your
                            Facebook account and spam your friends. We won't ask
                            you to pay money to keep playing or to buy
                            game-breaking power-ups.
                        </p>
                        <p>
                            Our only goal is making the best possible basketball
                            management game!
                        </p>
                    </div>
                </div>
            </div>
            <div className="col-md-6">
                <h3>Expecting to find a league here?</h3>
                <p>
                    Basketball GM stores all game data on your computer, in your
                    browser profile. This means that you can't play one league
                    on multiple devices unless you export it (from the Tools
                    menu) and then create a new league with that file. So first,{" "}
                    <b>
                        make sure you're using the same browser on the same
                        computer
                    </b>.
                </p>
                <p>
                    If you are using the same browser on the same computer and
                    your leagues are missing, the game data has probably been
                    deleted. This can happen in places like schools and
                    libraries that set browsers to automatically delete
                    everything when they are closed. It also happens if you
                    manually delete your browser data. For example, in Chrome,
                    if you go to More tools > Clear browsing data... > Cookies
                    and other site and plugin data, that will delete all your
                    Basketball GM data.{" "}
                    <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=340821">
                        This is true even if you tell it to only delete data
                        from today - if you played Basketball GM at all today,
                        it will completely delete all your leagues.
                    </a>{" "}
                    Browsers may also delete data if disk space is running low,
                    but I'm not sure if that ever actually happens.
                </p>
                <p>
                    In cases where the data has been deleted from your browser
                    profile, the only way to get it back is if you have a
                    backup. Sorry :(
                </p>
            </div>
        </div>
    </div>
);

export default leagueNotFoundMessage;
