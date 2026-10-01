const display = document.getElementById("display");
const historyDisplay = document.getElementById("historyDisplay");
const historyList = document.getElementById("historyList");
const themeBtn = document.getElementById("themeBtn");
const clearHistoryBtn = document.getElementById("clearHistory");

let expression = "";
let justCalculated = false;

let calculations = JSON.parse(
  localStorage.getItem("calcmate-history") || "[]"
);

// =========================
// DISPLAY
// =========================

function updateDisplay() {
  display.textContent = expression || "0";
}

// =========================
// ADD VALUE
// =========================

function appendValue(value) {

  // Start a new calculation after pressing =
  if (justCalculated && /[0-9.]/.test(value)) {
    expression = "";
    historyDisplay.textContent = "";
  }

  justCalculated = false;

  // Prevent multiple decimal points
  if (value === ".") {

    const current = expression.split(/[+\-*/]/).pop();

    if (current.includes(".")) {
      return;
    }

    if (!current) {
      expression += "0";
    }
  }

  // Prevent two operators together
  if (/[+\-*/]/.test(value)) {

    if (!expression) {
      // Allow negative number at the beginning
      if (value === "-") {
        expression = "-";
      }

      updateDisplay();
      return;
    }

    const lastCharacter = expression.slice(-1);

    if (/[+\-*/]/.test(lastCharacter)) {
      expression = expression.slice(0, -1) + value;
      updateDisplay();
      return;
    }
  }

  expression += value;

  updateDisplay();
}

// =========================
// CLEAR
// =========================

function clearAll() {
  expression = "";
  historyDisplay.textContent = "";
  justCalculated = false;

  updateDisplay();
}

// =========================
// DELETE
// =========================

function deleteLast() {
  expression = expression.slice(0, -1);

  justCalculated = false;

  updateDisplay();
}

// =========================
// FORMAT EXPRESSION
// =========================

function formatExpression(value) {
  return value
    .replaceAll("*", "×")
    .replaceAll("/", "÷")
    .replaceAll("-", "−");
}

// =========================
// CALCULATE
// =========================

function calculate() {

  if (!expression) {
    return;
  }

  try {

    // Only allow calculator characters
    if (!/^[0-9+\-*/.()\s]+$/.test(expression)) {
      throw new Error("Invalid expression");
    }

    // Don't calculate if expression ends with an operator
    if (/[+\-*/]$/.test(expression)) {
      return;
    }

    const result = Function(
      '"use strict"; return (' + expression + ")"
    )();

    // Check for invalid results
    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    // Remove unnecessary decimal digits
    const clean = Number.isInteger(result)
      ? String(result)
      : String(Number(result.toFixed(10)));

    // Show previous expression
    historyDisplay.textContent =
      formatExpression(expression) + " =";

    // Show result
    display.textContent = clean;

    // Save calculation
    calculations.unshift({
      expression: formatExpression(expression),
      result: clean
    });

    // Keep only latest 8 calculations
    calculations = calculations.slice(0, 8);

    localStorage.setItem(
      "calcmate-history",
      JSON.stringify(calculations)
    );

    renderHistory();

    expression = clean;
    justCalculated = true;

  } catch (error) {

    display.textContent = "Error";

    expression = "";

    justCalculated = true;
  }
}

// =========================
// PERCENTAGE
// =========================

function percent() {

  if (!expression) {
    return;
  }

  const match = expression.match(/(-?\d*\.?\d+)$/);

  if (!match) {
    return;
  }

  const value = Number(match[1]) / 100;

  expression =
    expression.slice(0, -match[1].length) +
    String(value);

  updateDisplay();
}

// =========================
// POSITIVE / NEGATIVE
// =========================

function toggleSign() {

  if (!expression) {
    return;
  }

  const match = expression.match(/(-?\d*\.?\d+)$/);

  if (!match) {
    return;
  }

  const number = match[1];

  const changed = number.startsWith("-")
    ? number.slice(1)
    : "-" + number;

  expression =
    expression.slice(0, -number.length) +
    changed;

  updateDisplay();
}

// =========================
// HISTORY
// =========================

function renderHistory() {

  if (!calculations.length) {

    historyList.innerHTML =
      '<p class="empty">No calculations yet.</p>';

    return;
  }

  historyList.innerHTML = calculations
    .map(
      (item) => `
        <div class="history-item">
          <span>${item.expression}</span>
          <strong>${item.result}</strong>
        </div>
      `
    )
    .join("");
}

// =========================
// BUTTON EVENTS
// =========================

document.querySelectorAll(".key").forEach((button) => {

  button.addEventListener("click", () => {

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) {
      appendValue(value);
    }

    if (action === "clear") {
      clearAll();
    }

    if (action === "delete") {
      deleteLast();
    }

    if (action === "percent") {
      percent();
    }

    if (action === "sign") {
      toggleSign();
    }

    if (action === "decimal") {
      appendValue(".");
    }

    if (action === "equals") {
      calculate();
    }

  });

});

// =========================
// KEYBOARD SUPPORT
// =========================

document.addEventListener("keydown", (event) => {

  const key = event.key;

  // Numbers and operators
  if (
    /^[0-9]$/.test(key) ||
    ["+", "-", "*", "/", "."].includes(key)
  ) {

    appendValue(key);

  }

  // Enter / =
  else if (key === "Enter" || key === "=") {

    event.preventDefault();

    calculate();

  }

  // Backspace
  else if (key === "Backspace") {

    deleteLast();

  }

  // Escape
  else if (key === "Escape") {

    clearAll();

  }

  // Percentage
  else if (key === "%") {

    percent();

  }

});

// =========================
// CLEAR HISTORY
// =========================

clearHistoryBtn.addEventListener("click", () => {

  calculations = [];

  localStorage.removeItem("calcmate-history");

  renderHistory();

});

// =========================
// DARK / LIGHT MODE
// =========================

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("dark");

  themeBtn.textContent =
    document.body.classList.contains("dark")
      ? "☀"
      : "☾";

});

// =========================
// INITIALIZE
// =========================

renderHistory();

updateDisplay();