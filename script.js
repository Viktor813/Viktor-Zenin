const display = document.getElementById("display");

function append(value) {
    display.value += value;
}

function clearDisplay() {
    display.value = "";
}

function deleteLast() {
    display.value = display.value.slice(0, -1);
}

function calculate() {
    try {
        display.value = eval(display.value);
    } catch {
        display.value = "Ошибка";
    }
}

// Управление с клавиатуры
document.addEventListener("keydown", function(event) {

    const key = event.key;

    if (!isNaN(key) || "+-*/.%".includes(key)) {
        display.value += key;
    }

    if (key === "Enter") {
        calculate();
    }

    if (key === "Backspace") {
        deleteLast();
    }

    if (key === "Escape") {
        clearDisplay();
    }
});

// script.js
const API_URL = 'http://localhost:3000/api';

// Сохранение вычисления в историю
async function saveCalculation(expression, result) {
    try {
        const response = await fetch(`${API_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression, result })
        });
        const data = await response.json();
        console.log('Сохранено в историю:', data);
        return data;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Загрузка истории
async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();
        console.log('История вычислений:', data);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}


function calculate() {
    try {
        const display = document.getElementById('display');
        const expression = display.value;

        // Безопасное вычисление (замена для eval)
        const result = Function('"use strict"; return (' + expression + ')')();
        display.value = result;

        // Сохраняем в базу данных
        saveCalculation(expression, result);
    } catch {
        display.value = 'Error';
    }
}