let operation = {operand1: '', operand2: '', operator: ''};
let display = {mainText: '0', resultText: '', cursor: 'off'};
let history = [];
let needsHistoryCleanup = false;

const mainDisplay = document.querySelector('.display__main');
const resultDisplay = document.querySelector('.display__result');
const displayCursor = document.querySelector('.display__cursor');
const clearBtn = document.querySelector('[data-btn-type="clear"]');
const backspaceBtn = document.querySelector('[data-btn-type="backspace"]');
const equalsBtn = document.querySelector('[data-btn-type="equals"]');
const allBtns = document.querySelectorAll('[data-btn-type]');
const historyBtns = document.querySelectorAll('[data-btn-type="number"], [data-btn-type="decimal"], [data-btn-type="operator"]')
const decimalBtn = document.querySelector('[data-btn-type="decimal"');
const numberBtns = document.querySelectorAll('[data-btn-type="number"]');
const operatorBtns = document.querySelectorAll('[data-btn-type="operator"]');

document.addEventListener('keydown', handleKeyboardInput);
allBtns.forEach(btn => btn.addEventListener('click', addBtnPressEffect));
historyBtns.forEach(btn => btn.addEventListener('click', saveHistory));
numberBtns.forEach(btn => btn.addEventListener('click', appendNumber));
operatorBtns.forEach(btn => btn.addEventListener('click', appendOperator));
clearBtn.addEventListener('click', clear);
backspaceBtn.addEventListener('click', backspace);
equalsBtn.addEventListener('click', calculate);
decimalBtn.addEventListener('click', appendDecimal);

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
  let a = Number(operation.operand1);
  let b = Number(operation.operand2);

  switch (operation.operator) {
    case '+':
      return roundResult(add(a, b));
    case '-':
      return roundResult(subtract(a, b));
    case 'x':
      return roundResult(multiply(a, b));
    case '÷':
      return roundResult(divide(a, b));
    default:
      console.error(`${arguments.callee.name} - Invalid operator: ${operation.operator}`);
  }
}

function clear() {
  operation.operand1 = '';
  operation.operand2 = '';
  operation.operator = '';
  updateMainDisplay('0');
  updateResultDisplay('');
  setCursorBlink('off');
  history = [];
  needsHistoryCleanup = false;
}

function backspace() {
  if (!history.length) return;
  const lastHistory =   history.pop();
  operation.operand1 = lastHistory.operand1;
  operation.operand2 = lastHistory.operand2;
  operation.operator = lastHistory.operator;
  updateMainDisplay(lastHistory.mainText);
  updateResultDisplay(lastHistory.resultText);
  setCursorBlink(lastHistory.cursor);
}

function appendDecimal() {
  const operand = getCurrentOperand();
  if (operation[operand].includes('.')) {
    history.pop();
    return;
  }
  const decimalFormat = (operation[operand] === '' || display.mainText === '0') ? '0.' : '.';
  operation[operand] += decimalFormat;
  if (display.mainText === '0') display.mainText = '';
  updateMainDisplay(`${display.mainText}${decimalFormat}`);
  setCursorBlink('on');
}

function appendNumber(e) {
  const numberInput = e.target.textContent;
  const operand = getCurrentOperand();
  if (display.mainText === '0' || (operation[operand].startsWith('0') && !operation[operand].includes('.'))) {
    operation[operand] = '';
    if (display.mainText !== '0') history.pop();
    display.mainText = display.mainText.slice(0, -1);
  }
  operation[operand] += numberInput;
  if (operand === 'operand2') updateResultDisplay(String(operate()));
  const operandComma = addComma(operation[operand]);
  const idx = display.mainText.lastIndexOf(' ');
  const mainDisplayValueWithoutLastOperand = (idx >= 0) ? display.mainText.slice(0, idx) : '';
  updateMainDisplay(`${mainDisplayValueWithoutLastOperand} ${operandComma}`);
  setCursorBlink('on');
}

function appendOperator(e) {
  if (!operation.operand1) {   // 1. No numbers entered yet
    operation.operand1 = '0';  //    Set operand1 to 0 to match starting display
  } else if (operation.operand1 && operation.operand2 && operation.operator) {  // 2. Pair of numbers ready to be calculated
    operation.operand1 = String(operate());                                     //    Calculate last pair of numbers to support stringing multiple operations
    operation.operand2 = '';
    operation.operator = '';
  } else if (operation.operand1 && !operation.operand2 && operation.operator) {  // 3. Operators entered back-to-back
    display.mainText = display.mainText.slice(0, -3);                            //    Remove last operator
    history.pop();
  }
  operation.operator = e.target.textContent;
  updateMainDisplay(`${display.mainText} ${operation.operator} `);
  setCursorBlink('on');
}

function calculate() {
  if (display.resultText === '') return;
  if (!isNaN(removeComma(display.resultText))) {
    cleanupHistory();
    history[history.length - 1].equalsPressed = true;
    needsHistoryCleanup = true;
    operation.operand1 = removeComma(display.resultText);
    operation.operand2 = '';
    operation.operator = '';
    updateMainDisplay(display.resultText);
    updateResultDisplay('');
  }
  setCursorBlink('off');
}

function updateMainDisplay(content) {
  display.mainText = content;
  mainDisplay.textContent = display.mainText;
}

function updateResultDisplay(content) {
  content = removeComma(content);
  if (isNaN(content)) {
    resultDisplay.classList.add('display__result--error');
    operatorBtns.forEach(btn => btn.disabled = true);
    equalsBtn.disabled = true;
  } else {
    resultDisplay.classList.remove('display__result--error');
    operatorBtns.forEach(btn => btn.disabled = false);
    equalsBtn.disabled = false;
  }
  display.resultText = addComma(content);
  resultDisplay.textContent = display.resultText;
}

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
      console.error(`${arguments.callee.name} - Invalid status: ${status}`);
      return;
  }
  display.cursor = status;
}

function roundResult(input) {
  // Returns number rounded to max precision
  // toPrecision(15) to prevent floating point calculation errors
  // parseFloat to remove trailing 0's in decimals
  if (isNaN(input)) return input;
  return parseFloat(Number(input).toPrecision(15));
}

function addComma(input) {
  // Returns string with number formatted with comma thousands separator (ie. 4150 -> 4,150)
  input = String(input);
  if ((!isNaN(input) && input.includes('e')) ||  // Scientific notation
      input === '' ||                            // Blank
      isNaN(input))                              // Can't divide by 0
  {
    return input;  // No change, already in desired format
  }
  // Convert the whole number part to have comma thousands separator, 
  // then combine it with the decimal part unchanged
  // Doing this because regex found online doesn't work right on decimals
  // Example: Want 4000.3127 to be 4,000.3127 (not 4,000.3,127)
  const idxOfDecimal = input.indexOf('.');
  const numberPart = (idxOfDecimal >= 0) ? input.slice(0, idxOfDecimal) : input;
  const decimalPart = (idxOfDecimal >= 0) ? input.slice(idxOfDecimal) : '';
  const numberPartWithComma = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${numberPartWithComma}${decimalPart}`;
}

function removeComma(input) {
  // Returns string without commas (ie. 4,150 becomes 4150)
  return String(input).replace(/,/g, '');
}

function saveHistory() {
  const entry = {
    operand1: operation.operand1,
    operand2: operation.operand2,
    operator: operation.operator,
    mainText: display.mainText,
    resultText: display.resultText,
    cursor: display.cursor,
    equalsPressed: false,
  };
  history.push(entry);
  if (needsHistoryCleanup) cleanupHistory();
}

function cleanupHistory() {
  needsHistoryCleanup = false;
  const idx = history.findIndex(item => item.equalsPressed === true);
  if (idx > 0) history.splice(1, idx);
  if (history.length < 2) return;
  const mainText = history[1].mainText.trim();
  if (!isNaN(mainText) && mainText.includes('e')) return; // Scientific notation
  if (mainText.length > 1) {
    // Extract 1 fewer digit each time
    // Example: 456 becomes 3 separate history entries: 456, 45, 4
    //          to allow backspacing one number at a time
    for (let i = 1; i <= mainText.length - 1; i++) {
      const partialNumber = mainText.slice(0, -i)
      const entry = {
        operand1: partialNumber,
        operand2: '',
        operator: '',
        mainText: partialNumber,
        resultText: '',
        cursor: 'on',
        equalsPressed: false,
      };
      history.splice(1, 0, entry);  
    }
  }
}

function handleKeyboardInput(e) {
  // Click corresponding button upon keyboard input
  // Equals button responds to both 'Enter' and '=' keys
  if (e.key === '/') e.preventDefault();  // prevent '/' from opening find in Firefox
  const btn = document.querySelector(`[data-key~="${e.key}"]`);
  if (btn) btn.click();
}

function addBtnPressEffect(e) {
  // Trigger button press effect, works with keyboard input
  const btn = e.target;
  btn.blur();
  btn.classList.add('button--pressed');
  setTimeout(() => btn.classList.remove('button--pressed'), 50);
}

function getCurrentOperand() {
  return (!operation.operator) ? 'operand1' : 'operand2';
}