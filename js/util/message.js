/**
 * @name util.message
 * @namespace Messages from the owner of the team to the GM.
 */
define(["dao", "globals", "lib/bluebird", "util/helpers", "util/random"], function (dao, g, Promise, helpers, random) {
    "use strict";

    var activities, first, intro, money, ovr, playoffs, wins;

    // First message after new game
    first = [
        "<p>Hey, sorry I didn't recognize you in the lobby this morning. I'm sure I'll get to know you eventually. Maybe after I get back from my trip to Tahiti?</p><p>Well, listen. Times are rough. Profit only increased by 10% last year. I know, I know, horrible. And I had to let half of our junior staffers go just to get that 10%!</p><p>So I'll cut right to the chase. I need money. And championships. Money and championships, that's what I'm interested in.</p><p>Get it done.</p>"
    ];

    // Random activities the owner claims to be doing
    activities = [
        "learning how to windsurf while carrying a naked girl on my back",
        "working on my new \"mountaintop removal\" mining company (it's fascinating stuff)",
        "having sex with half the freshman girls at the local university (it's hard work, believe me)",
        "working on my charity, Sugar Daddies for Disadvantaged Hotties",
        "lobbying the government to invade Peru (those bastards)",
        "organizing orgies at the governor's mansion (he's a very particular gentleman)",
        "working with my new PR agency on that whole \"child slave sweatshop\" scandal",
        "lobbying the FDA to allow me to market ground horse meat as \"ground beeef\" (I already trademarked \"beeef\")",
        "arguing with my fourth wife's lawyer",
        "defending my real estate business from entirely frivolous lawsuits (can you believe they called me a \"slum lord\"?)",
        "managing my Ponzi scheme... I mean hedge fund, hedge fund, it's a hedge fund",
        "fighting that ridiculous sexual harassment lawsuit (it's not that bad, my lawyer is a total babe)",
        "bribing the mayor to build a new lane on the highway just for me",
        "running my baseball team (baseball is a religion, basketball is a game)",
        "trying to patent the gene for height so I can sue our competition to pieces",
        "bribing the commissioner to let me ref our games",
        "bribing the commissioner to rig the draft for us",
        "buying cars and jewelry for middle school basketball prospects so they'll sign here when they turn pro",
        "flying to every country in the world on my private jet (except Peru)",
        "promoting my chain of brothels in Cambodia",
        "working on my golf game with Kim Jong Il (no, he's not dead)",
        "lobbying the Senate to eliminate the minimum wage",
        "lobbying the state government for more subsidies",
        "figuring out how to fit in more courtside seats for celebrities",
        "coming up with a way to slightly shrink or expand the hoop, depending on which one we're shooting at",
        "perfecting my money laundering infrastructure (owning this team is very helpful)",
        "making sure my \"girlfriends\" aren't posting pictures with black people on Instagram (how many times do I have to tell them??)"
    ];

    // Intro of annual message
    intro = [];
    intro = [
        "Sorry we haven't chatted much this year, but I've been busy {{activity}}. "
    ];

    // 0: bad overall, getting worse
    // 1: bad overall, improving
    // 2: mediocre
    // 3: good overall, getting worse
    // 4: good overall, improving

    // Wins
    wins = [];
    wins[0] = [
        "This is an embarassment. We lose so much, I can't even show my face around town. Buying this team was supposed to make me a celebrity, but not one of those bad celebrities that everyone hates. Turn it around.",
        "I need some wins. Fans hate losers. Free agents hate losers. What's your strategy? Keep on losing until I fire you? You're making good progress, then."
    ];
    wins[1] = [
        "I recognize we're getting better and our team has some potential for growth, but don't fuck this up. You've already used up most of my patience.",
        "You keep telling me we have \"potential\", but potential doesn't win games."
    ];
    wins[2] = [
        "So, I mean, it could be worse. But that's not good enough.",
        "In this league, mediocrity can be worse than losing. I hope you have some plan to get us to the next level."
    ];
    wins[3] = [
        "Don't think you can coast on your past success for too long. I'm not planning on rebuilding for a decade.",
        "What have you done for me lately?"
    ];
    wins[4] = [
        "I'm pleased with our regular season performance.",
        "I like the roster you've put together. We'll be at the top of our division for a long time."
    ];

    // Playoffs
    playoffs = [];
    playoffs[0] = [
        "This town is starving, absolutely starving, for some postseason success. But with the job you're doing, we're not even close to the playoffs. Unacceptable.",
        "Playoffs? Don't talk to me about playoffs. You kidding me? Playoffs? I just hope we can win a game!"
    ];
    playoffs[1] = [
        "In this town, you can't just be happy with making the playoffs. You have to get to the next level.",
        "A first round playoff exit is boring."
    ];
    playoffs[2] = [
        "Hey. I'm a champion. I don't know about you, but that's what my teams do. They win championships. Yeah, making the playoffs is okay I guess, but I'm not satisfied.",
        "We need to make some real noise in the playoffs. Soon."
    ];
    playoffs[3] = [
        "Consistent playoff success is the standard. Never forget that.",
        "I hope you don't plan on missing the playoffs again."
    ];
    playoffs[4] = [
        "Winning titles can cover up a lot of flaws.",
        "I need some more jewelry. Go get me another ring."
    ];

    // Money
    money = [];
    money[0] = [
        "Money is an issue. I'm going broke. This is ridiculous. I'm supposed to be rich, but I can barely afford my monacle polish these days.",
        "I can't afford a season in the red. Is it really that hard to turn a big profit in this business?"
    ];
    money[1] = [
        "I like the recent financial turnaround you engineered. But I can't afford any setback."
    ];
    money[2] = [
        "Listen. I need another private jet. Cut back on spending, increase revenue, whatever. I'm not an accountant. I just know I need another jet.",
        "I didn't buy this team just for fun. We should be making a higher profit."
    ];
    money[3] = [
        "Just because you made some money in the past doesn't mean you're allowed to lose money now.",
        "I liked what you were doing before this year, financially. This year, not so much."
    ];
    money[4] = [
        "I just bought a nuclear submarine from the Russians. You believe that? That's all thanks to you. Keep pinching those pennies!",
        "I just looked over the team finances. I like what I see. Keep up the good work there."
    ];

    // 0: bad
    // 1: mediocre
    // 2: good

    // Overall
    ovr = [];
    ovr[0] = [
        "Bye.",
        "Please, don't bother me until you have some good news.",
        "I'm watching you. Seriously, one of your assistant coaches is a spy. Don't fuck up."
    ];
    ovr[1] = [
        "You bore me. Everything about you, it's just boring. Come talk to me when you've earned me more millions and won me some more championships.",
        "You know, general managers aren't hired to be mediocre. Do better next year.",
        "I've been meaning to tell you about this great idea I had. What if we only play 4 guys on defense, so the other guy can just wait for an easy score at the other end? Pure genius, isn't it?"
    ];
    ovr[2] = [
        "Anyway, overall I'm happy with the progress you've made, but I need to get back to {{activity}}."
    ];

    /**
     * @param {IDBTransaction} tx An IndexedDB transaction on gameAttributes and messages, readwrite.
     */
    function generate(tx, deltas) {
        var activity1, activity2, indMoney, indOvr, indPlayoffs, indWins, m, ownerMoodSum;

        // If auto play seasons or multi team mode, no messages
        if (g.autoPlaySeasons > 0 || g.userTids.length > 1) {
            return Promise.resolve();
        }

        ownerMoodSum = g.ownerMood.wins + g.ownerMood.playoffs + g.ownerMood.money;

        if (g.showFirstOwnerMessage) {
            m = random.choice(first);
            require("core/league").setGameAttributes(tx, {showFirstOwnerMessage: false}); // Okay that this is async, since it won't be called again until much later
        } else {
            activity1 = random.choice(activities);
            activity2 = random.choice(activities);
            while (activity1 === activity2) {
                activity2 = random.choice(activities);
            }

            indWins = 2;
            if (g.ownerMood.wins <= 0 && deltas.wins < 0) {
                indWins = 0;
            } else if (g.ownerMood.wins < -0.5 && deltas.wins >= 0) {
                indWins = 1;
            } else if (g.ownerMood.wins > 0 && deltas.wins < 0) {
                indWins = 3;
            } else if (g.ownerMood.wins > 0 && deltas.wins > 0) {
                indWins = 4;
            }

            if (g.ownerMood.playoffs <= 0 && deltas.playoffs < 0) {
                indPlayoffs = 0;
            } else if (g.ownerMood.playoffs <= 0 && deltas.playoffs === 0) {
                indPlayoffs = 1;
            } else if (g.ownerMood.playoffs <= 0 && deltas.playoffs > 0) {
                indPlayoffs = 2;
            } else if (g.ownerMood.playoffs >= 0 && deltas.playoffs >= 0) {
                indPlayoffs = 2;
            } else if (g.ownerMood.playoffs >= 0 && deltas.playoffs < 0) {
                indPlayoffs = 3;
            }
            if (deltas.playoffs === 0.2) {
                indPlayoffs = 4;
            }

            indMoney = 2;
            if (g.ownerMood.money < 0 && deltas.money < 0) {
                indMoney = 0;
            } else if (g.ownerMood.money < -0.5 && deltas.money >= 0) {
                indMoney = 1;
            } else if (g.ownerMood.money > 0 && deltas.money < 0) {
                indMoney = 3;
            } else if (g.ownerMood.money > 0 && deltas.money > 0) {
                indMoney = 4;
            }

            indOvr = 1;
            if (ownerMoodSum > 0.5) {
                indOvr = 2;
            } else if (ownerMoodSum < -0.5) {
                indOvr = 0;
            }

            if (ownerMoodSum > -1) {
                m = "<p>" + random.choice(intro).replace("{{activity}}", activity1) + "</p>" +
                    "<p>" + random.choice(wins[indWins]) + " " + random.choice(playoffs[indPlayoffs]) + "</p>" +
                    "<p>" + random.choice(money[indMoney]) + "</p>" +
                    "<p>" + random.choice(ovr[indOvr]).replace("{{activity}}", activity2) + "</p>";
            } else if (g.season < g.gracePeriodEnd || g.godMode) {
                if (deltas.wins < 0 && deltas.playoffs < 0 && deltas.money < 0) {
                    m = "<p>What the hell did you do to my franchise?! I'd fire you, but I can't find anyone who wants to clean up your mess.</p>";
                } else if (deltas.money < 0 && deltas.wins >= 0 && deltas.playoffs >= 0) {
                    m = "<p>I don't care what our colors are. I need to see some green! I won't wait forever. MAKE ME MONEY.</p>";
                } else if (deltas.money >= 0 && deltas.wins < 0 && deltas.playoffs < 0) {
                    m = "<p>Our fans are out for blood. Put a winning team together, or I'll let those animals have you.</p>";
                } else {
                    m = "<p>The longer you keep your job, the more I question why I hired you. Do better or get out.</p>";
                }
            } else {
                if (g.ownerMood.wins < 0 && g.ownerMood.playoffs < 0 && g.ownerMood.money < 0) {
                    m = "<p>You've been an all-around disappointment. You're fired.</p>";
                } else if (g.ownerMood.money < 0 && g.ownerMood.wins >= 0 && g.ownerMood.playoffs >= 0) {
                    m = "<p>You've won some games, but you're just not making me enough profit. It's not all about wins and losses, dollars matter too. You're fired.</p>";
                } else if (g.ownerMood.money >= 0 && g.ownerMood.wins < 0 && g.ownerMood.playoffs < 0) {
                    m = "<p>I like that you've made a nice profit for me, but you're not putting a competitive team on the court. We need a new direction. You're fired.</p>";
                } else {
                    m = "<p>You're fired.</p>";
                }
                m += '<p>I hear a few other teams are looking for a new GM. <a href="' + helpers.leagueUrl(["new_team"]) + '">Take a look.</a> Please, go run one of those teams into the ground.</p>';
            }
        }

        return dao.messages.add({
            ot: tx,
            value: {
                read: false,
                from: "The Owner",
                year: g.season,
                text: m
            }
        }).then(function () {
            if (ownerMoodSum > -1) {
                return;
            }
            if (g.season < g.gracePeriodEnd || g.godMode) {
                // Can't get fired yet... or because of God Mode
                return;
            }
            // Fired!
            return require("core/league").setGameAttributes(tx, {
                gameOver: true,
                showFirstOwnerMessage: true
            });
        });
    }

    return {
        generate: generate
    };
});