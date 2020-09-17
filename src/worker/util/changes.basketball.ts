const changes = [
	{
		date: "2013-09-21",
		msg:
			'The "What would make this deal work?" button can add assets from either team, either to make a trade good enough for the AI to accept or to have the AI offer up assets to entice the user. Previously, it would only add assets from the user\'s team to make the trade better for the AI.',
	},
	{
		date: "2013-09-21",
		msg:
			'Added a "Trading Block" page where you can ask all the AI teams to make offers for selected players or draft picks you control.',
	},
	{
		date: "2013-09-22",
		msg:
			"For any games simulated from now on, box scores will show quarter-by-quarter point totals.",
	},
	{
		date: "2013-10-01",
		msg:
			"New mobile-friendly UI - try playing in Chrome or Firefox on your Android device!",
	},
	{
		date: "2013-10-02",
		msg:
			'<a href="https://twitter.com/basketball_gm" target="_blank">Follow Basketball GM on Twitter</a> to keep up with the latest news, updates, and discussion.',
	},
	{
		date: "2013-10-16",
		msg:
			"Added fantasy draft feature - try it out by clicking Tools > Fantasy Draft!",
	},
	{
		date: "2013-10-22",
		msg:
			"More realistic free agency. Free agency now lasts 30 days. The longer you wait to sign someone, the better deal you can get - but if you wait to long, he might sign with an other team. Also, you are now much less likely to get the first shot at signing every free agent.",
	},
	{
		date: "2013-11-03",
		msg:
			'Live play-by-play game simulation. Click "Play > One day (live)" to check it out.',
	},
	{
		date: "2013-11-10",
		msg:
			"Removed the roster size limit in trades. Now you (and AI teams) can go above and below the min and max roster sizes, as long as you get back within the limits before playing any more games.",
	},
	{
		date: "2013-11-24",
		msg:
			"Key events (wins/losses, injuries, etc.) now appear in notification bubbles when they happen.",
	},
	{
		date: "2013-12-21",
		msg:
			"At the end of each season, a Finals MVP will be selected along with the other awards.",
	},
	{
		date: "2014-01-03",
		msg:
			"The Player Stats page can show career stats in addition to season stats. Also, it can show total stats and per 36 minute stats in addition to per game stats.",
	},
	{
		date: "2014-01-11",
		msg:
			"To improve game simulation performance in old leagues, you can delete some of the old stored data by going to Tools > Improve Performance.",
	},
	{
		date: "2014-01-13",
		msg:
			"You can view upcoming draft classes up to three years in the future by going to Players > Draft and then clicking Future Draft Scouting.",
	},
	{
		date: "2014-01-20",
		msg:
			'Want to help pick new default team names? <a href="http://www.reddit.com/r/BasketballGM/comments/1voggc/survey_basketball_gm_is_renaming_its_teams_vote/" target="_blank">Click here to learn more and vote in our poll!</a>',
	},
	{
		date: "2014-01-21",
		msg:
			"By clicking the flag icon next to players' names, you can add them to the Watch List (accessible from Players > Watch List) to keep an eye on them.",
	},
	{
		date: "2014-01-30",
		msg: "New Create A Player feature, under the Tools menu.",
	},
	{
		date: "2014-02-15",
		msg:
			'<a href="https://basketball-gm.com/blog/2014/02/new-improved-trade-ai/" target="_blank">Big changes to the trade AI</a>, which hopefully will fix some loopholes and make things more realistic.',
	},
	{
		date: "2014-03-03",
		msg:
			'<a href="https://basketball-gm.com/blog/2014/03/new-feature-achievements/" target="_blank">Achievements!</a>',
	},
	{
		date: "2014-03-05",
		msg: "Upcoming Free Agents page, accessible from Players > Free Agents.",
	},
	{
		date: "2014-04-27",
		msg:
			"Player Stats and Player Ratings pages now let you easily filter by team.",
	},
	{
		date: "2014-06-17",
		msg:
			'New customization features: <a href="https://basketball-gm.com/blog/2014/06/new-customization-features-full-league-importexport-and-draft-class-import/">full league import/export and custom draft class import</a>.',
	},
	{
		date: "2014-07-05",
		msg:
			'New "God Mode" allows you to create players, edit players, and force trades. Enable it by going to Tools > God Mode within a league.',
	},
	{
		date: "2014-09-28",
		msg:
			'Player development should now be much more realistic. <a href="https://basketball-gm.com/blog/2014/09/revamped-player-development-algorithm/">Check out the blog for more.</a>',
	},
	{
		date: "2014-12-05",
		msg:
			"Game simulation is about 20% faster now. This is most visible after you're many seasons into a league.",
	},
	{
		date: "2015-01-31",
		msg: "Want to really nerd out? Go to Tools > Export Stats.",
	},
	{
		date: "2015-02-03",
		msg:
			"Keep an eye on great individual performances in the new Statistical Feats page.",
	},
	{
		date: "2015-03-15",
		msg:
			"Did something cool in the game that you want to share? Go to Tools > Screenshot from any page.",
	},
	{
		date: "2015-03-21",
		msg:
			"Enable God Mode (in the Tools menu) and then go to Tools > Multi Team Mode for some new ways to play!",
	},
	{
		date: "2015-05-06",
		msg: "Two new stats are tracked: blocks against and +/-",
	},
	{
		date: "2015-09-16",
		msg:
			"New pages: Transactions (available in the League menu), and Team Records and Awards Records (available under League > History).",
	},
	{
		date: "2016-01-14",
		msg: "Contract negotiation has been revamped and streamlined.",
	},
	{
		date: "2016-01-31",
		msg:
			'Serious injuries will now sometimes result in <a href="https://basketball-gm.com/blog/2016/01/injuries-can-have-long-term-effects/">decreased athleticism ratings</a>.',
	},
	{
		date: "2016-02-06",
		msg:
			"Lots of new options in God Mode - change the salary cap, the length of games, the number of games in a season, disable injuries, etc.",
	},
	{
		date: "2016-05-28",
		msg: "The Edit Team Info feature is now only available in God Mode.",
	},
	{
		date: "2016-06-04",
		msg: "The default teams now have logos.",
	},
	{
		date: "2016-06-13",
		msg:
			"International players are here! And American players have more realistic names. Gameplay hasn't changed at all, this is purely cosmetic at this point.",
	},
	{
		date: "2017-04-01",
		msg:
			'<a href="https://basketball-gm.com/blog/2017/04/basketball-gm-4-0-is-here/">Basketball GM 4.0 is here!</a> This is not an April Fool\'s Day joke! Everything should be crazy fast now.',
	},
	{
		date: "2017-05-21",
		msg:
			"AI teams will now trade with each other. Go to League > Transactions to see trades.",
	},
	{
		date: "2017-06-07",
		msg:
			"By default, box scores from past seasons will be deleted to save hard drive space. To diasble this new behavior, go to Tools > Options.",
	},
	{
		date: "2017-10-04",
		msg:
			"Additional advanced stats can be viewed on the Team Stats, Player Stats, and individual player pages.",
	},
	{
		date: "2018-03-08",
		msg:
			'Major changes to player ratings and development! <a href="https://basketball-gm.com/blog/2018/03/player-ratings-and-development-changes-are-live/">Read about it here.</a>',
	},
	{
		date: "2018-10-07",
		msg:
			'Lots of minor UI improvements, especially on mobile. And <a href="/options">a dark theme is available in the options</a>! <a href="https://basketball-gm.com/blog/2018/10/lots-of-small-ui-improvements/">Read about it here.</a> Also since sometimes I forget to update the in-game notifications, check out <a href="https://basketball-gm.com/blog/">the BBGM blog</a> for other news.',
	},
	{
		date: "2018-10-15",
		msg:
			'You can mark players and picks as "untouchable" when making a trade, to see if the AI can make a counter offer without them. <a href="https://basketball-gm.com/blog/2018/10/untouchable-players-and-picks-in-trades/">More details</a>',
	},
	{
		date: "2018-11-11",
		msg:
			'New God Mode options: hard/soft cap and playoff byes. <a href="https://basketball-gm.com/blog/2018/11/new-options-hard-soft-cap-and-playoff-byes">More details</a>',
	},
	{
		date: "2019-05-27",
		msg:
			'A few fun tools are now available on the Tools > Frivolities page within a league. <a href="https://basketball-gm.com/blog/2019/05/frivolities/">More details</a>',
	},
	{
		date: "2019-07-28",
		msg:
			'There are now tons of new achievements! View them on <a href="/account">your account page</a>.',
	},
	{
		date: "2019-09-30",
		msg:
			'The All-Star game is here! Keep playing and you\'ll see it, or <a href="https://basketball-gm.com/blog/2019/09/all-star-game/">read the blog for details</a>.',
	},
	{
		date: "2019-10-07",
		msg:
			"New feature: social media! Within a league, go to Tools > Social Media.",
	},
	{
		date: "2019-11-13",
		msg: `More realistic play-by-plays in live game sim, and an improved ovr rating formula. <a href="https://basketball-gm.com/blog/2019/11/game-simulation-ovr-beta/">More details</a>`,
	},
	{
		date: "2019-11-20",
		msg:
			'Each team now has a numeric rating from 0-100, viewable on the Roster page or on the new improved Power Rankings, which should be a lot more meaningful now than they used to be. <a href="https://basketball-gm.com/blog/2019/11/team-ratings/">More details</a>',
	},
	{
		date: "2020-02-03",
		msg:
			'Players are assigned a college when they are generated, and a new college summary page is at Tools > Frivolities > College. <a href="https://basketball-gm.com/blog/2020/02/colleges/">More details</a>',
	},
	{
		date: "2020-04-16",
		msg: "New Award Races page available at Stats > Award Races.",
	},
	{
		date: "2020-04-25",
		msg:
			'When creating a new league, you now have the option of using real players. <a href="https://basketball-gm.com/blog/2020/04/real-players/">More details</a>',
	},
	{
		date: "2020-04-30",
		msg:
			'When creating a new league, you now have the option of using real historical rosters back to 2005. <a href="https://basketball-gm.com/blog/2020/04/real-rosters-back-to-2005/">More details</a>',
	},
	{
		date: "2020-05-11",
		msg:
			'Real historical rosters back to 1956, including all future draft prospects, team relocations, expansion drafts, salary cap changes, and more! <a href="https://basketball-gm.com/blog/2020/05/beta-real-rosters-back-to-1956/">More details</a>',
	},
	{
		date: "2020-05-12",
		msg:
			'Added 4 new draft lottery types, to improve the accuracy of historical leagues. <a href="https://basketball-gm.com/blog/2020/05/more-draft-lottery-types/">More details</a>',
	},
	{
		date: "2020-05-19",
		msg:
			'You can now create a "legends" league filled with the best players in each franchise\'s history. <a href="https://basketball-gm.com/blog/2020/05/legends-leagues/">More details</a>',
	},
	{
		date: "2020-05-24",
		msg:
			'New option "random debuts" when creating a real players league, which randomizes every player\'s draft year so different players will appear at different times.',
	},
	{
		date: "2020-05-26",
		msg:
			'12 new frivolities, available within a league at at Tools > Frivolities. <a href="https://basketball-gm.com/blog/2020/05/new-frivolities/">More details</a>',
	},
	{
		date: "2020-06-03",
		msg:
			'Real rosters back to 1947 and support for contraction at Tools > Manage Teams. <a href="https://basketball-gm.com/blog/2020/06/real-rosters-back-to-1947-contraction/">More details</a>',
	},
	{
		date: "2020-06-13",
		msg:
			'A bunch of new options for league creation: challenge modes (no draft picks, no free agents, no trades, no visible ratings), player development realism, and more. <a href="https://basketball-gm.com/blog/2020/06/league-creation-options/">More details</a>',
	},
	{
		date: "2020-06-16",
		msg:
			'You can customize the order and visibility of columns in most tables by pressing the <span class="glyphicon glyphicon-option-vertical"></span> button to the top right of the table and clicking "Customize Columns". Also, my apologies for changing the default positioning of PTS on some tables! I returned it to its previous default position.',
	},
	{
		date: "2020-07-01",
		msg:
			"The Power Rankings page now shows team rankings for individual rating categories.",
	},
	{
		date: "2020-08-01",
		msg:
			'Players now have jersey numbers, and teams can retire jersey numbers of former players. <a href="https://basketball-gm.com/blog/2020/08/jersey-numbers/">More details</a>',
	},
	{
		date: "2020-08-10",
		msg:
			'The contract generation algorithm has been rewritten. You should no longer see players ask for too much money and go unsigned. <a href="https://basketball-gm.com/blog/2020/08/smarter-contract-generation/">More details</a>',
	},
	{
		date: "2020-08-20",
		msg:
			'Added a new "GM History" page in the Team menu, where you can see your performance across all the different franchises you managed in the past. <a href="https://basketball-gm.com/blog/2020/08/gm-history/">More details</a>',
	},
	{
		date: "2020-08-22",
		msg:
			'New God Mode option: Spectator Mode, where the AI controls all teams and you just watch. It\'s like auto play, but you can proceed at your own pace. <a href="https://basketball-gm.com/blog/2020/08/spectator-mode/">More details</a>',
	},
	{
		date: "2020-08-29",
		msg:
			'Single game highs for players are now tracked for all stats - points, rebounds, assists, etc. View them on player profile pages or in the main Player Stats table by switching the stat type to "Game Highs". <a href="https://basketball-gm.com/blog/2020/08/game-highs/">More details</a>',
	},
	{
		date: "2020-08-31",
		msg:
			"BPM, DBPM, OBPM, and VORP are now viewable in the Advanced Stats table.",
	},
	{
		date: "2020-09-17",
		msg:
			'New player mood system! <a href="https://basketball-gm.com/blog/2020/09/player-mood/">More details</a>',
	},
];

export default changes;
