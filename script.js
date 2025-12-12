// ================= LOGIN ===================
function login() {
    let user = document.getElementById("loginUser").value;
    let pass = document.getElementById("loginPass").value;

    fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: user, password: pass})
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            window.location.href = "/dashboard";
        } else {
            document.getElementById("msg").innerText = data.error;
        }
    });
}

// ================= SIGNUP ===================
function signup() {
    let user = document.getElementById("signupUser").value;
    let pass = document.getElementById("signupPass").value;

    fetch("/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: user, password: pass})
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Signup successful") {
            window.location.href = "/login";
        } else {
            document.getElementById("msg").innerText = data.error;
        }
    });
}

// ================= LOAD TASKS ===================
function loadTasks() {
    fetch("/tasks", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => {
        let list = document.getElementById("taskList");
        list.innerHTML = "";

        data.forEach(task => {
            let li = document.createElement("li");
            li.innerHTML = `
                ${task.text}
                <span>
                    <button class="edit-btn" onclick="openEditModal(${task.id}, '${task.text}')">Edit</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                </span>
            `;
            list.appendChild(li);
        });
    });
}

// ================= ADD TASK ===================
function addTask() {
    let text = document.getElementById("taskInput").value;

    fetch("/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({text: text})
    })
    .then(res => res.json())
    .then(data => {
        loadTasks();
        document.getElementById("taskInput").value = "";
    });
}

// ================= DELETE TASK ===================
function deleteTask(id) {
    fetch("/tasks/" + id, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
    .then(() => loadTasks());
}

// ================= EDIT TASK (NEW) ===================
let currentTaskId = null;

// Open modal
function openEditModal(id, currentText) {
    currentTaskId = id;
    document.getElementById("editTaskInput").value = currentText;
    document.getElementById("editModal").style.display = "block";
}

// Close modal
function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

// Update request
function updateTask() {
    let newText = document.getElementById("editTaskInput").value;

    fetch("/tasks/" + currentTaskId, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({text: newText})
    })
    .then(res => res.json())
    .then(data => {
        closeEditModal();
        loadTasks();
    });
}

// ================= LOGOUT ===================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}
