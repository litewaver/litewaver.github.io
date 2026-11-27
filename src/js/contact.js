
const contactForm = document.getElementById("contactForm");

if (contactForm) {
    const submitButton = document.getElementById("contactSubmit");
    const statusMessage = document.getElementById("contactStatus");

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        statusMessage.textContent = "Sending your message...";
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            subject: document.getElementById("subject").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        try {
            const response = await fetch(
                "https://litewaver.runasp.net/contact",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.detail || "Unable to send your message.");
            }

            statusMessage.textContent = "Message sent successfully! Thank you.";
            contactForm.reset();

        } catch (error) {
            console.error("Contact form error:", error);
            statusMessage.textContent =
                error.message || "Something went wrong. Please try again.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send Message";
        }
    });
}

