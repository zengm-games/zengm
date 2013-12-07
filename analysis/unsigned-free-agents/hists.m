clear all; close all;

x1 = load('0yrs.csv');
x2 = load('10yrs.csv');

figure;

subplot(1,2,1);
[n1, y1] = hist(x1(:,1));
[n2, y2] = hist(x2(:,1));
plot(y1, n1, y2, n2);
title('Player Value');
legend('0yrs', '10yrs');

subplot(1,2,2);
[n1, y1] = hist(x1(:,2));
[n2, y2] = hist(x2(:,2));
plot(y1, n1, y2, n2);
title('Contract Value');
legend('0yrs', '10yrs');