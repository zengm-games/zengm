# This file describes a method for collapsing a double round robin's schedule.  Please excuse the rough nature of the scripting,
# just trying to hack together something that works to get a feel for the domain.

teams = list(range(16))

matchups = []
matchupcompare = []

for teamY in teams:
    for teamX in teams:
        if teamX != teamY:
            matchups.append([teamY, teamX])
            matchupcompare.append([teamY, teamX])

print(len(matchups))
weeks = []
games = 8

schedule = []
unfilledWeeks = []

byes = {}
# Assign all matchups
i = 0  # iterate over weeks
while len(matchups) > 0:
    # Create week to assign to
    weeks.append([])
    # Create list to check assigned teams
    assigned = []
    # track whether week schedule is filled
    unfilled = False
    # iterate over matchups
    j = 0

    borrowFrom = []
    # Assign matchups as usual
    while len(weeks[i]) < games:
        # No more matchups and week is unfilled?  Add to unfilled weeks
        if j >= len(matchups):
            unfilled = True
            break
        ## both teams not assigned to play that week?  Assign match
        if matchups[j][0] not in assigned and matchups[j][1] not in assigned:
            assigned.append(matchups[j][0])
            assigned.append(matchups[j][1])
            fixture = matchups.pop(j)
            weeks[i].append(fixture)
            j -= 1
        j += 1
    # Week is full, Append to weeks
    if unfilled == False:
        schedule.append(weeks[i])

    else:
        # If we have fewer unfilled weeks than Bye weeks, continue on (no increment)
        unfilledWeeks.append(weeks[i])
        # If we have more unfilled than desired, use a game from the last unfilled week
        # to fill a previously unfilled week
        borrowFrom = unfilledWeeks[len(unfilledWeeks)-1]
        filledWeeks = []
        for k in range(len(unfilledWeeks) - 1):
            # Track unassigned for each week
            assigned = []
            # Track fixtures we want to move
            fixtures = []
            for m in range(len(unfilledWeeks[k])):
                assigned.append(unfilledWeeks[k][m][0])
                assigned.append(unfilledWeeks[k][m][1])
            for m in range(len(borrowFrom)):
                if borrowFrom[m][0] not in assigned and borrowFrom[m][1] not in assigned:
                    # assign new position
                    fixtures.append(borrowFrom[m])
                    # update assigned
                    assigned.append(borrowFrom[m][0])
                    assigned.append(borrowFrom[m][1])
            for fixture in fixtures:
                unfilledWeeks[k].append(fixture)
                borrowFrom.remove(fixture)
            if len(unfilledWeeks[k]) == games:
                filledWeeks.append(unfilledWeeks[k])
        for week in filledWeeks:
            unfilledWeeks.remove(week)
            schedule.append(week)
    i += 1

finalSchedule = schedule + unfilledWeeks

teamByes = {}

for week in unfilledWeeks:
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

print(finalSchedule)
print(len(finalSchedule))

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
