
import * as signalR from "@microsoft/signalr";

const API_URL = "http://localhost:5081";

const commentForm = document.getElementById("commentForm");
const commentFeed = document.getElementById("commentFeed");
const nameInput = document.getElementById("commentName");
const messageInput = document.getElementById("commentMessage");

const displayedCommentIds = new Set();

if (!commentForm || !commentFeed || !nameInput || !messageInput) {
    console.error("Comment form elements could not be found.");
} else {

    // Connect to the C# SignalR hub.
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/comments`)
        .withAutomaticReconnect()
        .build();

    // Display a comment safely.
    function displayComment(comment) {
        if (!comment || !comment.id ||
            displayedCommentIds.has(comment.id)) {
            return;
        }

        displayedCommentIds.add(comment.id);

        const card = document.createElement("article");

        card.className =
            "bg-gray-900/80 border border-emerald-500/20 rounded-xl p-4 mb-4";

        const name = document.createElement("h3");
        name.className = "text-emerald-400 font-bold";
        name.textContent = comment.name || "Anonymous";

        const message = document.createElement("p");
        message.className = "text-white mt-2 whitespace-pre-wrap";
        message.textContent = comment.message;

        const date = document.createElement("small");
        date.className = "text-gray-400 block mt-2";

        const parsedDate = new Date(comment.createdAt);

        date.textContent = Number.isNaN(parsedDate.getTime())
            ? "Date unavailable"
            : parsedDate.toLocaleString();

        card.append(name, message, date);
        commentFeed.appendChild(card);
    }

    // Receive comments from SignalR.
    connection.on("ReceiveComment", (comment) => {
        console.log("New comment received:", comment);
        displayComment(comment);
    });

    // Load comments already saved in the database.
    async function loadPreviousComments() {
        try {
            const response = await fetch(`${API_URL}/api/comments`);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const comments = await response.json();

            comments.sort(
                (a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
            );

            comments.forEach(displayComment);

        } catch (error) {
            console.error("Error loading comments:", error);
        }
    }

    // Start SignalR.
    async function startConnection() {
        try {
            await connection.start();

            console.log("SignalR connected successfully!");

            await loadPreviousComments();

        } catch (error) {
            console.error("SignalR connection failed:", error);

            // Try again after a short delay.
            setTimeout(startConnection, 5000);
        }
    }

    // Refresh saved comments after reconnecting.
    connection.onreconnected(async () => {
        console.log("SignalR reconnected!");

        displayedCommentIds.clear();
        commentFeed.innerHTML = "";

        await loadPreviousComments();
    });

    // Submit a comment.
    commentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const message = messageInput.value.trim();

        if (name.length > 50) {
            alert("Name cannot exceed 50 characters.");
            return;
        }

        if (message.length < 10 || message.length > 1000) {
            alert("Message must contain between 10 and 1000 characters.");
            return;
        }

        const button = commentForm.querySelector(
            'button[type="submit"]'
        );

        if (button) {
            button.disabled = true;
            button.textContent = "Posting...";
        }

        try {
            const response = await fetch(`${API_URL}/api/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name || "Anonymous",
                    message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                throw new Error(
                    errorData?.error || `Request failed: ${response.status}`
                );
            }

            // Clear the form after successful submission.
            commentForm.reset();

            console.log("Comment submitted successfully!");

        } catch (error) {
            console.error("Submission error:", error);
            alert(error.message || "Unable to submit your comment.");

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Post Comment";
            }
        }
    });

    // Initialize the comment system.
    startConnection();
}
