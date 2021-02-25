data = read.csv(file="data.csv");

for (pos in unique(data$pos)) {
  data2 = data[data$pos == pos,]
  
  # Find avg pot for each age/ovr, so model is not biased by looking mostly at low ovr players
  aggAges = c()
  aggOvrs = c()
  aggPots = c()
  
  ages = c(19, 20, 21, 22, 23, 24, 25, 26, 27, 28)
  for (age in ages) {
    ovrs = sort(unique(data2[data2$age == age,]$ovr))
    for (ovr in ovrs) {
      pots = data2[data2$age == age & data2$ovr == ovr,]$pot
      pot = mean(pots)
      
      aggAges = c(aggAges, age)
      aggOvrs = c(aggOvrs, ovr)
      aggPots = c(aggPots, pot)
    }
  }
  
  data3 = data.frame(age=aggAges, ovr=aggOvrs, pot=aggPots);
  
  model = lm(pot ~ age + ovr + age:ovr, data = data3)

  print(pos)
  print(model)

#  predictedPot = predict.lm(model, data3)
#  plot(data3$pot, predictedPot, main=pos, xlab="avgPot")

  predictedPot = predict.lm(model, data)
  plot(data$pot, predictedPot, col = rgb(red = 0, green = 0, blue = 0, alpha = 0.01), main=pos, xlab="pot")
}
