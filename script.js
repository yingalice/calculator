let expression = { operand1: '0', operand2: '', operator: '' };
let display = { mainText: '0', resultText: '', cursor: 'off' };
let history = [];
let savedExpression = {};

const calculator = document.querySelector('.calculator');
const mainDisplay = document.querySelector('.display__main');
const displayCursor = document.querySelector('.display__cursor');
const allBtns = document.querySelectorAll('[data-btn-type]');
const numberBtns = document.querySelectorAll('[data-btn-type="number"]');
const operatorBtns = document.querySelectorAll('[data-btn-type="operator"]');
const posNegBtn = document.querySelector('[data-btn-type="posneg"');
const decimalBtn = document.querySelector('[data-btn-type="decimal"');
const clearBtn = document.querySelector('[data-btn-type="clear"]');
const backspaceBtn = document.querySelector('[data-btn-type="backspace"]');
const equalsBtn = document.querySelector('[data-btn-type="equals"]');
const historyEntries = document.querySelector('.history__entries');
const clearHistoryBtn = document.querySelector('.history__clear');

mainDisplay.addEventListener('scroll', setCursorVisibility);
allBtns.forEach((btn) => btn.addEventListener('click', addBtnPressEffect));
numberBtns.forEach((btn) => btn.addEventListener('click', appendNumber));
operatorBtns.forEach((btn) => btn.addEventListener('click', appendOperator));
posNegBtn.addEventListener('click', appendPosNeg);
decimalBtn.addEventListener('click', appendDecimal);
clearBtn.addEventListener('click', clear);
backspaceBtn.addEventListener('click', backspace);
equalsBtn.addEventListener('click', displayFinalResult);
historyEntries.addEventListener('click', selectHistoryEntry, false);
clearHistoryBtn.addEventListener('click', clearHistory);
document.addEventListener('keydown', handleKeyboardInput);

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
  return b === 0 ? `Can't divide by 0` : a / b;
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

  if (expression[operand] === '0') expression[operand] = ''; // Remove leading zeros
  if (expression[operand] === '-0') expression[operand] = '-'; // Remove leading zeros (negative)
  expression[operand] += numberInput; // Append new number
  if (operand === 'operand2') {
    const result = operate();
    if (!isNaN(result)) {
      updateResultDisplay(addComma(result)); // Update calculation in real time
    } else {
      updateResultDisplay(''); // Don't display divide by 0 error until equals is pressed
    }
  }
  restoreDisplayFromExpression();
}

function appendOperator(e) {
  // Calculate any existing pair of numbers first
  // Operators evaluated left to right (no order of expressions)
  // Example: 12 + 7 - 5 * 3 = 42.  After inputting '12 + 7 -', main display will read '19 -'
  if (expression.operand2) finalizeCalculation();
  expression.operator = e.target.textContent;
  restoreDisplayFromExpression();
}

function appendPosNeg() {
  // Returns current operand as a positive or negative number (toggle)
  const operand = getCurrentOperand();
  // Doing it this way instead of multiplying by -1 to keep original format
  // (retain scientific or standard notation)
  expression[operand] = (expression[operand].startsWith('-'))
                          ? expression[operand].slice(1)
                          : `-${expression[operand]}`;
  restoreDisplayFromExpression();
  return expression[operand];
}

function appendDecimal() {
  const operand = getCurrentOperand();
  if (expression[operand].includes('.')) return; // No more than 1 decimal per operand
  const decimalFormat = expression[operand] === '' ? '0.' : '.'; // Format decimal with leading zero (ie. 0.15 insted of .15)
  expression[operand] += decimalFormat;
  restoreDisplayFromExpression();
}

function inputAccepted() {
  setCursorBlink('on');
  savedExpression = {};
}

function finalizeCalculation() {
  // Returns result of the current expression
  // User is done entering this expression (pressed equals or an additional operator)
  // Use result as operand1 of next expression, and clear operand2 and operator
  const result = operate();
  savedExpression = {...expression};
  appendHistory({...expression});
  expression.operand1 = result;
  expression.operand2 = '';
  expression.operator = '';
  return result;
}


// ========== Corrections ==========
function clear() {
  // Reset everything
  expression = { operand1: '0', operand2: '', operator: '' };
  updateMainDisplay('0');
  updateResultDisplay('');
  setCursorBlink('off');
  savedExpression = {};
}

function backspace() {
  // If prior action was pressing equals to get a result,
  // restore the previous expression
  if (Object.keys(savedExpression).length !== 0) {
    expression = {...savedExpression};
    restoreDisplayFromExpression();
    return;
  }

  // Everything erased, reset to 0 and turn off cursor
  if (display.mainText.length === 1) {
    clear();
    return;
  }

  // Remove last character, and update corresponding variable (operator1, operator2, or operand)
  if (expression.operand2) {
    if ((expression.operand2.length === 2) && (expression.operand2.startsWith('-'))) {  // Single digit negative
      expression.operand2 = '';
    } else {
      expression.operand2 = expression.operand2.slice(0, -1);
    }
  } else if (expression.operator) {
    expression.operator = '';
  } else if (expression.operand1) {
    if ((expression.operand1.includes('e')) ||  // Clear entire scientific notation (don't backspace one-by-one)
       ((expression.operand1.length === 2) && (expression.operand1.startsWith('-')))) {  // Single digit negative
      clear();
      return;
    } else {
      expression.operand1 = expression.operand1.slice(0, -1);
    }
  }
  restoreDisplayFromExpression();
}


// ========== Display ==========
function displayFinalResult() {
  if (!isExpressionComplete()) return;
  // If result is currently blank, then there's a hidden error
  // Show the error, but don't save it to operand1 or update the main display
  const result = (display.resultText === '') ? operate() : finalizeCalculation();
  if (isNaN(result)) {
    updateResultDisplay(addComma(result));
  } else {
    updateMainDisplay(addComma(result));
    updateResultDisplay('');
    setCursorBlink('off');
  }
}

function updateMainDisplay(content) {
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

function restoreDisplayFromExpression() {
  // Update the displays using the operands and operator currently stored in expression
  // Used to restore from history selection or after pressing backspace
  updateMainDisplay(formatExpression());
  const result = (isExpressionComplete() && !(expression.operator === '÷' && Number(expression.operand2) === 0))
                   ? addComma(operate())
                   : '';
  updateResultDisplay(result);  // Only display results if it can be calculated without error
  inputAccepted();
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
  restoreDisplayFromExpression();
  inputAccepted();
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

function formatExpression() {
  // Returns operands and operator formatted into an expression
  // Operands have comma thousands separator to be display-friendly
  // Example: 5,000 + 0.125
  return `${addParenthesis(addComma(expression.operand1))} 
          ${expression.operator} 
          ${addParenthesis(addComma(expression.operand2))}`.trim();
}

function addParenthesis(input) {
  // Add parenthesis for negative number
  return (String(input).startsWith('-'))
          ? `(${input})`
          : input;
}

// ========== Cursor ==========
function setCursorBlink(status) {
  // Show or hide the blinking cursor
  switch (status) {
    case 'on':
      displayCursor.classList.add('display__cursor--blink');
      break;
    case 'off':
      displayCursor.classList.remove('display__cursor--blink');
      break;
    default:
      console.error(`${arguments.callee.name}() - Invalid status: ${status}`);
      return;
  }
  display.cursor = status;
}

function setCursorVisibility() {
  // Hide cursor if user has scrolled out of view (away from right of main display)
  if (mainDisplay.scrollLeft >= 0) {
    displayCursor.classList.remove('display__cursor--hide');
  } else {
    displayCursor.classList.add('display__cursor--hide');
  }
}


// ========== Keyboard ==========
function handleKeyboardInput(e) {
  // Click corresponding button upon keyboard input
  // Equals button responds to both 'Enter' and '=' keys
  if (e.key === '/') e.preventDefault(); // prevent '/' from opening find in Firefox
  const btn = document.querySelector(`[data-key~="${e.key}"]`);
  if (btn) btn.click();
}

function addBtnPressEffect(e) {
  // Trigger button press effect, works with keyboard input
  // Note: Normally would use :active in CSS, but that doesn't work with keyboard
  const btn = e.target;
  btn.blur();
  btn.classList.add('button--pressed');
  setTimeout(() => btn.classList.remove('button--pressed'), 100);
}


// ========== Utility ==========
function getCurrentOperand() {
  // Returns which operand is currently being entered for number or decimal input
  return !expression.operator ? 'operand1' : 'operand2';
}

function isExpressionComplete() {
  // Returns true if all 3 expression properties are populated
  // (operand1, operand2, operator)
  return Object.values(expression).every((prop) => prop !== '');
}