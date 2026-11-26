
import * as signalR from "@microsoft/signalr";

const API_URL = "http://localhost:5081";

const commentForm = document.getElementById("commentForm");
const commentFeed = document.getElementById("commentFeed");
const nameInput = document.getElementById("commentName");
const messageInput = document.getElementById("commentMessage");

const emojis = ["❤️", "👍", "🔥", "😂", "👏", "💡"];

const commentElements = new Map();

if (!commentForm || !commentFeed || !nameInput || !messageInput) {
    console.error("Comment form elements could not be found.");
} else {
    // Include credentials so the API can recognize anonymous visitors.
    async function apiFetch(path, options = {}) {
        return fetch(`${API_URL}${path}`, {
            ...options,
            credentials: "include",
            headers: {
                ...(options.headers || {})
            }
        });
    }

    // Create the anonymous visitor identity cookie.
    async function initializeVisitor() {
        const response = await apiFetch("/api/visitor/identity");

        if (!response.ok) {
            throw new Error("Could not initialize visitor identity.");
        }

        console.log("Anonymous visitor identity ready.");
    }

    // SignalR connection.
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/comments`, {
            withCredentials: true
        })
        .withAutomaticReconnect()
        .build();

    // Safely create a text element.
    function createTextElement(tag, className, value) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = value || "";
        return element;
    }

    function getReactionCounts(reactions = []) {
        const counts = {};

        reactions.forEach(reaction => {
            counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
        });

        return counts;
    }

    // Create reaction buttons.
    function createReactionButtons(comment) {
        const container = document.createElement("div");
        container.className = "flex flex-wrap gap-2 mt-3";

        const counts = getReactionCounts(comment.reactions || []);

        emojis.forEach(emoji => {
            const button = document.createElement("button");
            button.type = "button";
            button.className =
                "px-3 py-1 rounded-full bg-gray-800 hover:bg-emerald-900 border border-emerald-500/20 text-white text-sm transition";

            button.textContent = `${emoji} ${counts[emoji] || 0}`;
            button.setAttribute("aria-label", `React with ${emoji}`);

            button.addEventListener("click", async () => {
                button.disabled = true;

                try {
                    const response = await apiFetch(
                        `/api/comments/${comment.id}/reactions`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ emoji })
                        }
                    );

                    if (!response.ok) {
                        throw new Error("Could not submit reaction.");
                    }

                    await loadPreviousComments();
                } catch (error) {
                    console.error("Reaction error:", error);
                    alert(error.message);
                } finally {
                    button.disabled = false;
                }
            });

            container.appendChild(button);
        });

        return container;
    }

    // Create a reply form for a comment.
    function createReplyForm(comment) {
        const wrapper = document.createElement("div");
        wrapper.className = "mt-4 hidden";

        const form = document.createElement("form");
        form.className = "space-y-2";

        const name = document.createElement("input");
        name.type = "text";
        name.maxLength = 50;
        name.placeholder = "Your name (optional)";
        name.className =
            "w-full p-2 rounded-lg bg-gray-800 text-white border border-emerald-500/20";

        const message = document.createElement("textarea");
        message.required = true;
        message.minLength = 2;
        message.maxLength = 1000;
        message.rows = 3;
        message.placeholder = "Write a reply...";
        message.className =
            "w-full p-2 rounded-lg bg-gray-800 text-white border border-emerald-500/20";

        const submit = document.createElement("button");
        submit.type = "submit";
        submit.textContent = "Post Reply";
        submit.className =
            "px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white";

        form.append(name, message, submit);
        wrapper.appendChild(form);

        form.addEventListener("submit", async event => {
            event.preventDefault();

            const replyMessage = message.value.trim();

            if (replyMessage.length < 2 || replyMessage.length > 1000) {
                alert("Reply must contain between 2 and 1000 characters.");
                return;
            }

            submit.disabled = true;
            submit.textContent = "Posting...";

            try {
                const response = await apiFetch(
                    `/api/comments/${comment.id}/replies`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: name.value.trim() || "Anonymous",
                            message: replyMessage
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error("Could not submit reply.");
                }

                form.reset();
                wrapper.classList.add("hidden");
                await loadPreviousComments();
            } catch (error) {
                console.error("Reply error:", error);
                alert(error.message);
            } finally {
                submit.disabled = false;
                submit.textContent = "Post Reply";
            }
        });

        return wrapper;
    }

// Create a report button and form for a comment or reply.
function createReportControls(comment) {
    const wrapper = document.createElement("div");
    wrapper.className = "mt-3";

    const reportButton = document.createElement("button");
    reportButton.type = "button";
    reportButton.textContent = "Report";
    reportButton.className =
        "text-red-400 hover:text-red-300 text-sm";

    const form = document.createElement("form");
    form.className = "hidden mt-3 space-y-2";

    const reason = document.createElement("select");
    reason.required = true;
    reason.className =
        "w-full p-2 rounded-lg bg-gray-800 text-white border border-red-500/20";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a reason";
    placeholder.disabled = true;
    placeholder.selected = true;
    reason.appendChild(placeholder);

    ["Spam", "Harassment", "Hate speech", "Inappropriate content", "Other"]
        .forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            reason.appendChild(option);
        });

    const details = document.createElement("textarea");
    details.maxLength = 500;
    details.rows = 2;
    details.placeholder = "Additional details (optional)";
    details.className =
        "w-full p-2 rounded-lg bg-gray-800 text-white border border-red-500/20";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Submit Report";
    submit.className =
        "px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.className = "px-4 py-2 text-gray-400";

    form.append(reason, details, submit, cancel);
    wrapper.append(reportButton, form);

    reportButton.addEventListener("click", () => {
        form.classList.toggle("hidden");
    });

    cancel.addEventListener("click", () => {
        form.reset();
        form.classList.add("hidden");
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!reason.value) {
            alert("Please choose a report reason.");
            return;
        }

        submit.disabled = true;
        submit.textContent = "Submitting...";

        try {
            const response = await apiFetch(
                `/api/comments/${comment.id}/reports`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        reason: reason.value,
                        details: details.value.trim() || null
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 409) {
                    alert("You have already reported this comment.");
                } else {
                    alert(result.error || `Report failed (${response.status}).`);
                }
                return;
            }

            form.classList.add("hidden");
            reportButton.textContent = "Report submitted";
            reportButton.disabled = true;

            alert("Thank you. Your report has been submitted.");

        } catch (error) {
            console.error("Report submission error:", error);
            alert("Could not connect to the reporting service.");
        } finally {
            submit.disabled = false;
            submit.textContent = "Submit Report";
        }
    });

    return wrapper;
}

    // Render one comment, including its replies.
    function displayComment(comment, parentContainer = commentFeed, isReply = false) {
        if (!comment || !comment.id || commentElements.has(comment.id)) {
            return;
        }

        const card = document.createElement("article");

        card.className = isReply
            ? "bg-gray-800/70 border border-emerald-500/10 rounded-xl p-3 mt-3 ml-4"
            : "bg-gray-900/80 border border-emerald-500/20 rounded-xl p-4 mb-4";

        commentElements.set(comment.id, card);

        const name = createTextElement(
            "h3",
            "text-emerald-400 font-bold",
            comment.name || "Anonymous"
        );

        const message = createTextElement(
            "p",
            "text-white mt-2 whitespace-pre-wrap break-words",
            comment.message
        );

        const dateValue = new Date(comment.createdAt);
        const date = createTextElement(
            "small",
            "text-gray-400 block mt-2",
            Number.isNaN(dateValue.getTime())
                ? "Date unavailable"
                : dateValue.toLocaleString()
        );

        card.append(name, message, date);

        card.appendChild(createReactionButtons(comment));

        const replyToggle = document.createElement("button");
        replyToggle.type = "button";
        replyToggle.textContent = "Reply";
        replyToggle.className =
            "text-emerald-400 hover:text-emerald-300 text-sm mt-3 mr-3";

        const replyForm = createReplyForm(comment);

        replyToggle.addEventListener("click", () => {
            replyForm.classList.toggle("hidden");
        });

const reportControls = createReportControls(comment);

card.append(replyToggle, replyForm, reportControls);

parentContainer.appendChild(card);

        // Render nested replies.
        if (Array.isArray(comment.replies)) {
            comment.replies.forEach(reply => {
                displayComment(reply, card, true);
            });
        }
    }

    // Load all comments from the API.
    async function loadPreviousComments() {
        try {
            const response = await apiFetch("/api/comments");

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const comments = await response.json();

            commentElements.clear();
            commentFeed.innerHTML = "";

            comments.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            comments.forEach(comment => displayComment(comment));
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    }

    // Listen for new comments from other visitors.
    connection.on("ReceiveComment", async comment => {
        console.log("New comment received:", comment);
        await loadPreviousComments();
    });

    // Refresh reaction counts when another visitor reacts.
    connection.on("ReceiveReaction", async () => {
        await loadPreviousComments();
    });

    connection.onreconnected(async () => {
        console.log("SignalR reconnected!");
        await loadPreviousComments();
    });

    // Submit a new top-level comment.
    commentForm.addEventListener("submit", async event => {
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

        const button = commentForm.querySelector('button[type="submit"]');

        if (button) {
            button.disabled = true;
            button.textContent = "Posting...";
        }

        try {
            const response = await apiFetch("/api/comments", {
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
                throw new Error(`Request failed: ${response.status}`);
            }

            commentForm.reset();
            await loadPreviousComments();

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

    // Start the complete comment system.
    async function startCommentSystem() {
        try {
            await initializeVisitor();
            await connection.start();

            console.log("SignalR connected successfully!");

            await loadPreviousComments();
        } catch (error) {
            console.error("Comment system startup error:", error);

            setTimeout(startCommentSystem, 5000);
        }
    }

    startCommentSystem();
}
