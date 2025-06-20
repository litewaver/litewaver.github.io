const product = {
    name: "trinket",
    price: "$6",
    description: "an exmaple of my physical works",
    image: "assets/product1Image.jpg",
    inStock: true,
};

const container = document.getElementById("product-container");

const productBox = document.createElement("div");
productBox.className = "product";

// Create and add image
const productImage = document.createElement("img");
productImage.src = product.image;
productImage.alt = product.name;
productBox.appendChild(productImage);

// Add more product info if needed
const productName = document.createElement("h3");
productName.textContent = product.name;
productBox.appendChild(productName);

const productPrice = document.createElement("p");
productPrice.textContent = product.price;
productBox.appendChild(productPrice);

const productDescription = document.createElement("p");
productDescription.textContent = product.description;
productBox.appendChild(productDescription);

// Append to main container
container.appendChild(productBox);


function updateClock() {
    const now = new Date();
  
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
  
    // Add leading zero if needed
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
  
    const timeString = `${hours}:${minutes}:${seconds}`;
  
    document.getElementById("clock").textContent = timeString;
  }
  
  // Update clock every second
  setInterval(updateClock, 1000);
  
  // Show clock immediately on page load
  updateClock();
  