This produces overunder.json, where the last 2 teams are teams that overachieve and underachieve their team ratings.

process.py is mostly from https://github.com/nicidob/fbgm/blob/59b191008c7fb3c837c2586ccd782ac1b2092eff/ratings.ipynb

FBGM_League_*.json are each 10 year exports, including all box scores. With like 6 of those files, it produces pretty good results - the "good" team whas a 22% winning percentage and the bad team has 46%. But with the fbgm2 branch changes, "good" is 52.5% and "bad" is 37% - much better result.

base_ur.json is an export of a brand new league, to serve as a base for overunder.json.
