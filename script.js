const main_container = document.querySelector(".main")

const add_bill_button = document.querySelector("#add_bill");
const update_debt_button = document.querySelector("#update_debt")
const add_debt_button = document.querySelector("#add_debt")
const save_button = document.querySelector("#save")
const add_expense_button = document.querySelector("#add_expense")
const add_food_button = document.querySelector("#add_food")
const update_week_button = document.querySelector('#update_week')
const add_carry_over_button = document.querySelector(`#add_carry`)

const date_inputs = document.querySelectorAll("input[type='date']")
const week_selector = document.querySelector("#week")

const bills_container = document.querySelector("#bills-field")
const debts_cointainer = document.querySelector("#debts-container")
const food_container = document.querySelector("#food-container")
const income_container = document.querySelector('#income_container')
const total_debt_container = document.querySelector("#total_debt")
const weeks_left_container = document.querySelector("#debt_weeks")
const food_remaining_container = document.querySelector('#food-left')
const food_total_container = document.querySelector('#food-total')
const weekly_debt_amount_container = document.querySelector('#weekly-debt-amount')
const carry_over_container = document.querySelector('#carry_container')

const day_input = document.querySelector("#day")

let day_of_week = 0;

let global = 30

let delete_debt = [];
let delete_bills = [];
let delete_food = [];

let data = null;
const jsonFilePath = 'data.json';

date_inputs.forEach(date => {
    const tdate = new Date();
    if (date.value === "") {
        date.value = formatDateToYYYYMMDD(tdate)
    }
})


// 2. Define the asynchronous loading function
async function loadAndAttachData() {
    try {
        const response = await fetch(jsonFilePath);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const loadedData = await response.json();

        // 3. Attach the loaded data to the global variable
        data = loadedData;

        console.log("? Data successfully attached to the global 'data' variable.");

        // 4. Call the function that depends on the data *after* it's loaded
        processData();

    } catch (error) {
        console.error('Could not load or attach JSON file:', error);
        
    }
}


// 1. Helper function to format a Date object into a simple YYYY-MM-DD string (local time)
function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    // Month is 0-indexed, so add 1 and pad with '0' if needed
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Pad the day with '0' if needed
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 2. Define a helper function to get the Start (Sunday) and End (Saturday) dates of the current week.
function getCurrentWeekDateRange() {
    today = data.currentWeek
    today.setHours(0, 0, 0, 0); // Set time to start of day for consistent calculations
    const currentDayOfWeek = today.getDay(); // 0 is Sunday

    if (day_input.value === "") {
        day_input.value = currentDayOfWeek + 1
    }
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() - currentDayOfWeek);

    const saturdayDate = new Date(sundayDate);
    saturdayDate.setDate(sundayDate.getDate() + 6);

    // Return the Date objects themselves, which we will use to generate formatted strings
    return {
        start: sundayDate,
        end: saturdayDate
    };
}
function filterExpensesByWorkWeek(expensesList) {
    const { start, end } = getCurrentWeekDateRange();

    // Convert our filter boundaries into comparison strings
    const startDateString = formatDateToYYYYMMDD(start);
    const endDateString = formatDateToYYYYMMDD(end);


    return expensesList.filter(expense => {
        const expenseDateString = expense.date; // Use the raw simple string

        // Compare the strings lexicographically (which works for YYYY-MM-DD format)
        return expenseDateString >= startDateString && expenseDateString <= endDateString;
    });
}


// 4. Define a function to process or use the data
function processData() {
    // You can now access the data variable globally and use it
    if (data) {
        console.log("Data is ready to use:", data);

        data.currentWeek = new Date(data.currentWeek)

        function roundNumber(number) {
            return Math.round(number * 100) / 100; // 4.69
        }

        function addEntry(object, type) {
            const name = document.querySelector(`#${type}_name`).value;
            const amount = document.querySelector(`#${type}_amount`).value;
            const date = document.querySelector(`#${type}_date`).value;
            //console.log(name, amount, date) 
            object.push({ "name": name, "amount": parseInt(amount), "date": date, "id": (global) })
            global++

        }

        function editEntry(object) {
            const name = object.name
            const amount = object.amount
            const date = object.date
            //console.log(name, amount, date) 
            object.push({ "name": name, "amount": parseInt(amount), "date": date, "id": (global) })
            global++

        }

        function updateTotals() {
            let total = 0;
            let total_debt_adjustments = 0;
            let total_income = 0;
            let total_food = 0
            let total_carry = 0;
            const food_budget = 70;
            data.bills.forEach(bill => {
                total += bill.amount;
            });

            if (data.debt_expenses.length > 0) {
                data.debt_expenses.forEach(debt => {
                    total_debt_adjustments += debt.amount
                })
            }

            data.carry_over.forEach(carry => {
                total_carry += carry.amount
            })


            filterExpensesByWorkWeek(data.weekly_adjustments).forEach(income => {
                total_income += income.amount
            })

            filterExpensesByWorkWeek(data.food_expenses).forEach(food => {
                total_food += food.amount
            })

            let food_remaining = food_budget - total_food;


            console.log(food_remaining)

            if (food_remaining < 0) {

                data.totals[0].weekly_income = total_income + food_remaining;
            } else {
                data.totals[0].weekly_income = total_income;
            }
            data.debt[0].total_debt_adjustments = roundNumber(total_debt_adjustments);
            data.debt[0].total_debt_adjusted = data.debt[0].total_debt - data.debt[0].total_debt_adjustments;
            data.totals[0].monthly_bills_total = roundNumber(total);
            data.totals[0].weekly_bills_total = roundNumber(total / 4);
            if (data.debt[0].total_debt_adjusted === 0) {
                data.totals[0].weekly_total_debt = roundNumber(data.debt[0].total_debt / data.debt[0].weeks_left);
            } else {
                data.totals[0].weekly_total_debt = roundNumber(data.debt[0].total_debt_adjusted / data.debt[0].weeks_left);
            }
            data.totals[0].monthly_total_debt = roundNumber(data.totals[0].weekly_total_debt * 4);
            data.totals[0].weekly_total = roundNumber((data.totals[0].weekly_bills_total + data.totals[0].weekly_total_debt) - data.totals[0].weekly_income)
            data.totals[0].per_day_total = roundNumber(data.totals[0].weekly_total / (8 - day.value));
            data.totals[0].carry_total = total_carry;
        }

        function populateList(containerName, obj, totalName, deleteTerm, colors = false) {

            const container = document.createElement("div");
            const delete_button = document.createElement("button")
            delete_button.textContent = "Remove";
            delete_button.id = deleteTerm
            delete_button.className = "deleteButton"
            container.className = "item";
            const newDiv = document.createElement("div")
            newDiv.textContent = `${obj.date} ${obj.name} $${obj.amount}`
            container.id = `${totalName}`

            if (colors) {
                if (obj.amount < 0) {
                    container.style.backgroundColor = "darksalmon";
                }
            }

            container.appendChild(newDiv)
            container.appendChild(delete_button)
            containerName.appendChild(container)
        }


        function update_display() {
            bills_container.innerHTML = ""
            debts_cointainer.innerHTML = ""
            food_container.innerHTML = ""
            income_container.innerHTML = ""
            carry_over_container.innerHTML = ""

            data.bills.forEach((bill, id) => {
                populateList(bills_container, bill, bill.id, "deleteBills")
            })

            data.carry_over.forEach(carry => {
                populateList(carry_over_container, carry, carry.id, "deleteCarry")
            })

            if (data.debt_expenses.length > 0) {
                data.debt_expenses.forEach((debt, id) => {
                    populateList(debts_cointainer, debt, debt.id, "deleteDebt")
                })
            }

            if (filterExpensesByWorkWeek(data.food_expenses).length > 0) {
                let total = 0
                filterExpensesByWorkWeek(data.food_expenses).forEach((food, id) => {
                    populateList(food_container, food, food.id, "deleteFood")
                    total += food.amount
                    food_total_container.textContent = total

                })
            } else {
                food_total_container.textContent = 0;
            }

            if (filterExpensesByWorkWeek(data.weekly_adjustments).length > 0) {

                filterExpensesByWorkWeek(data.weekly_adjustments).forEach((income, id) => {
                    populateList(income_container, income, income.id, "deleteIncome", true)

                })
            }

            document.querySelector("#weekly_bill_amount").textContent = data.totals[0].weekly_bills_total;
            document.querySelector("#monthly_bill_display").textContent = data.totals[0].monthly_bills_total;
            document.querySelector("#total_weekly_bill_amount").textContent = data.totals[0].weekly_total;
            document.querySelector("#total_monthly_bill_display").textContent = data.totals[0].monthly_bills_total + data.totals[0].monthly_total_debt;
            document.querySelector("#total_debt").value = data.debt[0].total_debt;
            document.querySelector("#debt_weeks").value = data.debt[0].weeks_left;
            document.querySelector("#daily_income_needed").textContent = data.totals[0].per_day_total;
            document.querySelector("#total_remaining_debt").textContent = data.debt[0].total_debt_adjusted;
            document.querySelector("#carry_over_total").textContent = data.totals[0].carry_total;
            weekly_debt_amount_container.textContent = data.totals[0].weekly_total_debt;
            food_remaining_container.textContent = 70 - food_total_container.textContent

            function removeEntryById(currentArray, idToRemove) {
                // The filter method always returns a NEW array
                const updatedArray = currentArray.filter(entry => {
                    return entry.id !== idToRemove;
                });
                console.log(updatedArray)
                return updatedArray;
            }


            function deleteButtons(button, obj, mainObj, key) {
                id = button.parentElement.id
                mainObj[key] = removeEntryById(obj, parseInt(id))
                updateDebt();
                updateTotals();
                update_display();
            }

            delete_bills = document.querySelectorAll("#deleteBills")
            delete_bills.forEach(button => {
                button.addEventListener("click", () => {
                    deleteButtons(button, data.bills, data, "bills")
                }
                )
            })


            delete_debt = document.querySelectorAll("#deleteDebt")
            delete_debt.forEach(button => {
                button.addEventListener("click", () => {
                    deleteButtons(button, data.debt_expenses, data, "debt_expenses")
                }
                )
            })

            delete_food = document.querySelectorAll("#deleteFood")
            delete_food.forEach(button => {
                button.addEventListener("click", () => {
                    deleteButtons(button, data.food_expenses, data, "food_expenses")
                }
                )
            })

            delete_income = document.querySelectorAll("#deleteIncome")
            delete_income.forEach(button => {
                button.addEventListener("click", () => {
                    deleteButtons(button, data.weekly_adjustments, data, "weekly_adjustments")
                }
                )
            })

            delete_carry = document.querySelectorAll('#deleteCarry')
            delete_carry.forEach(button => {
                button.addEventListener("click", () => {
                    deleteButtons(button, data.carry_over, data, "carry_over")
                    console.log("je;l")
                }
                )
            })

        }

        update_debt_button.addEventListener("click", () => {
            updateDebt();
            updateTotals();
            update_display();
        })

        add_debt_button.addEventListener("click", () => {
            addEntry(data.debt_expenses, "debt")
            updateDebt();
            updateTotals();
            update_display();
        })

        function updateDebt() {
            data.debt[0].total_debt = parseInt(total_debt_container.value);
            data.debt[0].weeks_left = parseInt(weeks_left_container.value)
        }

        add_bill_button.addEventListener("click", () => {
            addEntry(data.bills, "bill")
            updateTotals();
            update_display();
        })



        add_expense_button.addEventListener("click", () => {
            addEntry(data.weekly_adjustments, "expense")
            updateTotals();
            update_display();
        })



        add_food_button.addEventListener("click", () => {
            addEntry(data.food_expenses, "food")
            updateTotals();
            update_display();
        })

        add_carry_over_button.addEventListener("click", () => {
            addEntry(data.carry_over, "carry")
            updateTotals();
            update_display();
        })

        update_week_button.addEventListener("click", () => {
            data.currentWeek = new Date(`${week_selector.value}T01:00:00`);
            updateDebt();
            updateTotals();
            update_display();
        })


        updateTotals();
        update_display();

    } else {
        console.log("Data has not loaded yet or failed to load.");
    }
}

function downloadJsonFile(object, filename) {
    // Convert the object to a formatted JSON string
    const jsonString = JSON.stringify(object, null, 2);

    // Create a Blob object
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create and click a temporary link to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'data_object.json'; // Set the filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the blob URL
    URL.revokeObjectURL(url);
}

save_button.addEventListener("click", () => {
    downloadJsonFile(data, "data.json")
})

// Start the loading process
loadAndAttachData();





