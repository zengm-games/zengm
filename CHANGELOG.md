Don't read much into the release dates. Changes are pushed live as often as
possible, regardless of whether I make an official release with a new version
number or not.

# 5.1.0 (in progress)

## Gameplay and UI

- [Frivolities](https://basketball-gm.com/blog/2019/05/frivolities/)
- [New achievements](https://basketball-gm.com/blog/2019/07/new-achievements/)

## Technical details

- [Refactored how draft classes are stored, allowing arbitrary future draft classes to be specified in a league file](https://basketball-gm.com/blog/2019/07/far-future-draft-classes/)

# 5.0.0 (2019-05-25)

## Gameplay and UI

- This is no longer just Basketball GM, it's also Football GM!
- ["Untouchable" players and picks in trades](https://basketball-gm.com/blog/2018/10/untouchable-players-and-picks-in-trades/)
- [New options: hard/soft cap and playoff byes](https://basketball-gm.com/blog/2018/11/new-options-hard-soft-cap-and-playoff-byes/)

## Technical details

- Refactored everything to support building Basketball GM and Football GM while sharing as much code as possible

# 4.1.0 (2018-10-07)

## Gameplay and UI

- [Major changes to player ratings and development](https://basketball-gm.com/blog/2018/02/player-ratings-and-development-beta/)
- [Performance improvements in large leagues](https://basketball-gm.com/blog/2018/04/performance-improvements-in-large-leagues/)
- [Relatives - fathers, sons, and brothers](https://basketball-gm.com/blog/2018/05/relatives-fathers-sons-and-brothers/)
- [Draft day trades](https://basketball-gm.com/blog/2018/05/draft-day-trades/)
- [Option to change difficulty level](https://basketball-gm.com/blog/2018/06/difficulty-levels/)
- [Lots of small UI improvements](https://basketball-gm.com/blog/2018/10/lots-of-small-ui-improvements/)

## Technical details

- Finally switched from AppCache to a service worker for offline support
- Upgraded from Bootstrap 3 to Bootstrap 4, and make a lot better use of Sass

# 4.0.0 (2018-03-07)

## Gameplay and UI

- Massive performance improvement, like an order of magnitude (see technical details for more)
- Table filtering, like "show only players with >1 block per game and >1 steal per game"
- AI teams trade with each other
- New Options screen
- Sometimes young players (particularly from certain countries) will fake their ages
- The draft lottery is viewable live
- A lot more advanced stats, viewable from Team Stats, Player Stats, and Player pages

## Technical details

- Game separated into UI and worker threads
- Cache layer on top of IndexedDB so that hitting the database is only required for viewing historical data

# 3.6.0 (2017-01-30)

## Gameplay and UI

- Default teams now have logos
- International players from 85 countries, and better names for American players
- Conferences and divisions are now customizable, although only through league files

## Techincal details

- Incorporated Babel into build pipeline, most notably enabling async/await
- UI ported from Knockout to React

# 3.5.0 (2016-05-27)

## Gameplay and UI

- Export Stats feature (player average stats or individual game stats)
- More detailed info display: four factors in box scores, transaction log in player pages, etc.
- Statistical Feats feature
- Auto play multiple seasons
- Screenshots
- Multi Team Mode
- Players can die
- +/- and blocks against are recorded
- New historical screens: Transactions, Awards Records, and Team Records
- Streamlined contract negotiations
- Serious injuries can result in decreased athleticism ratings
- A bunch of options in God Mode, like changing the salary cap, disabling injuries, etc.

## Techincal details

- Wrapped all IndexedDB calls in a Promises-based abstraction layer
- Phase changes (e.g. regular season to playoffs) happen in a single transaction and are cancellable, so inconsistend DB states should be harder to reach
- Switched from RequireJS to Browserify
- Normalized teams object store into teams, teamSeasons, and teamStats object stores, leading to performance improvements in leagues with many season

# 3.4.0 (2014-12-05)

## Gameplay and UI

- "God Mode" including Create A Player, Edit Player, and Force Trade
- New trade AI, fixing a ton of loopholes
- Achievements
- Upcoming Free Agents page
- Export of entire league data
- Easy import of custom draft classes
- Whole league export
- More realistic player development algorithm

## Technical details

- Separated playerStats object store from players object store for performance

# 3.3.0 (2014-01-21)

## Gameplay and UI

- AppCache used to allow offline play
- Fantasy Draft feature
- Extended free agency phase
- Live play-by-play game simulation
- Removed roster size limit restriction on trades
- Centralized notification system and event log
- Smarter in-game coach: substitutions are based on performance, not just ratings
- GM firings happen after the playoffs, not before the regular season
- Finals MVP award
- Season totals, per 36 minutes stats, and career stats are viewable from the main player stats page
- Option to delete old game data to improve performance
- Future draft classes are visible up to 3 years in the future
- New default team regions and names
- Watch List where selected players can be tracked

## Technical details

- Refactored core.trade API

# 3.2.0 (2013-10-05)

## Gameplay and UI

- New mobile-friendly design
- Trading Block feature
- "What would make this deal work?" button can add assets from either team
- Removed the ability to "buy out" players to get rid of bad contracts
- AI teams will not trade away more than two draft picks in a single trade
- Fewer high-rated big men are generated
- Support for customized team names
- Support for player images in custom rosters
- After being fired, you can get hired by another team
- Quarter-by-quarter scoring in box scores

## Technical details

- Upgraded to Bootstrap 3
- Added ability to alert users to new features without relying on an IndexedDB upgrade

# 3.1.1 (2013-07-26)

## Technical details

- Just a bunch of minor bug fixes

# 3.1.0 (2013-07-17)

## Gameplay and UI

- Player contract demands are based on ratings and stats, not just ratings
- Future draft picks can be traded
- "What would make you agree to this deal?" button to get counter-offers in trade negotiations
- GMs of other teams pursue different strategies depending on if they are contending or rebuilding

## Technical details

- Internet Explorer 10 works much more smoothly now, although it's still not very well tested

# 3.0.0 (2013-06-23)

## Gameplay and UI

- Can export rosters from a league
- Ability to use a custom roster file rather than randomly-generated players in a new league
- Hall of Fame

# 3.0.0-beta.3 (2013-05-20)

## Gameplay and UI

- Draft lottery, based on NBA rules
- Made it harder to fleece the AI in trades
- Faster UI, particularly in the game log
- Team history viewable for any team, including a table of all players who played for that team
- Playing time can be controlled from the roster page

## Technical details

- Refactored views from a single giant file into multiple more managable files in the views folder
- Moved templates from Handlebars.js to Knockout
- Smarter realtime UI updates, so that database reads and DOM updates occur less frequently

# 3.0.0-beta.2 (2013-03-23)

## Gameplay and UI

- Injuries
- Home court advantage in game simulation
- More refined financial data, such as different classes of revenue and expenses
- Team finances view, which includes a lot of information that was not previously accessible
- "Hype" for a team governs things like attendance and revenue
- Different population sizes for different regions, which influences revenue and thus game difficulty
- Awards and salaries from previous seasons displayed in player view
- Many small bug fixes and UI improvements
- More sane and less adversarial contract negotiations, with more direct feedback about what the player is thinking
- Settings to control various budget items, such as ticket price, scouting budget, etc.
- "Fuzz" in displayed player ratings: the more spent on scouting, the more accurate the displayed ratings
- More historical information in player view: previous contracts and awards won
- Annual interactions with the owner: if you do poorly, you might get fired
- Free agents refuse to sign with your team if they don't like you

## Technical details

- Support for minification and compiling of templates/CSS/JavaScript, all easily controllable from the Makefile
- More unit tests (although many more are still needed)
- Moved all JavaScript out of templates

# 3.0.0-beta (2013-03-02)

- First release in a very long time, so basically everything changed