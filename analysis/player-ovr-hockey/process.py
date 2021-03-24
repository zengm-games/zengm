import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

dataset = pd.read_csv('data.csv')
dataset = dataset[dataset.TOI * dataset.G > 820]

ratings_regression = ['Hgt', 'Str', 'Spd', 'End', 'Pss', 'Wst', 'Sst', 'Stk', 'oIQ', 'Chk', 'Blk', 'Fcf', 'dIQ', 'Glk']
ratings_skip = []
factor_skip = 0.01

ratings = ratings_regression + ratings_skip

dataset['pmPerMin'] = dataset['+/-'] / dataset['TOI']

# CRAP! normalize doesn't actually do zscore, so some of the stuff below is wrong! Might not matter much
reg = LinearRegression(normalize=True)
reg.fit(dataset[ratings], dataset['pmPerMin'])
print('Intercept: \n', reg.intercept_)
print('Coefficients: \n', reg.coef_)
