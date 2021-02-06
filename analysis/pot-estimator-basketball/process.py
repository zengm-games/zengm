import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

dataset = pd.read_csv('data.csv')
dataset = dataset[dataset.Age <= 28]

reg = LinearRegression()
reg.fit(dataset[['Age', 'Ovr']], dataset['Pot'])
print('Intercept: \n', reg.intercept_)
print('Coefficients: \n', reg.coef_)
dataset['Pot_pred'] = reg.predict(dataset[['Age', 'Ovr']])

print(dataset[['Age', 'Ovr', 'Pot', 'Pot_pred']])

dataset.plot.hexbin(x='Pot', y='Pot_pred', gridsize=20)
plt.xlim(0, 100)
plt.ylim(0, 100)
plt.xlabel('Pot')  
plt.ylabel('Pot_pred')  

plt.plot([0, 100], [0, 100])

plt.show()
