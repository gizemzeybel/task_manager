const API = "http://localhost:5000/api";

let token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user") || "null");
let currentFilter = "all";

const authCard = document.getElementById("authCard");
const appCard = document.getElementById("appCard");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const authTitle = document.getElementById("authTitle");
const authBtn = document.getElementById("authBtn");
const authMsg = document.getElementById("authMsg");

const nameField = document.getElementById("nameField");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

const authForm = document.getElementById("authForm");

const welcome = document.getElementById("welcome");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const taskTitle = document.getElementById("taskTitle");
const taskDesc = document.getElementById("taskDesc");
const taskDate = document.getElementById("taskDate");
const taskStatus = document.getElementById("taskStatus");
const addTaskBtn = document.getElementById("addTaskBtn");

const taskList = document.getElementById("taskList");
const taskMsg = document.getElementById("taskMsg");

const filters = document.querySelectorAll(".filter");

let mode = "login";

function setMode(newMode) {
  mode = newMode;
  authMsg.textContent = "";
  if (mode === "login") {
    authTitle.textContent = "Login";
    authBtn.textContent = "Login";
    nameField.style.display = "none";
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
  } else {
    authTitle.textContent = "Register";
    authBtn.textContent = "Create Account";
    nameField.style.display = "block";
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
  }
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    if (mode === "register") {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          password: passInput.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      authMsg.textContent = "Account created! Now login 💜";
      setMode("login");
      return;
    }

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value,
        password: passInput.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    token = data.token;
    user = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    showApp();
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  token = null;
  user = null;
  showAuth();
});

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.status;
    loadTasks();
  });
});

addTaskBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: taskTitle.value,
        description: taskDesc.value,
        status: taskStatus.value,
        due_date: taskDate.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    taskTitle.value = "";
    taskDesc.value = "";
    taskDate.value = "";
    taskStatus.value = "todo";
    loadTasks();
  } catch (err) {
    taskMsg.textContent = err.message;
  }
});

async function loadTasks() {
  taskList.innerHTML = "";
  const res = await fetch(`${API}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tasks = await res.json();

  const filtered =
    currentFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === currentFilter);

  filtered.forEach((t) => {
    const div = document.createElement("div");
    div.className = "task-item";

    const due = t.due_date ? `📅 ${t.due_date}` : "";

    div.innerHTML = `
      <div class="task-left">
        <h3>${t.title}</h3>
        <p>${t.description || ""}</p>
        <p class="small">${due}</p>
      </div>
      <div class="actions">
        <span class="badge">${t.status}</span>
        <button class="btn ghost" data-id="${t.id}" data-action="done">Done</button>
        <button class="btn ghost" data-id="${t.id}" data-action="delete">Delete</button>
      </div>
    `;
    taskList.appendChild(div);
  });

  document
    .querySelectorAll("button[data-action='delete']")
    .forEach((btn) =>
      btn.addEventListener("click", () => deleteTask(btn.dataset.id))
    );

  document
    .querySelectorAll("button[data-action='done']")
    .forEach((btn) =>
      btn.addEventListener("click", () => markDone(btn.dataset.id))
    );
}

async function deleteTask(id) {
  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  loadTasks();
}

async function markDone(id) {
  const tasks = await (
    await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json();

  const task = tasks.find((x) => x.id == id);

  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: task.title,
      description: task.description,
      status: "done",
      due_date: task.due_date,
    }),
  });

  loadTasks();
}

function showApp() {
  authCard.classList.add("hidden");
  appCard.classList.remove("hidden");
  welcome.textContent = `Welcome, ${user.name} 💜`;
  userEmail.textContent = user.email;
  loadTasks();
}

function showAuth() {
  appCard.classList.add("hidden");
  authCard.classList.remove("hidden");
  setMode("login");
}

if (token && user) showApp();
else showAuth();
