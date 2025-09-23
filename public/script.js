async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");
    const data = await response.json();

    renderProducts(data.products);
    updateProductCount(data.products.length, data.totalProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    // Fallback: show error message or use inline data
  }
}

// Render products to the DOM
function renderProducts(products) {
  const productsGrid = document.getElementById("products-grid");

  products.forEach((product) => {
    const productElement = document.createElement("div");
    productElement.className = "product";

    productElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <span>${product.name}</span>
                `;

    productsGrid.appendChild(productElement);
  });
}

// Update product count display
function updateProductCount(showing, total) {
  document.getElementById("showing-count").textContent = showing;
  document.getElementById("total-count").textContent = total;
}

// Load products when page loads
document.addEventListener("DOMContentLoaded", loadProducts);