// =====================
// Product Pagination
// =====================
let allProducts = [];
let currentPage = 1;
const productsPerPage = 20;

async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    allProducts = data.products || [];
    
    if (allProducts.length === 0) {
      showNoProductsMessage();
      return;
    }
    
    renderPage(currentPage);
    updateProductCount(
      Math.min(productsPerPage, allProducts.length),
      data.totalProducts || allProducts.length
    );
    renderPagination();
  } catch (error) {
    console.error("Error loading products:", error);
    showProductLoadError();
  }
}

function showNoProductsMessage() {
  const productsGrid = document.getElementById("products-grid");
  if (productsGrid) {
    productsGrid.innerHTML = '<p class="no-products">No products available at this time.</p>';
  }
}

function showProductLoadError() {
  const productsGrid = document.getElementById("products-grid");
  if (productsGrid) {
    productsGrid.innerHTML = '<p class="error-message">Failed to load products. Please refresh the page to try again.</p>';
  }
}

function renderPage(page) {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;
  
  productsGrid.innerHTML = "";

  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const productsToShow = allProducts.slice(start, end);

  productsToShow.forEach((product) => {
    const productElement = document.createElement("div");
    productElement.className = "product";

    // Add error handling for missing product data
    const productName = product.name || 'Unnamed Product';
    const productImage = product.image || './media/placeholder-product.jpg';

    productElement.innerHTML = `
      <img src="${productImage}" 
           alt="${productName}"
           onerror="this.src='./media/placeholder-product.jpg'">
      <span>${productName}</span>
    `;

    productsGrid.appendChild(productElement);
  });

  updateProductCount(
    Math.min(page * productsPerPage, allProducts.length),
    allProducts.length
  );
}

function renderPagination() {
  const totalPages = Math.ceil(allProducts.length / productsPerPage);
  
  // Don't show pagination if only one page or no products
  if (totalPages <= 1) return;
  
  let pagination = document.getElementById("pagination");

  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "pagination";
    const productsSection = document.querySelector(".products-section");
    if (productsSection) {
      productsSection.appendChild(pagination);
    }
  }

  pagination.innerHTML = "";

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.setAttribute('aria-label', 'Previous page');
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
      renderPagination();
      scrollToProducts();
    }
  });
  pagination.appendChild(prevBtn);

  // Page numbers (show max 5 pages around current)
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = i === currentPage ? "active" : "";
    button.setAttribute('aria-label', `Page ${i}`);
    button.addEventListener("click", () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
      scrollToProducts();
    });
    pagination.appendChild(button);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.setAttribute('aria-label', 'Next page');
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
      renderPagination();
      scrollToProducts();
    }
  });
  pagination.appendChild(nextBtn);
}

function scrollToProducts() {
  const productsSection = document.querySelector(".products-section");
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function updateProductCount(showing, total) {
  const showingElement = document.getElementById("showing-count");
  const totalElement = document.getElementById("total-count");
  
  if (showingElement) showingElement.textContent = showing;
  if (totalElement) totalElement.textContent = total;
}

// =====================
// Form Validation + Submit
// =====================
function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  // Enhanced email validation
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation
  function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  // Enhanced form validation
  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (field.type === 'tel' && value && !isValidPhone(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }

    // Visual feedback
    if (isValid) {
      field.style.borderColor = "#ddd";
      removeErrorMessage(field);
    } else {
      field.style.borderColor = "#e74c3c";
      showErrorMessage(field, errorMessage);
    }

    return isValid;
  }

  function showErrorMessage(field, message) {
    removeErrorMessage(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }

  function removeErrorMessage(field) {
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
  }

  // Form submission with loading state
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requiredFields = form.querySelectorAll("[required]");
    const allFields = form.querySelectorAll("input, select, textarea");
    let isValid = true;

    // Validate all fields
    allFields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      const firstInvalidField = form.querySelector('input[style*="border-color: rgb(231, 76, 60)"], select[style*="border-color: rgb(231, 76, 60)"], textarea[style*="border-color: rgb(231, 76, 60)"]');
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Prepare data
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      // Success feedback
      alert("✅ Your information was submitted successfully! We'll get back to you soon.");
      form.reset();
      
      // Clear any existing error messages
      form.querySelectorAll('.error-message').forEach(msg => msg.remove());
      
    } catch (err) {
      console.error('Form submission error:', err);
      alert(`❌ Failed to submit: ${err.message}. Please try again.`);
    } finally {
      // Reset button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Real-time validation on input
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });
    
    input.addEventListener("input", function () {
      // Clear error styling on input
      this.style.borderColor = "#ddd";
      removeErrorMessage(this);
    });
  });
}

// =====================
// Smooth Navigation
// =====================
function initNavigation() {
  const getStartedBtn = document.querySelector('.get-started-button');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      const formSection = document.querySelector('.form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// =====================
// Init on page load
// =====================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  initContactForm();
  initNavigation();
  
  // Add loading indicator
  const productsGrid = document.getElementById("products-grid");
  if (productsGrid) {
    productsGrid.innerHTML = '<p class="loading">Loading products...</p>';
  }
});