/**
 * @name util.message
 * @namespace Messages from the owner of the team to the GM.
 */
define(["globals", "util/random"], function (g, random) {
    "use strict";

    var activities, champs, intro, first, money, ovr, wins;

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
        "perfecting my money laundering infrastructure (owning this team is very helpful)"
    ];

    // Intro of annual message
    intro = [];
    intro = [
        "Sorry we haven't chatted much this year, but I've been busy {{activity}}. "
    ];

    // First index: wins. Second index: championships. Third index: money
    // 0: bad
    // 1: mediocre
    // 2: good

    // Wins
    wins = [];
    wins[0] = [
        "This is an embarassment. We lose so much, I can't even show my face around town. Buying this team was supposed to make me a celebrity, but not one of those bad celebrities that everyone hates. Turn it around.",
        "I need some wins. Fans hate losers. Free agents hate losers. What's your strategy? Keep on losing until I fire you? You're making good progress, then."
    ];
    wins[1] = [
        "So, I mean, it could be worse. But that's not good enough."
    ];
    wins[2] = [
        "I'm happy with our regular season performance."
    ];

    // Championships
    champs = [];
    champs[0] = [
        "This town is starving, absolutely starving, for some postseason success. But with the job you're doing, we're not even close to the playoffs. Unacceptable.",
        "Playoffs? Don't talk to me about playoffs. You kidding me? Playoffs? I just hope we can win a game!"
    ];
    champs[1] = [
        "Hey. I'm a champion. I don't know about you, but that's what my teams do. They win championships. Yeah, making the playoffs is okay I guess, but I'm not satisfied.",
        "We need to make some noise in the playoffs. Soon."
    ];
    champs[2] = [
        "I do love being in title contention. It's a great feeling."
    ];

    // Money
    money = [];
    money[0] = [
        "Money is an issue. I'm going broke. This is ridiculous. I'm supposed to be rich, but I can barely afford my monacle polish these days."
    ];
    money[1] = [
        "Listen. I need another private jet. Cut back on spending, increase revenue, whatever. I'm not an accountant. I just know I need another jet."
    ];
    money[2] = [
        "I just bought a nuclear submarine from the Russians. You believe that? That's all thanks to you. Keep pinching those pennies!"
    ];

    // Overall
    ovr = [];
    ovr[0] = [
        "This is like Custer's Last Stand. You're Custer, I'm an Indian. I don't like your odds. You don't have much time left if you don't improve.",
        "Bye.",
        "Please, don't bother me until you have some good news.",
        "I'm watching you. Seriously, one of your assistant coaches is a spy. Don't fuck up."
    ];
    ovr[1] = [
        "You bore me. Everything about you, it's just boring. Come talk to me when you've earned me more millions and won me some more championships."
    ];
    ovr[2] = [
        "Anyway, I'm happy with the progress you've made, but I need to get back to {{activity}}."
    ];

    function generate(cb) {
        var activity1, activity2, m, tx;

        if (g.season === g.startingSeason) {
            m = random.choice(first);
        } else {
            activity1 = random.choice(activities);
            activity2 = random.choice(activities);
            while (activity1 !== activity2) {
                activity2 = random.choice(activities);
            }

            m = "<p>" + random.choice(intro).replace("{{activity}}", activity1) + "</p>" +
                "<p>" + random.choice(wins[0]) + " " + random.choice(champs[1]) + "</p>" +
                "<p>" + random.choice(money[2]) + "</p>" +
                "<p>" + random.choice(ovr[0]).replace("{{activity}}", activity2) + "</p>";
        }

        tx = g.dbl.transaction("messages", "readwrite");
        tx.objectStore("messages").add({
            read: false,
            from: "The Owner",
            year: g.season,
            text: m
        });
        tx.oncomplete = function () {
            cb();
        };
    }

    return {
        generate: generate
    };
});