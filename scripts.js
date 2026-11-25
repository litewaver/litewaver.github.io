


    window.onload = function() {
      var magicButton = document.getElementById("purpleGif");

      var normalButton ="resumeButton"
      var purpleGif = "./assets/star-sticker-holographic.gif";

      magicButton.addEventListener("mouseover", function () {
        magicButton.src = purpleGif;
      });

      magicButton.addEventListener("mouseout", function () {
        magicButton.src = normalButton;
      });
    };

    
    //counter
      // Get the current count from localStorage
  let count = localStorage.getItem("visitCount");

  // If no count, start from 0
  if (count === null) {
    count = 1;
  } else {
    count = parseInt(count) + 1;
  }

  // Save the updated count
  localStorage.setItem("visitCount", count);

  // Show it on the page
  document.getElementById("visit-count").innerText = count;

    fetch("visit-counter.php")
    .then(res => res.text())
    .then(count => {
      document.getElementById("global-count").innerText = count;
    });

    
    //contact form

// 1. Find the contact form
const contactForm = document.getElementById("contactForm");

// 2. Find the status message
const statusMessage = document.getElementById("statusMessage");

// 3. Find the submit button
const submitButton = document.getElementById("submitButton");

// 4. Listen for form submissions
contactForm.addEventListener("submit", async function (event) {

    // Stop the browser from refreshing the page
    event.preventDefault();

    // 5. Collect the form information
    const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    // 6. Disable the button while sending
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    statusMessage.textContent = "Sending your message...";

    try {

        // 7. Send information to the C# backend
        const response = await fetch(
            "http://localhost:5091/contact",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)
            }
        );

        // 8. Read the backend response
        const result = await response.text();

        // 9. Check whether the request succeeded
        if (!response.ok) {
            throw new Error(result || "Unable to send message.");
        }

        // 10. Display success
        statusMessage.textContent =
            "Your message was sent successfully!";

        statusMessage.style.color = "green";

        // Clear the form
        contactForm.reset();

    } catch (error) {

        // Display an error if something goes wrong
        console.error("Contact form error:", error);

        statusMessage.textContent =
            error.message || "Something went wrong. Please try again.";

        statusMessage.style.color = "red";

    } finally {

        // Re-enable the button
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";

    }

});


function toggleLiteMode() {

    // Get the body element
    const body = document.body;

    // Get the button icon
    const icon = document.getElementById("modeIcon");

    // Toggle light mode
    body.classList.toggle("light-mode");

    // Check if light mode is active
    const isLightMode = body.classList.contains("light-mode");

    // Change icon
    if (isLightMode) {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
    } else {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    }
}

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const menuIcon = menuToggle.querySelector("i");

// Toggle mobile menu
menuToggle.addEventListener("click", () => {

    const isOpening = mobileMenu.classList.contains("hidden");

    mobileMenu.classList.toggle("hidden");

    menuIcon.classList.toggle("fa-bars", !isOpening);
    menuIcon.classList.toggle("fa-xmark", isOpening);

    menuToggle.setAttribute("aria-expanded", isOpening);
    menuToggle.setAttribute(
        "aria-label",
        isOpening ? "Close navigation" : "Open navigation"
    );
});

// Close menu after clicking a link
mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");

        menuIcon.classList.replace("fa-xmark", "fa-bars");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
    });
});

// Close menu when resizing to desktop
window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
        mobileMenu.classList.add("hidden");
        menuIcon.classList.replace("fa-xmark", "fa-bars");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
    }
});
