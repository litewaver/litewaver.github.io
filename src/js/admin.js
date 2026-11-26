
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
            await loadReports();
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

// Load visitor-submitted reports
async function loadReports() {
    const feed = document.getElementById("adminReportFeed");
    const count = document.getElementById("pendingReportCount");

    feed.textContent = "Loading reports...";

    try {
        const response = await fetch(`${API_URL}/api/admin/reports`, {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const reports = await response.json();

        feed.replaceChildren();

        const pendingReports = reports.filter(
            report => report.status === "Pending"
        );

        count.textContent = `${pendingReports.length} pending`;

        if (reports.length === 0) {
            feed.textContent = "No reports have been submitted.";
            return;
        }

        reports.forEach(report => {
            const card = document.createElement("article");

            card.className =
                "bg-gray-900/70 p-5 rounded-xl border border-gray-700 mb-4";

            const heading = document.createElement("h3");
            heading.className = "font-bold text-emerald-300";
            heading.textContent = `Report: ${report.reason}`;

            const status = document.createElement("p");
            status.className = "text-sm mt-2 text-gray-400";
            status.textContent = `Status: ${report.status}`;

            const visitorName = document.createElement("p");
            visitorName.className = "text-gray-300 mt-3";
            visitorName.textContent =
                `Comment by: ${report.comment?.name ?? "Unknown visitor"}`;

            const message = document.createElement("p");
            message.className =
                "text-gray-300 mt-2 whitespace-pre-wrap break-words";
            message.textContent =
                report.comment?.message ?? "Comment unavailable.";

            const details = document.createElement("p");
            details.className = "text-gray-400 text-sm mt-3";
            details.textContent =
                report.details || "No additional details provided.";

            const date = document.createElement("p");
            date.className = "text-gray-500 text-xs mt-3";
            date.textContent =
                `Reported: ${new Date(report.createdAt).toLocaleString()}`;

            card.append(
                heading,
                status,
                visitorName,
                message,
                details,
                date
            );

            if (report.status === "Pending") {
                const buttons = document.createElement("div");
                buttons.className = "flex flex-wrap gap-3 mt-4";

                const hideButton = document.createElement("button");
                hideButton.textContent = "Hide Comment";
                hideButton.className =
                    "bg-red-500/20 text-red-300 px-4 py-2 rounded-lg";

                hideButton.addEventListener("click", () => {
                    reviewReport(report.id, "hide");
                });

                const dismissButton = document.createElement("button");
                dismissButton.textContent = "Dismiss Report";
                dismissButton.className =
                    "bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-lg";

                dismissButton.addEventListener("click", () => {
                    reviewReport(report.id, "dismiss");
                });

                buttons.append(hideButton, dismissButton);
                card.appendChild(buttons);
            }

            feed.appendChild(card);
        });

    } catch (error) {
        feed.textContent = "Unable to load reports.";
        console.error("Report loading error:", error);
    }
}

// Hide a reported comment or dismiss its report
async function reviewReport(reportId, action) {
    const actionText = action === "hide"
        ? "hide this comment"
        : "dismiss this report";

    if (!confirm(`Are you sure you want to ${actionText}?`)) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/admin/reports/${reportId}/${action}`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            alert(result.error || `Action failed (${response.status}).`);
            return;
        }

        alert(result.message || "Report reviewed successfully.");

        await loadReports();

        if (action === "hide") {
            await loadComments();
        }

    } catch (error) {
        console.error("Report moderation error:", error);
        alert("Could not connect to the API.");
    }
}

// Check whether a session already exists when page opens
checkAdminSession();

// Logout is intentionally not wired yet.
// We will add a real server-side logout endpoint before enabling it.
logoutButton.addEventListener("click", () => {
    alert("Secure logout will be implemented next.");
});
