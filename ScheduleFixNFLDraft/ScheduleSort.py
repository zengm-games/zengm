# Assign matches based on NFL rules.
# Rules:
# Home/away vs division
# mixed vs. another division same conference
# mixed vs. another division other conference
# mixed vs. same rank, another division same conference (2 games)
# 1 from other division, other conference, switch homeaway based on season

# reference
# teamIndex % 8 = div + conference
# e.g teamIndex 0 = AFC East, 1 AFC South, ect.
# For simplicity, we'll pretend that 0, 8, 16 and 24 are all in the same division, and finished in order.
# Table:
#                     AFC             |             NFC
# Place | East | North | South | West | East | North | South | West
# 1st   |  0   |   1   |   2   |  3   |  4   |   5   |   6   |  7
# 2nd  |  8    |   9   |   10  |  11  |  12  |  13   |  14   |  15
# 3rd  |  16   |  17   |   18  |  19  |  20  |  21   |  22   |  23
# 4th  |  24   |  25   |   26  |  27  |  28  |  29   |  30   |  31
##

import random
import math

# Pass this information in.  Team ids would be arranged on the teams list based on the table above.
teams = list(range(32))
random.shuffle(teams)  # Functions in arbitrary order
year = 2022
conferences = 2
divisionsPer = 4

# track matchups
matchups = []
# debug: Ensure all matchups are assigned
matchupcompare = []


# HOME/AWAY STUFF
# After some scribbling, we can use binary to represent the combinations of home/away games.
# I can't really think of an elegant way to do that, so instead, I drew it out, and
# found we can enumerate all possible binary states as [3,5,6,9,10,12]. (0011, 0101, 0110... ect.).
# With some clever math, this should be applicable to any number of teams where you want an even distribution
# of home/away games, but for now, we'll rely on a hardcoded array.
# So we got our numbers, we take the year and check the remainder of possible states, so year % len(possibleStates).
possibleStates = [3, 5, 6, 9, 10, 12]
# Note: We'll probably derive this by division size.  So if a division has n teams, we have 2^n combinations of home/away.
# then check the binary representations and pull those that have an n/2 (rounded up) number of zeros.  We can then apply this
# rule to odd numbered divisions as well.  However, since it's goofy working with binary in Python and I'm more focused on finalizing this
# prototype, I'll leave this hardcoded

# divisions will play each other according to these offsets over a three year period.
# So for intraconference matches in year 1, division 0 plays 1, 1 plays 0, 2 plays 3, 3 plays 2.
intraConferenceOffsetTables = [
    [1, 0, 3, 2],
    [2, 3, 0, 1],
    [3, 2, 1, 0]
]
# crossConference matches play over 4 years, according to the same scheme
crossConferenceOffsetTables = [
    [0, 1, 2, 3],
    [1, 0, 3, 2],
    [2, 3, 0, 1],
    [3, 2, 1, 0]
]

# Tracks pairs of intra-conference division pairings
intraConferenceSets = {}
# tracks pairs of cross conference division pairings
crossConferenceSets = {}
# tracks pairs of intra-conference matchups based on rank (two divisions not playing a full slate against team)
intraRankset = {}

for i in teams:

    # keep track of division and team rank
    division = i % 8
    rank = int(i / 8)

    # assign opposing divisions
    if division < 4:
        divSameConf = intraConferenceOffsetTables[year %
                                                  divisionsPer - 1][division]
        divOtherConf = crossConferenceOffsetTables[year %
                                                   divisionsPer][division] + divisionsPer
        seventeenthDiv = intraConferenceOffsetTables[(
            year + int(math.ceil(divisionsPer/2))) % divisionsPer - 1][divOtherConf % divisionsPer] + divisionsPer
    else:
        divSameConf = intraConferenceOffsetTables[year %
                                                  divisionsPer - 1][division % divisionsPer] + divisionsPer
        divOtherConf = crossConferenceOffsetTables[year %
                                                   divisionsPer][division % divisionsPer]
        seventeenthDiv = intraConferenceOffsetTables[(
            year + int(math.ceil(divisionsPer/2))) % divisionsPer - 1][divOtherConf]

    # Assign the remaining intraconference games.  Get all teams in conference, remove
    # their division and assigned division
    intraConference = list(range(int(division/divisionsPer) * divisionsPer,
                           int(division/divisionsPer) * divisionsPer + divisionsPer))
    intraConference.remove(division)
    intraConference.remove(divSameConf)

    # Assign division to intraRankSet.  This feels hacky, and stands to be improved,
    # but essentially just set home and away games for the division based on whether they
    # have already had an assigned home/away game.  Right now this bias' towards resolving
    # based on the first division assigned.  We can reverse this logic and alternate based
    # on year (set division as a value first, then set it as a key), but I think there's a less
    # messy way to allocate, though this might just be an issue with the many different avenues
    # to represent these 'sets'.
    for j in range(len(intraConference)):
        if division not in intraRankset.keys():
            if intraConference[j] not in intraRankset.values():
                intraRankset[division] = intraConference[j]
        elif division not in intraRankset.values():
            if intraConference[j] not in intraRankset.keys():
                intraRankset[intraConference[j]] = division

    # intra and cross Conference sets (which funnily enough, are dicts for this example for ease of writing)
    # will carry the order in which games are assigned by divsion.  If the division is a key, it is considered
    # the first value, and if it is a value, then it is considered the second value.  The reason for preserving
    # this value will become clear in the next big block of comments.
    if division not in intraConferenceSets.keys() and division not in intraConferenceSets.values():

        intraConferenceSets[division] = divSameConf

    if division not in crossConferenceSets.keys() and division not in crossConferenceSets.values():

        crossConferenceSets[division] = divOtherConf

    # Arrangements will track the binary representation of home and away games for each team.  By using
    # the order of the assignment, as well as the teams rank (row), we can alternate home/away assignments
    # for teams in a consistant manner for both intra and cross conference matches.  This is a little subtle,
    # but the alternation of the states is dependent on the states (i.e. in a year with a 0101 scheme, the major
    # and minor states need to alternate on that 0101 scheme, where the 2nd item is the inverse of the first).

    # Simplest way to a byte sequence appears to be to format as a string in Python
    majorState = '{0:04b}'.format(possibleStates[year % len(possibleStates)])
    # Python workaround, have to use XOR full byte sequence to represent NOT
    minorState = '{0:04b}'.format(
        possibleStates[year % len(possibleStates)] ^ 0b1111)

    if int(majorState[rank]) == 0:
        intraArrangement = majorState if division in intraConferenceSets.keys() else minorState
        crossArrangement = majorState if division in crossConferenceSets.keys() else minorState
    else:
        intraArrangement = minorState if division in intraConferenceSets.keys() else majorState
        crossArrangement = minorState if division in crossConferenceSets.keys() else majorState

    for j in teams:

        # Skip if same team
        if i == j:
            continue

        # continue if assigned or would be assigned
        assigned = False

        # track opposing division and rank for simplicity
        opposingDivision = j % 8
        opposingRank = int(j/8)

        # Intradivsion - Home and Away.  Very simple.
        if opposingDivision == division:

            if [i, j] not in matchups:
                matchups.append([i, j])
                matchupcompare.append([i, j])
            assigned = True

            if [j, i] not in matchups:
                matchups.append([j, i])
                matchupcompare.append([j, i])
            assigned = True

        if assigned == True:
            continue

        # div in same conference, all 4 split home/away
        if opposingDivision == divSameConf:
            # Check our binary representation.  If we have a 0 in the intraArrangement, assign
            # a home game, otherwise away.
            if int(intraArrangement[opposingRank]) == 0:

                if [i, j] not in matchups:
                    matchups.append([i, j])
                    matchupcompare.append([i, j])
                assigned = True

            else:

                if [j, i] not in matchups:
                    matchups.append([j, i])
                    matchupcompare.append([j, i])
                assigned = True

        if assigned == True:
            continue

        # same thing here, but check crossArrangement for the binary
        if opposingDivision == divOtherConf:

            if int(crossArrangement[opposingRank]) == 0:

                if [i, j] not in matchups:
                    matchups.append([i, j])
                    matchupcompare.append([i, j])
                assigned = True

            else:

                if [j, i] not in matchups:
                    matchups.append([j, i])
                    matchupcompare.append([j, i])
                assigned = True

        if assigned == True:
            continue

        # For intraConference, We want a matchup between teams on the same row in the same conference, but not
        # against the division we're playing a full slate against.
        if opposingDivision in intraConference:
            # same row
            if rank == opposingRank:
                # Check if division has been set in IntraRankSet keys, if unset, skip for now and
                # we'll allocate games later
                if division in intraRankset.keys():
                    # if intraRankSet is same division, append matchup
                    if intraRankset[division] == opposingDivision:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])
                        assigned = True

        if assigned == True:
            continue

        # Simple for the 17th game, if it's the correct opposing division and rank
        if opposingDivision == seventeenthDiv:
            if rank == opposingRank:
                # even years AFC gets extra home game, odd years NFC gets extra home game
                if year % 2 == 0:
                    if division < 4:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])
                else:
                    if division >= 4:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])


# NFL matchups DEBUG output
for i in range(32):
    print('')
    print('team:' + str(i))
    teamFilter = filter(lambda x: (
        x[0] == i or x[1] == i), matchups)
    teamSchedule = list(teamFilter)
    print(teamSchedule)
    homeGames = filter(lambda x: x[0] == i, teamSchedule)
    print('home:')
    print(len(list(homeGames)))
    awayGames = filter(lambda x: x[1] == i, teamSchedule)
    print('away:')
    print(len(list(awayGames)))
    print('total:')
    print(len(teamSchedule))
print('total games')
print(len(matchups))


random.shuffle(matchups)  # functions with random order of matchups

## Pass these values in, along with matchups
games = 16
weeksWithoutByes = 10
weeksWithByes = 8

## Schedule will track full weeks
schedule = []

# Assign matchups until we have 10 full weeks
while (len(schedule) < weeksWithoutByes):
    week = []
    assigned = []
    unfilled = False
    i = 0
    while len(week) < games:
        # No more matchups and week is unfilled?  Add to unfilled weeks
        if i >= len(matchups):
            unfilled = True
            break
        # both teams not assigned to play that week?  Assign match
        if matchups[i][0] not in assigned and matchups[i][1] not in assigned:
            assigned.append(matchups[i][0])
            assigned.append(matchups[i][1])
            match = matchups.pop(i)
            week.append(match)
            i -= 1
        i += 1

    if unfilled == False:
        schedule.append(week)
    else:
        # add back matchups, alternating inserting at beginning and end (helps to churn matchups array in case 
        # we get stuck on the last few weeks).  I believe with some sorts of matchups it could be possible that
        # we cannot allocate 10 weeks, though I haven't seen it happen.  There might be some sort of math that con
        # confirm or deny that.
        week.reverse()
        for i, match in enumerate(week):
            if i % 2 == 0:
                matchups.append(match)
            else:
                matchups.insert(0, match)

# With 10 full weeks, we now have 112 matchups to assign across 8 weeks, they must all take one week off, and there should
# be at least two teams on bye, and no more than 10 with a bye in a given week.

# So with that in mind, we should fill up 8 weeks with 11 (88) games, then attempt to resolve the final 24 games across the schedule.
partialWeeks = []
partialAssigned = []
while len(partialWeeks) < weeksWithByes:
    week = []
    assigned = []
    unfilled = False
    i = 0

    ## 11 games appears to be the sweet spot for partial weeks starting point.  12 can rarely
    ## fail in resolution, and while 10 teams on bye is a little excessive, in practice I haven't
    ## seen an 11 game week produced
    while len(week) < 11:
        if i >= len(matchups):
            unfilled = True
            break
        # both teams not assigned to play that week?  Assign match
        if matchups[i][0] not in assigned and matchups[i][1] not in assigned:
            assigned.append(matchups[i][0])
            assigned.append(matchups[i][1])
            match = matchups.pop(i)
            week.append(match)
            i -= 1
        i += 1

    if unfilled == False:
        partialWeeks.append(week)
        partialAssigned.append(assigned)
    else:
        week.reverse()
        for match in week:
            matchups.append(match)

# To ensure we don't get stuck, I think once we've reach a point where we can no longer assign matchups, 'dissolve' the first week,
# then read those matchups in reverse back into the matchup array.  The variable length of the weeks, combined with the 'shuffling' should ensure that we eventually
# return a valid 8 week configuration.
matchupLength = len(matchups)
while len(matchups) > 0:
    # Maybe get lucky and assign in one swoop
    for i, week in enumerate(partialWeeks):
        matchesToClear = []
        for j, match in enumerate(matchups):
            # Not in week, as well as ensure at least two teams on bye
            if match[0] not in partialAssigned[i] and match[1] not in partialAssigned[i] and len(week) < (games - 1):
                week.append(match)
                matchesToClear.append(j)
        matchesToClear.reverse()
        for match in matchesToClear:
            matchups.pop(match)
    # Check that some matches were assigned
    if matchupLength != len(matchups):
        matchupLength = len(matchups)
    else:
        # dissolve a week, mix into matchups and create a new week.  reverse order to mix up match assignment
        # (leftover matches are assigned first in the new week)
        dissolving = partialWeeks.pop(0)
        partialAssigned.pop(0)
        dissolving.reverse()
        for match in dissolving:
            matchups.append(match)
        # create new 12 game week from matchups
        newWeek = []
        newWeekAssigned = []
        # We should always have a week available to make, and if it makes the same week, it will at least be shuffled to the
        # end of the week list.
        matchesToClear = []
        for i, match in enumerate(matchups):
            if match[0] not in newWeekAssigned and match[1] not in newWeekAssigned and len(newWeek) < 12:
                newWeekAssigned.append(match[0])
                newWeekAssigned.append(match[1])
                newWeek.append(match)
                matchesToClear.append(i)
        ## remove matches appended
        matchesToClear.reverse()
        for match in matchesToClear:
            matchups.pop(match)
        ## add newWeek and week assignment back to end of partialWeeks, partialAssigned
        partialWeeks.append(newWeek)
        partialAssigned.append(newWeekAssigned)

## shuffle partialWeeks just to shake out any pattern caused by the sort
random.shuffle(partialWeeks)
## append the bye weeks to start at week 8 and end on week 14
finalSchedule = schedule[:7] + partialWeeks + schedule[7:]


# DEBUG print Stuff
teamByes = {}
for week in partialWeeks:
    print(week)
    print(len(week))
    for match in week:
        if match[0] not in teamByes.keys():
            teamByes[match[0]] = 1
        else:
            teamByes[match[0]] += 1
        if match[1] not in teamByes.keys():
            teamByes[match[1]] = 1
        else:
            teamByes[match[1]] += 1

for week in schedule:
    print(week)

print(len(schedule))

for match in matchupcompare:
    exist = False
    double = False
    for week in finalSchedule:
        if match in week:
            if exist == True:
                double = True
            exist = True

    if exist == False:
        print(match)
    if double == True:
        print('double-' + match)


print('Games in bye designated weeks:')
for key, value in teamByes.items():
    print(str(key) + ": " + str(value))

print('')
print('Final Schedule:')

for i, week in enumerate(finalSchedule):
    print('week ' + str(i))
    print(week)
print(len(finalSchedule))
