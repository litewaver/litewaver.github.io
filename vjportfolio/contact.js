
const contactForm = document.getElementById("contactForm");

const submitButton = document.getElementById("submitButton");

const formStatus = document.getElementById("formStatus");

contactForm.addEventListener("submit", async function (event) {

    // Stop the browser from refreshing the page.
    event.preventDefault();

    // Prevent accidental repeated submissions.
    submitButton.disabled = true;

    formStatus.textContent = "Sending your message...";

    // Collect information from the form.
    const contactData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    try {

        // Send the information to your C# backend.
        const response = await fetch(
            "http://localhost:5091/contact",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(contactData)
            }
        );

        // Convert the backend response into JavaScript data.
        const result = await response.json();

        // Check whether the backend accepted the request.
        if (!response.ok) {

            throw new Error(
                result.detail || "Unable to send your message."
            );

        }

        // Display success.
        formStatus.textContent = result.message;

        // Clear the form after successful submission.
        contactForm.reset();

    }
    catch (error) {

        console.error("Contact form error:", error);

        formStatus.textContent =
            error.message || "Something went wrong. Please try again.";

    }
    finally {

        // Allow the visitor to submit again.
        submitButton.disabled = false;

    }

});

