// ************************************
// BUDGET CONTROLLER
var budgetController = (function () {
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calculatePercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  }

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  }

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function (element) {
      sum += element.value;
    });
    data.totals[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  }

  var fileName = 'budgetyData';

  return {
    addItem: function (type, description, value) {
      var newItem, id;

      // Create new ID
      if (data.allItems[type].length > 0) {
        id = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        id = 0;
      }

      // Create new Item
      if (type === 'exp') {
        newItem = new Expense(id, description, value);
      } else if (type === 'inc') {
        newItem = new Income(id, description, value);
      }

      // Push it into our data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    calculateBudget: function () {
      // Calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');

      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate the percentage of income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },

    calculatePercentages: function () {
      // Expense / TotalIncome * 100
      data.allItems.exp.forEach(function (element) {
        element.calculatePercentage(data.totals.inc);
      });

    },

    getPercentages: function () {
      var allPercentages = data.allItems.exp.map(function (element) {
        return element.getPercentage();
      });
      return allPercentages;
    },

    getBudget: function () {
      return {
        budget: data.budget,
        percentage: data.percentage,
        totalIncomes: data.totals.inc,
        totalExpenses: data.totals.exp
      };
    },

    deleteItem: function (type, id) {
      var ids, index;

      ids = data.allItems[type].map(function (current) {
        return current.id;
      });

      index = ids.indexOf(id);

      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },

    deleteAll: function () {
      // 1. Deletes localStorage
      localStorage.removeItem(fileName);

      // 2. Restarts the data structure object
      data = {
        allItems: {
          exp: [],
          inc: []
        },
        totals: {
          exp: 0,
          inc: 0
        },
        budget: 0,
        percentage: -1
      }
    },

    saveData: function () {
      localStorage.setItem(fileName, JSON.stringify(data));
    },

    readData: function () {
      var items
      items = JSON.parse(localStorage.getItem(fileName));

      // If the file exists or is not empty
      if (items) {
        // Push items
        this.pushItems(items);
      } else {
        items = {
          allItems: {
            exp: [],
            inc: []
          },
          totals: {
            exp: 0,
            inc: 0
          },
          budget: 0,
          percentage: -1
        };
      }

      return items;
    },

    pushItems: function (items) {
      var element;

      // allItems
      for (var i = 0; i < items.allItems.exp.length; i++) {
        element = items.allItems.exp[i];
        this.addItem('exp', element.description, element.value);
      }

      for (var i = 0; i < items.allItems.inc.length; i++) {
        element = items.allItems.inc[i];
        this.addItem('inc', element.description, element.value);
      }

      // totals
      data.exp = items.totals.exp;
      data.inc = items.totals.inc;

      // budget and percentage
      data.budget = items.budget;
      data.percentage = items.percentage;
    },

    test: function () {
      console.log(data);
    }
  }

})();


// ************************************
// UI CONTROLLER
var uiController = (function () {
  // some code...
  var domStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--date',
    expType: 'exp',
    incType: 'inc',
    delBtn: '.del__btn'
  }

  var formatNumber = function (num, type) {
    var num, numSplit, int, dec;

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');
    int = numSplit[0];
    dec = numSplit[1];

    int = int.replace(/(\d)(?=(\d{3})+$)/g, "$1,")

    return (type === 'zero' ? sign = '' : type === 'inc' ? sign = '+' : sign = '-') + ' ' + int + '.' + dec;
  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(domStrings.inputType).value, // inc (+) or exp(-)
        description: document.querySelector(domStrings.inputDescription).value,
        value: parseFloat(document.querySelector(domStrings.inputValue).value)
      };
    },

    getDomStrings: function () {
      return domStrings;
    },

    addListItem: function (obj, type) {
      var html, newHtml, element;
      // Create HTML string with placeholder text
      if (type === 'exp') {
        element = domStrings.expensesContainer;
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === 'inc') {
        element = domStrings.incomeContainer;
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div ><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div >';
      }
      // Replace the placeholder text with some actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    displayInitialItems: function (items) {
      var incHtml, expHtml, incNewHtml, expNewHtml;

      for (var i = 0; i < items.exp.length; i++) {
        expHtml = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';

        expNewHtml = expHtml.replace('%id%', items.exp[i].id);
        expNewHtml = expNewHtml.replace('%description%', items.exp[i].description);
        expNewHtml = expNewHtml.replace('%value%', formatNumber(items.exp[i].value, domStrings.expType));

        document.querySelector(domStrings.expensesContainer).insertAdjacentHTML('beforeend', expNewHtml);
      }

      for (var i = 0; i < items.inc.length; i++) {
        incHtml = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div ><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div >';

        incNewHtml = incHtml.replace('%id%', items.inc[i].id);
        incNewHtml = incNewHtml.replace('%description%', items.inc[i].description);
        incNewHtml = incNewHtml.replace('%value%', formatNumber(items.inc[i].value, domStrings.incType));
        document.querySelector(domStrings.incomeContainer).insertAdjacentHTML('beforeend', incNewHtml);
      }
    },

    clearFields: function () {
      var fields;

      fields = document.querySelectorAll(domStrings.inputDescription + ',' + domStrings.inputValue);
      var fieldsArray = Array.prototype.slice.call(fields);

      fieldsArray.forEach(function (element) {
        element.value = "";
      });

      fieldsArray[0].focus();
    },

    clearItems: function () {
      document.querySelector(domStrings.expensesContainer).innerHTML = "";
      document.querySelector(domStrings.incomeContainer).innerHTML = "";
    },

    displayBudget: function (obj) {
      var type;

      obj.budget === 0 ? type = 'zero' : obj.budget > 0 ? type = 'inc' : type = 'exp';

      document.querySelector(domStrings.budgetLabel).textContent = formatNumber(obj.budget, type);

      document.querySelector(domStrings.incomeLabel).textContent = formatNumber(obj.totalIncomes, 'inc');
      document.querySelector(domStrings.expensesLabel).textContent = formatNumber(obj.totalExpenses, 'exp');

      if (obj.percentage > 0) {
        document.querySelector(domStrings.percentageLabel).textContent = obj.percentage + '%';
      } else {
        document.querySelector(domStrings.percentageLabel).textContent = '---';
      }
    },

    displayPercentages: function (percentages) {
      var fields = document.querySelectorAll(domStrings.expensesPercentageLabel);

      nodeListForEach(fields, function (element, index) {
        if (percentages[index] > 0) {
          element.textContent = percentages[index] + '%';
        } else {
          element.textContent = '---';
        }
      });

    },

    displayMonthYear: function () {
      var month, year, now;
      const monthsNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

      now = new Date();
      month = now.getMonth();
      year = now.getFullYear();

      document.querySelector(domStrings.dateLabel).textContent = monthsNames[month] + ' ' + year;
    },

    changedType: function () {
      var fields = document.querySelectorAll(
        domStrings.inputType + ',' +
        domStrings.inputDescription + ',' +
        domStrings.inputValue);

      nodeListForEach(fields, function (element) {
        element.classList.toggle('red-focus');
      });

      document.querySelector(domStrings.inputBtn).classList.toggle('red');
    },

    deleteListItem: function (selectorId) {
      var el = document.getElementById(selectorId);
      el.parentNode.removeChild(el);
    }
  }

})();


// ************************************
// GLOBAL APP CONTROLLER
var appController = (function (budgetCtrl, uiCtrl) {
  // some code...

  var setupEventListeners = function () {
    var dom = uiCtrl.getDomStrings();

    // Add item button
    document.querySelector(dom.inputBtn).addEventListener('click', ctrlAddItem);

    // Add item enter keypress
    document.addEventListener('keypress', function (event) {
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    // Delete item button
    document.querySelector(dom.container).addEventListener('click', ctrlDeleteItem);

    // Change type select
    document.querySelector(dom.inputType).addEventListener('change', uiCtrl.changedType);

    // Delete all button
    document.querySelector(dom.delBtn).addEventListener('click', ctrlDeleteAll);
  }

  var updateBudget = function () {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Return the budget
    var budget = budgetCtrl.getBudget();

    // 3. Display the budget on the UI
    uiCtrl.displayBudget(budget);
  };

  var updatePercentages = function () {
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with the new percentages
    uiCtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function () {
    var input, newItem;

    // 1. Get the field input data
    input = uiCtrl.getInput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add the Item to the UI
      uiCtrl.addListItem(newItem, input.type);

      // 4. Clear fields
      uiCtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update the percentages
      updatePercentages();

      // 7. Save data in localStorage
      budgetCtrl.saveData();
    }
  };

  var ctrlDeleteItem = function (event) {
    var itemId, splitId, type, id;

    itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
    if (itemId) {
      splitId = itemId.split('-');
      type = splitId[0];
      id = parseInt(splitId[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, id);

      // 2. Delete the item from the UI
      uiCtrl.deleteListItem(itemId);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update the percentages
      updatePercentages();

      // 5. Save data in localStorage
      budgetCtrl.saveData();
    }
  };

  var ctrlDeleteAll = function () {
    if (confirm('Delete all?')) {
      // 1. Delete all from our data structure
      budgetCtrl.deleteAll();

      // 2. Clear all items (expenses and incomes)
      uiCtrl.clearItems();

      // 3. Display the original budget
      updateBudget();
    }
  }

  var initializeItems = function () {
    // 1. Read the data stored in localStorage with all information and returns the readed object
    var items = budgetCtrl.readData();

    // 2. Display the initial items
    uiCtrl.displayInitialItems(items.allItems);

    // 3. Update and show budget
    updateBudget();

    // 4. Calculate and update the percentages
    updatePercentages();
  };

  return {
    init: function () {
      //console.log('Started');

      // 1. Initialize items
      initializeItems();

      // 2. Display month and year
      uiCtrl.displayMonthYear();

      // 3. Setup event listeners
      setupEventListeners();
    }
  }

})(budgetController, uiController);


appController.init();