let expression = { operand1: '0', operand2: '', operator: '' };
let display = { mainText: '0', resultText: '' };
let history = [];
let savedExpression = {};

const allBtns = document.querySelectorAll('[data-btn-type]');
const numberBtns = document.querySelectorAll('[data-btn-type="number"]');
const operatorBtns = document.querySelectorAll('[data-btn-type="operator"]');
const posNegBtn = document.querySelector('[data-btn-type="posneg"]');
const decimalBtn = document.querySelector('[data-btn-type="decimal"]');
const clearBtn = document.querySelector('[data-btn-type="clear"]');
const backspaceBtn = document.querySelector('[data-btn-type="backspace"]');
const equalsBtn = document.querySelector('[data-btn-type="equals"]');
const historyEntries = document.querySelector('.history__entries');
const clearHistoryBtn = document.querySelector('.history__clear');

numberBtns.forEach((btn) => btn.addEventListener('click', appendNumber));
operatorBtns.forEach((btn) => btn.addEventListener('click', appendOperator));
posNegBtn.addEventListener('click', appendPosNeg);
decimalBtn.addEventListener('click', appendDecimal);
clearBtn.addEventListener('click', clear);
backspaceBtn.addEventListener('click', backspace);
equalsBtn.addEventListener('click', displayFinalResult);
historyEntries.addEventListener('click', selectHistoryEntry);
clearHistoryBtn.addEventListener('click', clearHistory);
document.addEventListener('keydown', handleKeyboardInput);
window.addEventListener('load', setHistoryPanelHeight);
window.addEventListener('resize', setHistoryPanelHeight);
allBtns.forEach((btn) => btn.addEventListener('click', () => {
  setTimeout(() => btn.blur(), 50);
}));


// ========== Math ==========
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  return (b === 0) ? `Can't divide by 0` : a / b;
}

function operate() {
  // Returns string answer to the math expression
  if (!isExpressionComplete()) return;
  let a = Number(expression.operand1);
  let b = Number(expression.operand2);
  switch (expression.operator) {
    case '+':
      return String(roundResult(add(a, b)));
    case '-':
      return String(roundResult(subtract(a, b)));
    case 'x':
      return String(roundResult(multiply(a, b)));
    case '÷':
      return String(roundResult(divide(a, b)));
    default:
      console.error(`${arguments.callee.name}() - Invalid operator '${expression.operator}'`);
      return;
  }
}


// ========== Input ==========
function appendNumber(e) {
  const numberInput = e.target.textContent;
  const operand = getCurrentOperand();
  
  if (expression[operand] === '0' || expression[operand] === '-0') {
    expression[operand] = expression[operand].replace('0', '');  // Remove leading zero
  }

  expression[operand] += numberInput;  // Append new number
  refreshDisplay();
}

function appendOperator(e) {
  // Calculate any existing pair of numbers first.  Display the result or an error.
  // Operators are evaluated left to right (no order of expressions)
  // Example: 12 + 7 - 5 * 3 = 42.  After inputting '12 + 7 -', main display will read '19 -'
  if (isExpressionComplete()) displayFinalResult();

  // If no errors, set the new operator
  if (display.resultText === '') {
    expression.operator = e.target.textContent;
    refreshDisplay();
  }
}

function appendPosNeg() {
  // Changes the sign of the current operand (positive or negative)
  const operand = getCurrentOperand();
  if (expression[operand] === '') return;
  // Add or remove negative sign while keeping original format (retain scientific or standard notation)
  expression[operand] = (expression[operand].startsWith('-'))
                          ? expression[operand].slice(1)  // Remove negative sign
                          : `-${expression[operand]}`;  // Add negative sign
  refreshDisplay();
}

function appendDecimal() {
  const operand = getCurrentOperand();
  if (expression[operand].includes('.')) return;  // No more than 1 decimal per operand
  const decimalFormat = (expression[operand] === '') ? '0.' : '.';  // Format decimal with leading zero (ie. 0.15 instead of .15)
  expression[operand] += decimalFormat;  // Append decimal
  refreshDisplay();
}

function finalizeCalculation() {
  // Returns string result of the current expression
  // User is done entering this expression (pressed equals or an additional operator)
  // 1.  Add to history panel
  // 2.  Save expression so user can undo with backspace (ie. backspace 7 reveals 5 + 2)
  // 3.  Use result as operand1 of next expression, and clear operand2 and operator
  const result = operate();
  appendHistory({...expression});
  savedExpression = {...expression};
  expression.operand1 = result;
  expression.operand2 = '';
  expression.operator = '';
  return result;
}


// ========== Corrections ==========
function clear() {
  // Reset everything in the calculator (not history panel)
  expression = { operand1: '0', operand2: '', operator: '' };
  updateMainDisplay('0');
  updateResultDisplay('');
  savedExpression = {};
}

function backspace() {
  // If last action was pressing equals to get a result, then backspacing will
  // restore the previous expression (ie. backspace 7 reveals 5 + 2)
  if (Object.keys(savedExpression).length !== 0) {
    expression = {...savedExpression};

  // Remove last character, and update corresponding variable (operand2, operator, or operand1)
  } else if (expression.operand2) {
    if ((expression.operand2.startsWith('-')) && (expression.operand2.length === 2)) {  // Single digit negative
      expression.operand2 = '';
    } else {
      expression.operand2 = expression.operand2.slice(0, -1);  // Remove last character
    }
  } else if (expression.operator) {
    expression.operator = '';
  } else if (expression.operand1) {
    if ((display.mainText.length === 1) ||  // On last character
       ((expression.operand1.startsWith('-')) && (expression.operand1.length === 2)) ||  // Single digit negative
       (expression.operand1.includes('e'))) {  // Scientific notation
      clear();  // Delete everything (don't backspace one-by-one).  Reset to 0
      return;
    } else {
      expression.operand1 = expression.operand1.slice(0, -1);  // Remove last character
    }
  }
  refreshDisplay();
}


// ========== Display ==========
function displayFinalResult() {
  if (!isExpressionComplete()) return;
  // If result is currently blank, then there's a hidden error
  // Show the error, but don't save it to operand1 or update the main display and history
  const result = (display.resultText === '') ? operate() : finalizeCalculation();
  if (isNaN(result)) {
    // Result display = Shows error
    // Main display = unchanged (still shows expression that led to error)
    updateResultDisplay(addComma(result));
  } else {
    // Main display = Shows calculated result (number)
    // Result display = blank
    updateMainDisplay(addComma(result));
    updateResultDisplay('');
  }
}

function updateMainDisplay(content) {
  const mainDisplay = document.querySelector('.display__main');
  display.mainText = String(content);
  mainDisplay.textContent = display.mainText;
}

function updateResultDisplay(content) {
  const resultDisplay = document.querySelector('.display__result');
  // Divide by 0 error is shown in red, with operator and equals buttons disabled
  if (isNaN(removeComma(content))) {
    resultDisplay.classList.add('display__result--error');
    operatorBtns.forEach((btn) => (btn.disabled = true));
    equalsBtn.disabled = true;
  } else {
    resultDisplay.classList.remove('display__result--error');
    operatorBtns.forEach((btn) => (btn.disabled = false));
    equalsBtn.disabled = false;
  }
  display.resultText = String(content);
  resultDisplay.textContent = display.resultText;
}

function refreshDisplay() {
  // Refreshes the display upon new button input or history restoration,
  // based on the operands and operator currently stored in expression
  // Calculates the result if possible, errors are hidden at this stage
  let result = '';
  if (isExpressionComplete()) {
    result = operate();
    result = (!isNaN(result))
               ? addComma(result)  // Update calculations in real time
               : '';               // Don't display errors yet (only shown when equals is pressed)
  }

  updateMainDisplay(formatExpression());
  updateResultDisplay(result);

  // Once user presses a new button or restores from history, pressing backspace 
  // will no longer pull up the original expression, and instead will go back
  // to deleting one character at a time
  savedExpression = {};
}


// ========== History ==========
function appendHistory(historyData) {
  history.push(historyData);

  const divEntry = document.createElement('div');
  const divExpression = document.createElement('div');
  const divResult = document.createElement('div');

  divEntry.classList.add('history__entry');
  divExpression.classList.add('history__expression');
  divResult.classList.add('history__result');
  divExpression.textContent = `${formatExpression()} =`
  divResult.textContent = display.resultText;

  historyEntries.insertBefore(divEntry, historyEntries.firstChild);
  divEntry.appendChild(divExpression);
  divEntry.appendChild(divResult);
  divEntry.setAttribute('data-id', history.length - 1);

  const height = window.getComputedStyle(divEntry).height;
  divEntry.style.setProperty('--height', height);
  divEntry.classList.add('history__entry--slide');
}

function selectHistoryEntry(e) {
  // Update calculator display to match the selected history entry
  const target = e.target.closest('.history__entry');
  if (!target) return;
  const id = Number(target.dataset.id);
  expression = {...history[id]};
  refreshDisplay();
}

function clearHistory() {
  history = [];
  historyEntries.classList.add('history__entries--fade');
  [...historyEntries.children].forEach((div) => {
    setTimeout(() => div.parentNode.removeChild(div), 1000);
  });
  setTimeout(() => historyEntries.classList.remove('history__entries--fade'), 1000);
}


// ========== Formatting ==========
function roundResult(input) {
  // Returns number rounded to max precision
  if (isNaN(input)) return input;

  // toPrecision(15) to prevent floating point calculation errors
  // parseFloat to remove trailing 0's in decimals
  const rounded = parseFloat(Number(input).toPrecision(15));

  // JavaScript uses scientific notation at 1e21
  // Change that to 1e16 so it doesn't take up too much space
  const result = (rounded >= 1e16 || rounded <= -1e16)
                 ? Number(rounded).toExponential()
                 : rounded;
  return result;
}

function addComma(input) {
  // Returns string with number formatted with comma thousands separator (ie. 4150 -> 4,150)
  input = String(input);

  // Already in the desired format (no change):
  if (
    (!isNaN(input) && input.includes('e')) ||  // Scientific notation
    input === '' ||                            // Blank
    isNaN(input)                               // Can't divide by 0
  ) {
    return input;
  }

  // Convert the whole number part to have comma thousands separator,
  // then combine it with the decimal part unchanged
  // Doing this because regex found online doesn't work on decimals
  // Example: Want 4000.3127 to be 4,000.3127 (not 4,000.3,127)
  const idxOfDecimal = input.indexOf('.');
  const numberPart = idxOfDecimal >= 0 ? input.slice(0, idxOfDecimal) : input;
  const decimalPart = idxOfDecimal >= 0 ? input.slice(idxOfDecimal) : '';
  const numberPartWithComma = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${numberPartWithComma}${decimalPart}`;
}

function removeComma(input) {
  // Returns string without commas (ie. 4,150 becomes 4150)
  return String(input).replace(/,/g, '');
}

function addParentheses(input) {
  // Add parentheses for negative numbers
  return (String(input).startsWith('-'))
          ? `(${input})`
          : input;
}

function formatExpression() {
  // Returns operands and operator formatted into an expression
  // Operands have comma thousands separator to be display-friendly
  // Example: 5,000 + 0.125
  return `${addParentheses(addComma(expression.operand1))} 
          ${expression.operator} 
          ${addParentheses(addComma(expression.operand2))}`.trim();
}


// ========== Keyboard ==========
function handleKeyboardInput(e) {
  // Click corresponding button upon keyboard input
  // Equals button responds to both 'Enter' and '=' keys
  if (e.key === '/') e.preventDefault(); // prevent '/' from opening find in Firefox
  const btn = document.querySelector(`[data-key~="${e.key}"]`);
  if (btn) {
    btn.click();
    // Trigger button press effect for keyboard input by quickly adding/removing class
    btn.classList.add('button--pressed');
    setTimeout(() => btn.classList.remove('button--pressed'), 100);
  }
}


// ========== Utility ==========
function setHistoryPanelHeight() {
  // Sets history panel height dynamically as a percentage of calculator height
  const main = document.querySelector('.main');
  const calculator = document.querySelector('.calculator');
  const history = document.querySelector('.history');
  const calculatorHeight = calculator.offsetHeight;
  const flexDirection = window.getComputedStyle(main).flexDirection;
  history.style.height = (flexDirection === 'row')
                         ? `${calculatorHeight}px`          // Side-by-side = 100% of calculator's height
                         : `${calculatorHeight * 0.6}px`;   // Up-and-down = 70% of calculator's height
}

function getCurrentOperand() {
  // Returns which operand is currently being entered
  return (!expression.operator) ? 'operand1' : 'operand2';
}

function isExpressionComplete() {
  // Returns true if all 3 expression properties are populated
  // (operand1, operand2, operator)
  return Object.values(expression).every((prop) => prop !== '');
}