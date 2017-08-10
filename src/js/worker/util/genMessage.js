// @flow

import {g, helpers} from '../../common';
import {league} from '../core';
import {idb} from '../db';
import {local, random} from '../util';
import type {OwnerMoodDeltas} from '../../common/types';

// First message after new game
const first = [
    "<p>Hey, sorry I didn't recognize you in the lobby this morning. I'm sure I'll get to know you eventually. Maybe after I get back from my trip to Tahiti?</p><p>Well, listen. Times are rough. Profit only increased by 10% last year. I know, I know, horrible. And I had to let half of our junior staffers go just to get that 10%!</p><p>So I'll cut right to the chase. I need money. And championships. Money and championships, that's what I'm interested in.</p><p>Get it done.</p>",
];

// Random activities the owner claims to be doing
const activities = [
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
    "making sure my \"girlfriends\" aren't posting pictures with black people on Instagram (how many times do I have to tell them??)",
    "trying to run for President. I heard anyone can do it these days",
    "convincing the commissioner to let me get another team so we can use one to get high draft picks and trade them to the other for nothing! (Its brilliant, isn't it?)",
    "experimenting with magnets so our shots go in more often. How do the work?",
    "playing BasketballGM online. I don't know why I'm paying you, this is easy!",
    "promoting my own shoe brand for the league to use instead",
    "ignoring all your messages",
    "buying all the land on Mars before that car guy gets there",
    "negotiating to lower the salary cap and max contracts. I mean, they only play a sport, why do they get to make so much anyway?",
    "trying to open this safe I found a few years ago",
    "trying to clone myself. I have a debt to society that needs to be paid soon. Wait, forget I said that...",
    "trying to find my wife Becky, no, Sarah. Wait, which marriage is still ongoing?",
];

// Intro of annual message
const intro = [
    "Sorry we haven't chatted much this year, but I've been busy {{activity}}. ",
];

// 0: bad overall, getting worse
// 1: bad overall, improving
// 2: mediocre
// 3: good overall, getting worse
// 4: good overall, improving

// Wins
const wins = [];
wins[0] = [
    "This is an embarrassment. We lose so much, I can't even show my face around town. Buying this team was supposed to make me a celebrity, but not one of those bad celebrities that everyone hates. Turn it around.",
    "I need some wins. Fans hate losers. Free agents hate losers. What's your strategy? Keep on losing until I fire you? You're making good progress, then.",
    "What are you even doing? You keep talking about a process but I don't think I trust it anymore. Win now!",
    "How hard is it to tell your players to score more points and stop the other team? It isn't rocket science!",
];
wins[1] = [
    "I recognize we're getting better and our team has some potential for growth, but don't fuck this up. You've already used up most of my patience.",
    "You keep telling me we have \"potential\", but potential doesn't win games.",
    "I remember when we were terrible. Now we're just less terrible. I want wins more than you want this job apparently.",
    "Where did you go to college again? This is why I get for not even looking at your resume before hiring you. Last season better not have been a fluke or you'll be in trouble.",
];
wins[2] = [
    "So, I mean, it could be worse. But that's not good enough.",
    "In this league, mediocrity can be worse than losing. I hope you have some plan to get us to the next level.",
    "What year is it again? This team looks the same as it did last season. I want to see change! I want more wins! Mediocre teams get nowhere fast!",
    "The team was boring to watch this year. My girlfriend doesn't even know who we are! Now you're costing me more than just wins! Put up more wins so my girlfriend will put out more too!",
];
wins[3] = [
    "Don't think you can coast on your past success for too long. I'm not planning on rebuilding for a decade.",
    "What have you done for me lately?",
    "I'm not ready for the good ol' days to be over. You need to extend our reign in this league.",
    "I don't care who we lost in free agency or who got hurt. I expect improvement every season and last season was a disappointment.",
];
wins[4] = [
    "I'm pleased with our regular season performance.",
    "I like the roster you've put together. We'll be at the top of our division for a long time.",
    "The ceiling is the roof with this team! Keep it up!",
    "The goal is 82-0 and we are on our way. And by that I mean do it. Next season. 82-0.",
];

// Playoffs
const playoffs = [];
playoffs[0] = [
    "This town is starving, absolutely starving, for some postseason success. But with the job you're doing, we're not even close to the playoffs. Unacceptable.",
    "Playoffs? Don't talk to me about playoffs. You kidding me? Playoffs? I just hope we can win a game!",
    "Why are all of my friends' teams still playing in May while my team is at home getting fat on my dollar? I want playoffs!",
    "Do you know how embarrassed I was when I took my girlfriend to a playoff game and the security told us there wasn't any? She's not my girlfriend anymore thanks to you!",
];
playoffs[1] = [
    "In this town, you can't just be happy with making the playoffs. You have to get to the next level.",
    "A first round playoff exit is boring.",
    "I need the playoff revenue to make this hobby worth it. That means a deeper run next year, understood?",
    "Do you know what the goal of a team is? To win games. Try doing that more in the playoffs.",
];
playoffs[2] = [
    "Hey. I'm a champion. I don't know about you, but that's what my teams do. They win championships. Yeah, making the playoffs is okay I guess, but I'm not satisfied.",
    "We need to make some real noise in the playoffs. Soon.",
    "I bet a lot of money on us winning the championship next year, do you want to make me a liar? I didn't think so.",
    "I can almost taste the success. I want it. I want that metallic taste of a trophy in my mouth! AHAHAHAHA!",
];
playoffs[3] = [
    "Consistent playoff success is the standard. Never forget that.",
    "I hope you don't plan on missing the playoffs again.",
    "Playoffs don't really matter unless we win it all. Otherwise we're just using energy to fail. And I don't fail.",
    "Why do i keep seeing our championship shirts being worn in my factories? They should be wearing them here! Make it happen!",
];
playoffs[4] = [
    "Winning titles can cover up a lot of flaws.",
    "I need some more jewelry. Go get me another ring.",
    "I lost my last championship ring, can you get me another? Thanks.",
    "I gave my ring to my girlfriend, (she thought I was proposing and I couldn't think fast enough) so I need another one.",
];

// Money
const money = [];
money[0] = [
    "Money is an issue. I'm going broke. This is ridiculous. I'm supposed to be rich, but I can barely afford my monocle polish these days.",
    "I can't afford a season in the red. Is it really that hard to turn a big profit in this business?",
    "My accountant keeps telling me that we're losing money. I've ony declared bankruptcy twice and I will not do it again!",
    "Do you know where your salary comes from? The money you're supposed to be making! So if you can't make money, you won't be getting paid!",
];
money[1] = [
    "I like the recent financial turnaround you engineered. But I can't afford any setback.",
    "I took a hit in the market this year, who knew shorts had to be paid back? Anyway, keep improving so I can keep gambling... I mean, \"ivesting aggressively\".",
];
money[2] = [
    "Listen. I need another private jet. Cut back on spending, increase revenue, whatever. I'm not an accountant. I just know I need another jet.",
    "I didn't buy this team just for fun. We should be making a higher profit.",
    "You'd be doing okay if those numbers where in BitCoin, but they're not. So fix the problems.",
];
money[3] = [
    "Just because you made some money in the past doesn't mean you're allowed to lose money now.",
    "I liked what you were doing before this year, financially. This year, not so much.",
    "How am I supposed to pay off my goons when you can't keep cashflows up? I might have to send them after you if you can't make more money.",
];
money[4] = [
    "I just bought a nuclear submarine from the Russians. You believe that? That's all thanks to you. Keep pinching those pennies!",
    "I just looked over the team finances. I like what I see. Keep up the good work there.",
    "Man, that's a lot of commas. Keep it up and we'll have a long friendship.",
];

// 0: bad
// 1: mediocre
// 2: good

// Overall
const ovr = [];
ovr[0] = [
    "Bye.",
    "Please, don't bother me until you have some good news.",
    "I'm watching you. Seriously, one of your assistant coaches is a spy. Don't fuck up.",
    "K",
];
ovr[1] = [
    "You bore me. Everything about you, it's just boring. Come talk to me when you've earned me more millions and won me some more championships.",
    "You know, general managers aren't hired to be mediocre. Do better next year.",
    "I've been meaning to tell you about this great idea I had. What if we only play 4 guys on defense, so the other guy can just wait for an easy score at the other end? Pure genius, isn't it?",
    "Make more money, win more games, blah blah blah. I'm supposed to be in a meeting right now so I g2g.",
];
ovr[2] = [
    "Anyway, overall I'm happy with the progress you've made, but I need to get back to {{activity}}.",
    "Work will set you free amiright? Anyway, talk to you next season. Don't bother messaging me until then."'
];

async function genMessage(deltas: OwnerMoodDeltas) {
    // If auto play seasons or multi team mode, no messages
    if (local.autoPlaySeasons > 0 || g.userTids.length > 1) {
        return;
    }

    const ownerMoodSum = g.ownerMood.wins + g.ownerMood.playoffs + g.ownerMood.money;

    let m;
    if (g.showFirstOwnerMessage) {
        m = random.choice(first);
        await league.setGameAttributes({showFirstOwnerMessage: false});
    } else {
        const activity1 = random.choice(activities);
        let activity2 = random.choice(activities);
        while (activity1 === activity2) {
            activity2 = random.choice(activities);
        }

        let indWins = 2;
        if (g.ownerMood.wins <= 0 && deltas.wins < 0) {
            indWins = 0;
        } else if (g.ownerMood.wins < -0.5 && deltas.wins >= 0) {
            indWins = 1;
        } else if (g.ownerMood.wins > 0 && deltas.wins < 0) {
            indWins = 3;
        } else if (g.ownerMood.wins > 0 && deltas.wins > 0) {
            indWins = 4;
        }

        let indPlayoffs = 2;
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

        let indMoney = 2;
        if (g.ownerMood.money < 0 && deltas.money < 0) {
            indMoney = 0;
        } else if (g.ownerMood.money < -0.5 && deltas.money >= 0) {
            indMoney = 1;
        } else if (g.ownerMood.money > 0 && deltas.money < 0) {
            indMoney = 3;
        } else if (g.ownerMood.money > 0 && deltas.money > 0) {
            indMoney = 4;
        }

        let indOvr = 1;
        if (ownerMoodSum > 0.5) {
            indOvr = 2;
        } else if (ownerMoodSum < -0.5) {
            indOvr = 0;
        }

        if (ownerMoodSum > -1) {
            m = `<p>${random.choice(intro).replace("{{activity}}", activity1)}</p>
                 <p>${random.choice(wins[indWins])} ${random.choice(playoffs[indPlayoffs])}</p>
                 <p>${random.choice(money[indMoney])}</p>
                 <p>${random.choice(ovr[indOvr]).replace("{{activity}}", activity2)}</p>`;
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
            m += `<p>I hear a few other teams are looking for a new GM. <a href="${helpers.leagueUrl(["new_team"])}">Take a look.</a> Please, go run one of those teams into the ground.</p>`;
        }
    }

    await idb.cache.messages.add({
        read: false,
        from: "The Owner",
        year: g.season,
        text: m,
    });

    if (ownerMoodSum > -1) {
        return;
    }
    if (g.season < g.gracePeriodEnd || g.godMode) {
        // Can't get fired yet... or because of God Mode
        return;
    }

    // Fired!
    await league.setGameAttributes({
        gameOver: true,
        showFirstOwnerMessage: true,
    });
}

export default genMessage;
