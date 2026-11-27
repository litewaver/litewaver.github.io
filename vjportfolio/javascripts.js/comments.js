
import * as signalR from "@microsoft/signalr";

// Change this to the HTTP address shown by dotnet run
// Production ASP.NET Core API
const API_URL = "https://litewaver.runasp.net";

const commentForm = document.getElementById("commentForm");
const commentFeed = document.getElementById("commentFeed");

// Create a SignalR connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/comments`)
    .withAutomaticReconnect()
    .build();

// Display a comment safely
function displayComment(comment) {

    const card = document.createElement("div");

    card.className =
        "bg-gray-900 border border-gray-700 rounded-xl p-4";

    const name = document.createElement("h3");
    name.className = "text-emerald-400 font-bold";
    name.textContent = comment.name;

    const message = document.createElement("p");
    message.className = "text-gray-200 mt-2";
    message.textContent = comment.message;

    const date = document.createElement("small");
    date.className = "text-gray-500 block mt-3";

    date.textContent = new Date(
        comment.createdAt
    ).toLocaleString();

    card.append(name, message, date);

    // Add newest comment to the top
    commentFeed.prepend(card);
}

// Listen for new comments from SignalR
connection.on("ReceiveComment", (comment) => {
    displayComment(comment);
});

// Load previous comments
async function loadComments() {

    const response = await fetch(`${API_URL}/api/comments`);

    if (!response.ok) {
        throw new Error("Unable to load comments.");
    }

    const comments = await response.json();

    commentFeed.replaceChildren();

    comments.forEach(displayComment);
}

// Submit a comment to C#
commentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("commentName").value;
    const message = document.getElementById("commentMessage").value;

    try {

        const response = await fetch(`${API_URL}/api/comments`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                message: message
            })
        });

        if (!response.ok) {
            throw new Error("Could not submit comment.");
        }

        // SignalR broadcasts the comment automatically
        commentForm.reset();

    } catch (error) {

        console.error(error);
        alert("Unable to submit your comment.");

    }
});

// Start the real-time connection
async function startComments() {

    try {

        await connection.start();

        console.log("Connected to live comment feed!");

        await loadComments();

    } catch (error) {

        console.error("SignalR connection failed:", error);

    }

}

startComments();
