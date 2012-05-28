import json
import sys

def box_score(teams):
    format = '%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s%-7s'
    for t in teams:
        print format % ('ID', 'Min', 'FG', '3Pt', 'FT', 'Off', 'Reb', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts')
        for p in t['player']:
            print format % (p['id'], round(p['stat']['min']), '%s-%s' % (p['stat']['fg'], p['stat']['fga']), '%s-%s' % (p['stat']['tp'], p['stat']['tpa']), '%s-%s' % (p['stat']['ft'], p['stat']['fta']), p['stat']['orb'], p['stat']['orb'] + p['stat']['drb'], p['stat']['ast'], p['stat']['tov'], p['stat']['stl'], p['stat']['blk'], p['stat']['pf'], p['stat']['points'])
        print format % ('Total', round(t['stat']['min']), '%s-%s' % (t['stat']['fg'], t['stat']['fga']), '%s-%s' % (t['stat']['tp'], t['stat']['tpa']), '%s-%s' % (t['stat']['ft'], t['stat']['fta']), t['stat']['orb'], t['stat']['orb'] + t['stat']['drb'], t['stat']['ast'], t['stat']['tov'], t['stat']['stl'], t['stat']['blk'], t['stat']['pf'], t['stat']['points'])
        print ''

if __name__ == '__main__':
    import sys
    teams = json.load(sys.stdin)

    box_score(teams)
