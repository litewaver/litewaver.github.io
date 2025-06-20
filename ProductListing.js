const product = {
    name: "charm",
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
