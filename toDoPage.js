const ws = new WebSocket('wss://chatgroup-backend.onrender.com/');

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'newTask') {
        addTaskToList(message.task._id, message.task.toDoList, message.task.dueDate);
    }
};

let completedCount = 0;

const updateCompletedCountDisplay = () => {
    const countDisplay = document.getElementsByClassName('completed')[0];
    if (countDisplay) {
        countDisplay.innerText = `Completed Tasks: ${completedCount}`;
    }
};

const input = document.getElementsByClassName("textInput");

const fetchTasks = () => {
    fetch('https://chatgroup-backend.onrender.com/data')
        .then(response => response.json())
        .then(data => {
            const completedTasks = data.filter(task => task.completed);
            const uncompletedTasks = data.filter(task => !task.completed);
            completedCount = completedTasks.length;
            updateCompletedCountDisplay();
            uncompletedTasks.forEach(task => {
                addTaskToList(task._id, task.toDoList, task.dueDate); 
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
};

const addTaskToList = (taskId, taskText, taskDate) => {
    const listContainer = document.getElementsByClassName("ul-List-element")[0];
    const row = document.createElement("div");
    row.className = "row";
    row.setAttribute("data-task-id", taskId); 

    const newList1 = document.createElement("p");
    const newList2 = document.createElement("p");
    const newList3 = document.createElement("p");
    newList1.className = "list-element1";
    newList2.className = "list-element2";
    newList3.className = "list-element3";

    newList1.innerText = taskText;
    newList2.innerText = taskDate;
    newList3.innerText = "Task Status"; // Consider changing this to a more meaningful string

    const span = document.createElement("span");
    span.className = "circle";

    row.append(newList1, newList2, newList3, span);
    listContainer.appendChild(row);
    
    const clickSound = document.getElementById('clickSound');

    span.addEventListener("click", () => {
        if (clickSound) {
            clickSound.currentTime = 0; 
            clickSound.play();
        }
        
        if (!taskId) {
            console.error('Task ID is missing. Cannot delete the task.');
            return; 
        }

        listContainer.removeChild(row);
        
        fetch(`https://chatgroup-backend.onrender.com/data/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: true })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update task in the database');
            return response.json();
        })
        .then(data => {
            completedCount++;
            updateCompletedCountDisplay();
            console.log('Task updated:', data.message);
        })
        .catch(error => console.error('Error updating task:', error));
    });
};

const addList = () => {
    const dateElement = document.getElementsByClassName("date-element")[0];
    const dateValue = dateElement ? dateElement.value : '';
    const inputText = input[0] ? input[0].value.trim() : '';

    if (!inputText && !dateValue) {
        alert("Please enter a task and select a date.");
        return;
    } else if (!inputText) {
        alert("Please enter a task.");
        return;
    } else if (!dateValue) {
        alert("Please select a date.");
        return;
    }

    addTaskToList(null, inputText, dateValue); 

    if (input[0]) input[0].value = ""; 
    if (dateElement) dateElement.value = "";

    fetch('https://chatgroup-backend.onrender.com/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toDoList: inputText, dueDate: dateValue }),
    })
    .then(response => response.json())
    .then(data => {
        const listContainer = document.getElementsByClassName("ul-List-element")[0];
        const newRow = listContainer.lastChild; 
        newRow.setAttribute("data-task-id", data._id); 
    })
    .catch(error => console.error('Error adding task:', error));
};

// Fetch tasks on page load
document.addEventListener('DOMContentLoaded', fetchTasks);
document.getElementById('addTaskButton').addEventListener('click', addList);
