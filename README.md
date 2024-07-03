
***Run the following command in a terminal to start the system:***

    node <path_to_script> <path_to_input.json>

For example, if your script is called app.js and your input file is in the same directory and is called input.json, the command would look like this:

    node app.js input.json


## ***Summary of functionality***

****Function roundUpToCent****
Rounds an amount to the cent.

    function roundUpToCent(amount) {
      return Math.ceil(amount * 100) / 100;
    }


**Function getCashInCommission**
Calculates the commission for cash-in operation.

    function getCashInCommission(amount) {
      const commission = amount * CashInCommission;
      return roundUpToCent(Math.min(commission, CashInMaxCommission));
    }

**Function getCashOutNaturalCommission**
Calculates commission for cash-out transaction for individuals taking into account weekly limit.

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
    
**Function getCashOutLegalCommission**
Calculates the commission for cash-out transaction for legal entities.

   

     function getCashOutLegalCommission(amount) {
          const commission = amount * CashOutCommission;
          return roundUpToCent(Math.max(commission, CashOutMinCommission));
        }

**Function getWeekNumber**
Returns the week number for the given date.

   

     function getWeekNumber(date) {
          const startDate = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
          return Math.ceil((date.getDay() + 1 + days) / 7);
        }

**Function calculateCommissions**
The main function for calculating commissions based on transactions.

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

**Read data and output results**

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




