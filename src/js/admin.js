
const API_URL = "http://localhost:5081";

const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");

// Handle administrator login
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Signing in...";

    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            loginMessage.textContent =
                response.status === 401
                    ? "Invalid username or password."
                    : `Login failed. Server returned ${response.status}.`;
            return;
        }

        document.getElementById("password").value = "";
        loginMessage.textContent = "";

        await checkAdminSession();

    } catch (error) {
        loginMessage.textContent = "Could not connect to the API.";
        console.error("Login error:", error);
    }
});

// Verify administrator session
async function checkAdminSession() {
    try {
        const response = await fetch(`${API_URL}/api/admin/me`, {
            credentials: "include"
        });

        if (!response.ok) {
            console.log("No active administrator session.");
            return;
        }

        const admin = await response.json();

        if (admin.isAdmin) {
            loginSection.classList.add("hidden");
            dashboardSection.classList.remove("hidden");
            logoutButton.classList.remove("hidden");

            document.getElementById("adminName").textContent =
                admin.username;

            await loadComments();
        }

    } catch (error) {
        console.error("Session check failed:", error);
    }
}

// Load existing portfolio comments
async function loadComments() {
    const feed = document.getElementById("adminCommentFeed");
    const count = document.getElementById("commentCount");

    feed.textContent = "Loading comments...";

    try {
        const response = await fetch(`${API_URL}/api/comments`, {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const comments = await response.json();

        feed.replaceChildren();
        count.textContent = comments.length;

        if (comments.length === 0) {
            feed.textContent = "No comments yet.";
            return;
        }

        comments.forEach(comment => {
            const card = document.createElement("article");
            card.className =
                "bg-gray-900/70 p-4 rounded-xl border border-gray-700 mb-4";

            const name = document.createElement("h3");
            name.className = "font-bold text-emerald-300";
            name.textContent = comment.name;

            const message = document.createElement("p");
            message.className = "text-gray-300 mt-2";
            message.textContent = comment.message;

            const date = document.createElement("p");
            date.className = "text-gray-500 text-xs mt-3";
            date.textContent = new Date(comment.createdAt).toLocaleString();

            card.append(name, message, date);
            feed.appendChild(card);
        });

    } catch (error) {
        feed.textContent = "Unable to load comments.";
        console.error("Comment loading error:", error);
    }
}

// Check whether a session already exists when page opens
checkAdminSession();

// Logout is intentionally not wired yet.
// We will add a real server-side logout endpoint before enabling it.
logoutButton.addEventListener("click", () => {
    alert("Secure logout will be implemented next.");
});
