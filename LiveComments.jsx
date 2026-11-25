
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

function LiveComments() {
    const [comments, setComments] = useState([]);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const pageId = "blog";

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/commentHub")
            .withAutomaticReconnect()
            .build();

        async function startConnection() {
            try {
                await connection.start();

                // Join the blog comment group
                await connection.invoke("JoinPage", pageId);

                // Load existing comments
                const response = await fetch(
                    `http://localhost:5000/api/comments/${pageId}`
                );

                const data = await response.json();

                setComments(data.reverse());

            } catch (error) {
                console.error("Connection error:", error);
            }
        }

        // Listen for new comments
        connection.on("ReceiveComment", (comment) => {
            setComments((previous) => [
                ...previous,
                comment
            ]);
        });

        startConnection();

        return () => {
            connection.stop();
        };

    }, []);

    async function submitComment(e) {
        e.preventDefault();

        if (!name.trim() || !message.trim()) {
            return;
        }

        try {
            // Send comment to C# backend
            const connection = window.commentConnection;

            if (!connection) {
                console.error("Not connected yet.");
                return;
            }

            await connection.invoke(
                "AddComment",
                pageId,
                name,
                message
            );

            setMessage("");

        } catch (error) {
            console.error("Could not submit comment:", error);
        }
    }

    return (
        <section>
            <h2>Live Comments</h2>

            <form onSubmit={submitComment}>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                    required
                />

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a comment..."
                    maxLength={1000}
                    required
                />

                <button type="submit">
                    Post Comment
                </button>
            </form>

            <div>
                {comments.map((comment) => (
                    <article key={comment.id}>
                        <strong>{comment.name}</strong>

                        <p>{comment.message}</p>

                        <small>
                            {new Date(comment.createdAt)
                                .toLocaleString()}
                        </small>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default LiveComments;
