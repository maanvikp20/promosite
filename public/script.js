let allProducts = [];
let currentPage = 1;
const productsPerPage = 20;

async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");
    const data = await response.json();

    allProducts = data.products;
    renderPage(currentPage);
    updateProductCount(
      Math.min(productsPerPage, allProducts.length),
      data.totalProducts
    );
    renderPagination();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Render a single page of products
function renderPage(page) {
  const productsGrid = document.getElementById("products-grid");
  productsGrid.innerHTML = ""; // clear previous

  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const productsToShow = allProducts.slice(start, end);

  productsToShow.forEach((product) => {
    const productElement = document.createElement("div");
    productElement.className = "product";

    productElement.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <span>${product.name}</span>
    `;

    productsGrid.appendChild(productElement);
  });

  updateProductCount(
    Math.min(page * productsPerPage, allProducts.length),
    allProducts.length
  );
}

// Pagination buttons
function renderPagination() {
  const totalPages = Math.ceil(allProducts.length / productsPerPage);
  let pagination = document.getElementById("pagination");

  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "pagination";
    document.querySelector(".products-section").appendChild(pagination);
  }

  pagination.innerHTML = "";

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
      renderPagination();
    }
  });
  pagination.appendChild(prevBtn);

  // Numbered page buttons
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = i === currentPage ? "active" : "";

    button.addEventListener("click", () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
    });

    pagination.appendChild(button);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
      renderPagination();
    }
  });
  pagination.appendChild(nextBtn);
}

// Update product count display
function updateProductCount(showing, total) {
  document.getElementById("showing-count").textContent = showing;
  document.getElementById("total-count").textContent = total;
}

// Load products when page loads
document.addEventListener("DOMContentLoaded", loadProducts);

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".contact-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Basic form validation
    const requiredFields = form.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = "#e74c3c";
        isValid = false;
      } else {
        field.style.borderColor = "#ddd";
      }
    });

    if (isValid) {
      alert("Form submitted successfully!");
      // Here you would normally send the form data to your server
    } else {
      alert("Please fill in all required fields.");
    }
  });

  // Reset border color on input
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.style.borderColor = "#ddd";
    });
  });
});