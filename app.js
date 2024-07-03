const fs = require('fs');
const CashInCommission = 0.03 / 100;
const CashInMaxCommission = 5.0;
const CashOutCommission = 0.3 / 100;
const CashOutMinCommission = 0.5;
const CashOutFreeWeekLimit = 1000.0;

function roundUpToCent(amount) {
  return Math.ceil(amount * 100) / 100;
}

function getCashInCommission(amount) {
  const commission = amount * CashInCommission;
  return roundUpToCent(Math.min(commission, CashInMaxCommission));
}

function getCashOutNaturalCommission(amount, weeklyTotal) {
  if (weeklyTotal >= CashOutFreeWeekLimit) {
    return roundUpToCent(amount * CashOutCommission);
  }
  if (weeklyTotal + amount <= CashOutFreeWeekLimit) {
    return 0.0;
  }
  const overLimitAmount = weeklyTotal + amount - CashOutFreeWeekLimit;
  return roundUpToCent(overLimitAmount * CashOutCommission);
}

function getCashOutLegalCommission(amount) {
  const commission = amount * CashOutCommission;
  return roundUpToCent(Math.max(commission, CashOutMinCommission));
}

function getWeekNumber(date) {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + days) / 7);
}

function calculateCommissions(operations) {
  const weeklyCashOuts = {};
  const results = [];

  operations.forEach(function (operation) {
    const {
      date,
      user_id,
      user_type,
      type,
      operation: { amount },
    } = operation;
    const weekNumber = getWeekNumber(new Date(date));

    if (!weeklyCashOuts[user_id]) {
      weeklyCashOuts[user_id] = {};
    }

    if (!weeklyCashOuts[user_id][weekNumber]) {
      weeklyCashOuts[user_id][weekNumber] = 0;
    }

    let commission;
    if (type === 'cash_in') {
      commission = getCashInCommission(amount);
    } else if (type === 'cash_out') {
      if (user_type === 'natural') {
        const weeklyAmount = weeklyCashOuts[user_id][weekNumber];
        commission = getCashOutNaturalCommission(amount, weeklyAmount);
        weeklyCashOuts[user_id][weekNumber] += amount;
      } else if (user_type === 'juridical') {
        commission = getCashOutLegalCommission(amount);
      }
    }
    results.push(commission.toFixed(2));
  });

  return results;
}

const inputFilePath = process.argv[2];
fs.readFile(inputFilePath, 'utf8', function (err, data) {
  if (err) {
    console.error(err);
    return;
  } else {
    const operations = JSON.parse(data);
    const results = calculateCommissions(operations);
    results.forEach(function (result) {
      console.log(result);
    });
  }
});
