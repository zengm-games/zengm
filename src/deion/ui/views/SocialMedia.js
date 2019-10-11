// @flow

import PropTypes from "prop-types";
import React, { useState } from "react";
import { NewWindowLink } from "../components";
import { setTitle } from "../util";

const SocialMedia = ({ teamName }: { teamName: string }) => {
    setTitle("Social Media");

    const [tweet, setTweet] = useState();
    const [replies, setReplies] = useState([]);

    const tweetOptions = {
        slide: ["You trying to get the pipe?"],
        motivtional: [
            "It does not matter how slowly you go as long as you do not stop.",
            "Failure will never overtake me if my determination to succeed is strong enough.",
            "Life is 10% what happens to you and 90% how you react to it.",
            "Good, better, best. Never let it rest. 'Til your good is better and your better is best.",
            "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.",
            "Trust because you are willing to accept the risk, not because it's safe or certain.",
            "All our dreams can come true if we have the courage to pursue them.",
            "Just when the caterpillar thought the world was ending, he turned into a butterfly.",
            "Successful entrepreneurs are givers and not takers of positive energy.",
            "Great minds discuss ideas; average minds discuss events; small minds discuss people.",
            "If you don't value your time, neither will others. Stop giving away your time and talents--start charging for it.",
            "If you're going through hell keep going.",
            "When you stop chasing the wrong things, you give the right things a chance to catch you.",
            "No masterpiece was ever created by a lazy artist.",
            "Knowledge is being aware of what you can do. Wisdom is knowing when not to do it.",
            "You can do anything, but not everything.",
            "Knowledge is being aware of what you can do. Wisdom is knowing when not to do it.",
        ],
        promote: [
            "We're the best!",
            `You can't stop the ${teamName}.`,
            `#${teamName.replace(/ /g, "")}Pride`,
            "This is our year, I can feel it.",
            `Go ${teamName}!`,
        ],
        hongKong: ["Fight for freedom, stand with Hong Kong"],
    };

    const replyOptions = {
        slide: [
            "Ew, no.",
            "Gross.",
            "Go away.",
            "Stop messaging me!",
            "I thought I blocked you already!",
            "Fuck you. You can't just go around harassing women like this. Who do you think you are, Isiah Thomas? #metoo",
            "Okay, I can see that you're rich, but how rich are you?",
        ],
    };

    const sendTweet = async type => {
        const newTweet =
            tweetOptions[type][
                Math.floor(tweetOptions[type].length * Math.random())
            ];
        setTweet(newTweet);

        const newReplies = [];
        if (type === "slide") {
            if (Math.random() < 0.75) {
                newReplies.push({
                    name: null,
                    tweet: "...no reply!",
                });
            } else {
                newReplies.push({
                    name: null,
                    tweet:
                        replyOptions[type][
                            Math.floor(
                                replyOptions[type].length * Math.random(),
                            )
                        ],
                });
            }
        } else if (type === "hongKong") {
            newReplies.push({
                name: "@hujintao",
                tweet: `Effective immediately, I am banning @${teamName.replace(
                    / /g,
                    "",
                )}GM, for life, from any association with China.`,
            });
            newReplies.push({
                name: "Thousands of Chinese accounts",
                tweet: "NMSL",
            });
            newReplies.push({
                name: "@LeagueCommissioner",
                tweet: `What could possibly have possessed you to send such a rude and offensive Tweet? On behalf of the ${teamName} I sincerely apologize for the stupid, stupid actions of @${teamName.replace(
                    / /g,
                    "",
                )}GM.`,
            });
            newReplies.push({
                name: `@${teamName.replace(/ /g, "")}Owner`,
                tweet: "You're this close to being fired.",
            });
        }

        setReplies(newReplies);
    };

    return (
        <>
            <h1>
                Social Media <NewWindowLink />
            </h1>

            <div className="row">
                <div className="col-md">
                    <div className="card">
                        <div className="card-body">
                            <p className="card-text">
                                Tweet some generic motivational quote.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => sendTweet("motivtional")}
                            >
                                Tweet
                            </button>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-body">
                            <p className="card-text">Promote your team.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => sendTweet("promote")}
                            >
                                Tweet
                            </button>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-body">
                            <p className="card-text">
                                Try to slide into the DMs of some random thot.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => sendTweet("slide")}
                            >
                                Tweet
                            </button>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-body">
                            <p className="card-text">
                                Retweet some seemingly-innocuous message about
                                supporting the protests in Hong Kong.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => sendTweet("hongKong")}
                            >
                                Tweet
                            </button>
                        </div>
                    </div>
                </div>
                <div className="col-md">
                    {tweet ? (
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{`@${teamName.replace(
                                    / /g,
                                    "",
                                )}GM`}</h5>
                                <p className="card-text">{tweet}</p>
                            </div>
                        </div>
                    ) : null}
                    {replies.length > 0 ? (
                        <>
                            <h5 className="mt-3">Replies</h5>
                            {replies.map((reply, i) =>
                                reply.tweet === "...no reply!" ? (
                                    <p key={i}>{reply.tweet}</p>
                                ) : (
                                    <div key={i} className="card mt-3">
                                        <div className="card-body">
                                            {reply.name ? (
                                                <h5 className="card-title">
                                                    {reply.name}
                                                </h5>
                                            ) : null}
                                            <p className="card-text">
                                                {reply.tweet}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
};

SocialMedia.propTypes = {
    teamName: PropTypes.string.isRequired,
};

export default SocialMedia;
