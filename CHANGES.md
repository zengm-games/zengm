This is a list of only the major changes in each version.

# Since 3.0.0-beta.3

## Gameplay and UI

### Done so far

- Draft lottery, based on NBA rules

### Still in progress

- See TODO

## Technical details

### Still in progress

- Refactored views from a giant file into multiple more managable files in the views folder
- Smarter realtime UI updates, so that database reads and DOM updates occur less frequently
- See TODO

# 3.0.0-beta.2

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

# 3.0.0-beta

- First release in a very long time, so basically everything changed