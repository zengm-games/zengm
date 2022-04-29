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

## import random


teams = list(range(32))
## random.shuffle(teams) ## Functions in arbitrary order
year = 2027
byeWeeks = 8
totalWeeks = 17
teamsInDivision = 4
matchups = []

## debug - for schedule simplifier tbd
matchupcompare = []


# HOME/AWAY STUFF
# After some scribbling, we can use binary to represent the combinations of home/away games.
# I can't really think of an elegant way to do that, so instead, I drew it out, and
# found we can enumerate all possible binary states as [3,5,6,9,10,12]. (0011, 0101, 0110... ect.).
# With some clever math, this should be applicable to any number of teams where you want an even distribution
# of home/away games, but for now, we'll rely on a hardcoded array.
# So we got our numbers, we take the year and check the remainder of possible states, so year % len(possibleStates).
possibleStates = [3, 5, 6, 9, 10, 12]

intraPossibleStates = [1, 2]
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

## Tracks pairs of intra-conference division pairings
intraConferenceSets = {}
## tracks pairs of cross conference division pairings
crossConferenceSets = {}
## tracks pairs of intra-conference matchups based on rank (two divisions not playing a full slate against team)
intraRankset = {}

for i in teams:

    # keep track of division and team rank
    division = i % 8
    rank = int(i / 8)

    # assign opposing divisions
    if division < 4:
        divSameConf = intraConferenceOffsetTables[year % 3][division]
        divOtherConf = crossConferenceOffsetTables[year % 4][division] + 4
        seventeenthDiv = intraConferenceOffsetTables[(
            year + 2) % 3][divOtherConf % 4] + 4
    else:
        divSameConf = intraConferenceOffsetTables[year % 3][division % 4] + 4
        divOtherConf = crossConferenceOffsetTables[year % 4][division % 4]
        seventeenthDiv = intraConferenceOffsetTables[(
            year + 2) % 3][divOtherConf]

    # Assign the remaining intraconference games.  Get all teams in conference, remove
    # their division and assigned division
    intraConference = list( range( int(division/4) * 4, int(division/4) * 4 + 4) )
    intraConference.remove(division)
    intraConference.remove(divSameConf)

    ## Assign division to intraRankSet.  This feels hacky, and stands to be improved,
    ## but essentially just set home and away games for the division based on whether they
    ## have already had an assigned home/away game.  Right now this bias' towards resolving
    ## based on the first division assigned.  We can reverse this logic and alternate based
    ## on year (set division as a value first, then set it as a key), but I think there's a less
    ## messy way to allocate, though this might just be an issue with the many different avenues 
    ## to represent these 'sets'.
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

    ## Simplest way to a byte sequence appears to be to format as a string in Python
    majorState = '{0:04b}'.format(possibleStates[year % len(possibleStates)])
    ## Python workaround, have to use XOR full byte sequence to represent NOT
    minorState = '{0:04b}'.format(possibleStates[year % len(possibleStates)] ^ 0b1111)

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

        ## For intraConference, We want a matchup between teams on the same row in the same conference, but not 
        ## against the division we're playing a full slate against.
        if opposingDivision in intraConference:
            # same row
            if rank == opposingRank:
                ## Check if division has been set in IntraRankSet keys, if unset, skip for now and
                ## we'll allocate games later
                if division in intraRankset.keys():
                    ## if intraRankSet is same division, append matchup
                    if intraRankset[division] == opposingDivision:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])
                        assigned = True

        if assigned == True:
            continue

        ## Simple for the 17th game, if it's the correct opposing division and rank
        if opposingDivision == seventeenthDiv:
            if rank == opposingRank:
                ## even years AFC gets extra home game, odd years NFC gets extra home game
                if year % 2 == 0:
                    if division < 4:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])
                else:
                    if division >= 4:
                        matchups.append([i, j])
                        matchupcompare.append([i, j])


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

print('')
print('total games')
print(len(matchups))
