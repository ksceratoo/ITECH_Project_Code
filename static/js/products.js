document.addEventListener('DOMContentLoaded', function () {
  // Get CSRF token from meta tag
  const CSRF_TOKEN = document.querySelector('[name=csrfmiddlewaretoken]').value;
  
  // Set up category filter highlighting based on URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('category') || 'all';

  // Update category badge highlighting
  document.querySelectorAll('.category-badge').forEach(badge => {
    if (badge.dataset.category.toLowerCase() === currentCategory.toLowerCase()) {
      badge.classList.add('bg-primary');
    } else {
      badge.classList.add('bg-secondary');
    }
  });

  // Initialize filter elements
  const searchInput = document.getElementById('searchProducts');
  const sortSelect = document.getElementById('sortProducts');
  const priceRangeSelect = document.getElementById('priceRange');
  const products = document.querySelectorAll('.product-card');

  // Filter products based on search, sort, and price range
  function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortValue = sortSelect.value;
    const priceRange = priceRangeSelect.value;

    products.forEach(product => {
      const name = product.dataset.name;
      const price = parseFloat(product.dataset.price);
      let visible = name.includes(searchTerm);

      // Price range filter
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(val => val === '+' ? Infinity : parseFloat(val));
        visible = visible && (price >= min && (max === Infinity ? true : price <= max));
      }

      product.style.display = visible ? '' : 'none';
    });

    // Sorting
    const productArray = Array.from(products);
    switch (sortValue) {
      case 'price-low':
        sortProducts(productArray, (a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
        break;
      case 'price-high':
        sortProducts(productArray, (a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
        break;
      case 'name':
        sortProducts(productArray, (a, b) => a.dataset.name.localeCompare(b.dataset.name));
        break;
    }
  }

  // Sort products and re-append to grid
  function sortProducts(productArray, compareFunction) {
    const productsGrid = document.getElementById('productsGrid');
    productArray.sort(compareFunction).forEach(product => {
      productsGrid.appendChild(product);
    });
  }

  // Add event listeners
  searchInput.addEventListener('input', filterProducts);
  sortSelect.addEventListener('change', filterProducts);
  priceRangeSelect.addEventListener('change', filterProducts);

  // Add to cart functionality
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function () {
      const productId = this.dataset.productId;
      const productName = this.dataset.productName;

      // Show loading state
      this.disabled = true;
      this.innerHTML = 'Adding...';

      fetch('/add_to_cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': CSRF_TOKEN,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      })
        .then(response => response.json())
        .then(data => {
          // Reset button state
          this.disabled = false;
          this.innerHTML = 'Add to Cart';

          const messageContainer = document.createElement('div');
          messageContainer.className = `message message-${data.status === 'success' ? 'success' : 'error'} show`;
          messageContainer.textContent = data.status === 'success'
            ? `${productName} added to cart!`
            : data.message || 'Error adding to cart';

          const container = document.querySelector('.message-container') || document.createElement('div');
          if (!document.querySelector('.message-container')) {
            container.className = 'message-container';
            document.body.appendChild(container);
          }
          container.appendChild(messageContainer);

          setTimeout(() => {
            messageContainer.remove();
          }, 3000);
        })
        .catch(error => {
          // Reset button state
          this.disabled = false;
          this.innerHTML = 'Add to Cart';

          const messageContainer = document.createElement('div');
          messageContainer.className = 'message message-error show';
          messageContainer.textContent = 'Failed to add item to cart';
          
          const container = document.querySelector('.message-container') || document.createElement('div');
          if (!document.querySelector('.message-container')) {
            container.className = 'message-container';
            document.body.appendChild(container);
          }
          container.appendChild(messageContainer);

          setTimeout(() => {
            messageContainer.remove();
          }, 3000);
        });
    });
  });
});
