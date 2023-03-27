let opr = {operand1: '', operand2: '', operator: ''};
let history = [];
let mainDisplayValue = '0';
let resultDisplayValue = '';
let needsHistoryCleanup = false;
let prevBtnType = '';

const mainDisplay = document.querySelector('.display__main');
const resultDisplay = document.querySelector('.display__result');
const clearBtn = document.querySelector('[data-btn-type="clear"]');
const backspaceBtn = document.querySelector('[data-btn-type="backspace"]');
const equalsBtn = document.querySelector('[data-btn-type="equals"]');
const allBtns = document.querySelectorAll('[data-btn-type]');
const historyBtns = document.querySelectorAll('[data-btn-type="number"], [data-btn-type="decimal"], [data-btn-type="operator"]')
const decimalBtn = document.querySelector('[data-btn-type="decimal"');
const numberBtns = document.querySelectorAll('[data-btn-type="number"]');
const operatorBtns = document.querySelectorAll('[data-btn-type="operator"]');

document.addEventListener('keydown', handleKeyboardInput);
allBtns.forEach(btn => btn.addEventListener('click', addKeyboardHover));
historyBtns.forEach(btn => btn.addEventListener('click', saveHistory));
numberBtns.forEach(btn => btn.addEventListener('click', appendNumber));
operatorBtns.forEach(btn => btn.addEventListener('click', appendOperator));
clearBtn.addEventListener('click', clear);
backspaceBtn.addEventListener('click', backspace);
equalsBtn.addEventListener('click', calculate);
decimalBtn.addEventListener('click', appendDecimal);

function handleKeyboardInput(e) {
  const btn = document.querySelector(`[data-key="${e.key}"]`);
  if (btn) btn.click();
}

function saveHistory() {
  const entry = {
    operand1: opr.operand1,
    operand2: opr.operand2,
    operator: opr.operator,
    mainDisplayValue,
    resultDisplayValue,
    equalsPressed: false,
  };

  history.push(entry);

  if (needsHistoryCleanup) {
    needsHistoryCleanup = false;
    cleanupHistory();
  }
}

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
  let a = Number(opr.operand1);
  let b = Number(opr.operand2);

  switch (opr.operator) {
    case '+':
      return roundResult(add(a, b));
    case '-':
      return roundResult(subtract(a, b));
    case 'x':
      return roundResult(multiply(a, b));
    case '÷':
      return roundResult(divide(a, b));
    default:
      throw new Error(`Invalid operation: ${opr.operator}`);
  }
}

function clear() {
  opr.operand1 = '';
  opr.operand2 = '';
  opr.operator = '';
  history = [];
  updateMainDisplay('0');
  updateResultDisplay('');
  needsHistoryCleanup = false;
  prevBtnType = '';
}

function backspace() {
  if (!history.length) return;
  const lastHistory =   history.pop();
  opr.operand1 = lastHistory.operand1;
  opr.operand2 = lastHistory.operand2;
  opr.operator = lastHistory.operator;
  updateMainDisplay(lastHistory.mainDisplayValue);
  updateResultDisplay(lastHistory.resultDisplayValue);
}

function appendDecimal() {
  const operand = getCurrentOperand();
  if (opr[operand].includes('.')) {
    history.pop();
    return;
  }
  const decimalFormat = (opr[operand] === '' || mainDisplayValue === '0') ? '0.' : '.';
  opr[operand] += decimalFormat;
  if (mainDisplayValue === '0') mainDisplayValue = '';
  updateMainDisplay(`${mainDisplayValue}${decimalFormat}`);
}

function appendNumber(e) {
  const numberInput = e.target.textContent;
  const operand = getCurrentOperand();
  if (mainDisplayValue === '0' || (opr[operand].startsWith('0') && !opr[operand].includes('.'))) {
    opr[operand] = '';
    if (mainDisplayValue !== '0') history.pop();
    mainDisplayValue = mainDisplayValue.slice(0, -1);
  }
  opr[operand] += numberInput;
  if (operand === 'operand2') updateResultDisplay(String(operate()));
  const operandComma = addComma(opr[operand]);
  const idx = mainDisplayValue.lastIndexOf(' ');
  const mainDisplayValueWithoutLastOperand = (idx >= 0) ? mainDisplayValue.slice(0, idx) : '';
  updateMainDisplay(`${mainDisplayValueWithoutLastOperand} ${operandComma}`);
}

function appendOperator(e) {
  if (!opr.operand1) {   // 1. No numbers entered yet
    opr.operand1 = '0';  //    Set operand1 to 0 to match starting display
  } else if (opr.operand1 && opr.operand2 && opr.operator) {  // 2. Pair of numbers ready to be calculated
    opr.operand1 = String(operate());                                 //    Calculate last pair of numbers to support stringing multiple operations
    opr.operand2 = '';
    opr.operator = '';
  } else if (opr.operand1 && !opr.operand2 && opr.operator) {      // 3. Operators entered back-to-back
    mainDisplayValue = mainDisplayValue.slice(0, -3);              //    Remove last operator
    history.pop();
  }
  opr.operator = e.target.textContent;
  updateMainDisplay(`${mainDisplayValue} ${opr.operator} `);
}

function calculate() {
  if (resultDisplayValue === '') return;
  if (!isNaN(removeComma(resultDisplayValue))) {
    cleanupHistory();
    history[history.length - 1].equalsPressed = true;
    needsHistoryCleanup = true;
    opr.operand1 = removeComma(resultDisplayValue);
    opr.operand2 = '';
    opr.operator = '';
    updateMainDisplay(resultDisplayValue);
    updateResultDisplay('');
  }
}

function cleanupHistory() {
  needsHistoryCleanup = false;
  const idx = history.findIndex(item => item.equalsPressed === true);
  if (idx > 0) history.splice(1, idx);
  if (history.length < 2) return;
  const secondMainDisplayValue = history[1].mainDisplayValue.trim();
  if (secondMainDisplayValue.length > 1) {
    // Extract 1 fewer digit each time
    for (let i = 1; i <= secondMainDisplayValue.length - 1; i++) {
      const partialNumber = secondMainDisplayValue.slice(0, -i)
      const entry = {
        operand1: partialNumber,
        operand2: '',
        operator: '',
        mainDisplayValue: partialNumber,
        resultDisplayValue: '',
        equalsPressed: false,
      };
    
      history.splice(1, 0, entry);  
    }
  }
}

function updateMainDisplay(content) {
  mainDisplayValue = content;
  mainDisplay.textContent = mainDisplayValue;
}

function updateResultDisplay(content) {
  resultDisplayValue = addComma(content);
  resultDisplay.textContent = resultDisplayValue;
}

function getCurrentOperand() {
  return (!opr.operator) ? 'operand1' : 'operand2';
}

function roundResult(input) {
  if (isNaN(input)) return input;
  let roundedNumber = String(Math.round(input * 10000000000) / 10000000000);
  return roundedNumber;
}

function addComma(input) {
  const inputWithoutComma = removeComma(input);
  const idx = inputWithoutComma.indexOf('.');
  const minimumFractionDigits = idx >= 0 ? inputWithoutComma.length - idx - 1 : 0;
  return !isNaN(inputWithoutComma) && inputWithoutComma !== '' ?
      parseFloat(inputWithoutComma).toLocaleString('en', {
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: 20,
      })
    : input;
}

function removeComma(input) {
  return String(input).replace(/,/g, '');
}

function addKeyboardHover(e) {
  e.target.blur();
  e.target.classList.add('button--pressed');
  setTimeout(() => e.target.classList.remove('button--pressed'), 100);
}