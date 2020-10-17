import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

dataset = pd.read_csv('data.csv')
dataset = dataset[dataset.MP * dataset.G > 820]

ratings_regression = ['Hgt', 'Str', 'Spd', 'Jmp', 'End', 'Ins', 'Dnk', 'FT.1', '3Pt', 'oIQ', 'dIQ', 'Drb', 'Pss']
ratings_skip = ['2Pt', 'Reb']
factor_skip = 0.01

ratings = ratings_regression + ratings_skip

dataset['pmPerMin'] = dataset['+/-'] / dataset['MP']

# CRAP! normalize doesn't actually do zscore, so some of the stuff below is wrong! Might not matter much
reg = LinearRegression(normalize=True)
reg.fit(dataset[ratings], dataset['pmPerMin'])
# print('Intercept: \n', reg.intercept_)
# print('Coefficients: \n', reg.coef_)

# Adjust old ovrs for the ratings we're skipping
# Recompute Ovr because we want the unscaled version, so scaling can be applied on top in JS
dataset['OvrOld'] = (5 * dataset['Hgt'] + 1 * dataset['Str'] + 4 * dataset['Spd'] + 2 * dataset['Jmp'] + 1 * dataset['End'] + 1 * dataset['Ins'] + 2 * dataset['Dnk'] + 1 * dataset['FT.1'] + 1 * dataset['2Pt'] + 3 * dataset['3Pt'] + 7 * dataset['oIQ'] + 3 * dataset['dIQ'] + 3 * dataset['Drb'] + 3 * dataset['Pss'] + 1 * dataset['Reb']) / 38
for rating in ratings_skip:
    dataset.OvrOld = dataset.OvrOld - factor_skip * (dataset[rating] - dataset[rating].mean())

# Scale to match old ovr
mean_old = dataset.OvrOld.mean()
std_old = dataset.OvrOld.std()

ovr_new_unscaled = reg.predict(dataset[ratings])
std_new = ovr_new_unscaled.std()

factor_mult = std_old / std_new
factor_add = mean_old
# print('factor_mult: \n', factor_mult)
# print('factor_add: \n', factor_add)

dataset['OvrNew'] = ovr_new_unscaled * factor_mult + factor_add
# print(dataset.Ovr)
# print(dataset.OvrNew)

def formatThree(num):
    return str(np.format_float_positional(num, precision=3, unique=False, fractional=False, trim='k'))

print(dataset[['OvrOld', 'OvrNew']])

# Output
print('(')
ratings2 = ['hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'tp', 'oiq', 'diq', 'drb', 'pss', 'fg', 'reb'];
for i in range(len(ratings2)):
    if i == len(ratings2) - 1:
        end_part = ')'
    else:
        end_part = ') +'

    if i >= len(ratings_regression):
        print('    ' + formatThree(factor_skip) + ' * (ratings.' + ratings2[i] + ' - ' + formatThree(dataset[ratings[i]].mean()) + end_part)
    else:
        print('    ' + formatThree(factor_mult * reg.coef_[i]) + ' * (ratings.' + ratings2[i] + ' - ' + formatThree(dataset[ratings[i]].mean()) + end_part)
print(') + ' + formatThree(factor_add));


# Plot
dataset.plot.hexbin(x='OvrOld', y='OvrNew', gridsize=20)
plt.xlim(0, 100)
plt.ylim(0, 100)
plt.xlabel('Old Ovr')  
plt.ylabel('New Ovr')  

plt.plot([0, 100], [0, 100])

plt.show()
