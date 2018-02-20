Quidditch Overhaul of Basketball GM code

Positions

3 Chasers (goal-scoring forward types) : get points
2 Beaters (off. protectors, def. stoppers) : stop points, help chasers, help seekers
1 Keeper (guards against scoring by Chasers)
1 Seeker (150 pt scorer / game ends)

Balls

Quaffle - like basketball or soccer ball for normal scoring
Golden Snitch - Seekers try to get it. Possession = Goal
Bludger - weapon ball to try to hit / hurt / distract opponents.


### Brainstorming
	
How do Quidditch players score (Quaffle)


Fast manuevers, like a good dribbling ISO game.
Good Passing & Shooting, like a good Spread the Floor 3p shooting game.
Power Maneuvers, like Low Post, taking a Bludger

### Quidditch Transformation Steps

1. Naming / Slight League Tweaks
2. New Super-Base Ratings fit into the Core BBGM ratings. With Low Post, 2 pts, 3 pts. Make Seekers super-amazing 3pt shooters. 
3. Revamp Game Sim to have new ratings / modeling / still roughly basketball inspired. Seekers seperated into a seperate winning track.
4. Revamp League, make Scholastic Divisions have their own limitations, 
and recruiting from Scholastic into Pro division. Retirements from Pro / Recruitment from Scholastic into Ministries / Department casual leagues.
5. Revamp Game Sim more. Game Ends by Snitch or Mutual Agreement. Adjustment Snitch difficulty by Division.

### Naming / Slight League Tweaks

Generate naming from British name lists (80%), German name lists (10%), French name lists (10%)

1. Implemented British Name lists with a 1000 Male First Names, 1000 Female First Names, 1000 ish Last Names, all England / Wales sourced.
   Processed from Web source, through Excel formulas into the JSON format and copied in to harrypotter_teams.json.
2. Implemented Scholastic, Rec and Pro Conferences. Unfortunately, I have Irish and Bulgarian national teams within the British Premier League.
   TODO: Add British / Irish and Bulgarian leagues as divisions within pro. Add some British Premier League team names, Irish soccer teams, Bulgarian teams if possible?
   TODO: Make Logo art for these new teams.
   MAYBE: International Competition Conference, with England, Wales, Ireland, Bulgaria and other National Teams?
   OR: Cut out the Irish and Bulgarian national teams entirely, and find a team for the well-known players like Viktor Krum.
   
Note: Started a regular BBGM playthrough as the Chudley Cannons with this version of the JSON
The names are MUCH better than before. Still want to add German and French name bases (irish and bulgarian too?)
   
### New Super-Base Ratings

