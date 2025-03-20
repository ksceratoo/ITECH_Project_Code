/**
 * calculate and updates the total price display in the shopping cart
 * by summing all individual item totals
 */
function loadPrices() {
  const items = document.querySelectorAll('.cart-item');
  items.forEach(item => {
    const itemId = item.id.replace('cart-item-', '');
    updateItemTotal(itemId);
  });
  updateCartTotal();
}

/**
 * Displays a temporary message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('info', 'success', 'error')
 */
function showMessage(message, type = 'info') {
  const container = document.querySelector('.message-container') || document.body;
  const messageDiv = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
  
  messageDiv.className = `message message-${type}`;
  messageDiv.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(messageDiv);
  requestAnimationFrame(() => messageDiv.classList.add('show'));

  setTimeout(() => {
    messageDiv.classList.remove('show');
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

/**
 * Calculate and update individual item total
 * @param {string} itemId - The ID of the item
 */
function updateItemTotal(itemId) {
  const input = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
  const totalSpan = document.getElementById(`total-${itemId}`);
  const price = parseFloat(input.dataset.price);
  const quantity = parseInt(input.value) || parseInt(input.dataset.quantity) || 1;
  const total = price * quantity;
  
  // Update the total display
  totalSpan.textContent = `£${total.toFixed(2)}`;
  
  // Ensure quantity is properly displayed
  input.value = quantity;
  
  return total;
}

/**
 * Updates the quantity of an item in the cart
 * @param {string} itemId - The ID of the item to update
 * @param {number|string} change - Either the quantity change (+/-) or new quantity value
 */
async function updateQuantity(itemId, change) {
  const input = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
  let newQuantity;

  if (typeof change === 'number') {
    newQuantity = (parseInt(input.value) || parseInt(input.dataset.quantity) || 1) + change;
  } else {
    newQuantity = parseInt(change) || 1;
  }

  if (newQuantity < 1) {
    showMessage('Quantity cannot be less than 1', 'error');
    input.value = 1;
    return;
  }

  try {
    const response = await fetch(`/cart/update/${itemId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: `quantity=${newQuantity}`
    });

    const data = await response.json();
    if (data.status === 'success') {
      input.value = data.quantity;
      input.dataset.quantity = data.quantity;
      updateItemTotal(itemId);
      updateCartTotal();
      showMessage('Cart updated successfully', 'success');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Failed to update quantity', 'error');
    // Restore original quantity on error
    input.value = input.dataset.quantity || 1;
  }
}

/**
 * remove an item from the shopping cart
 * @param {string} itemId - The ID of the item to remove
 */
async function removeItem(itemId) {
  if (!confirm('Are you sure you want to remove this item?')) return;

  try {
    const response = await fetch(`/cart/remove/${itemId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      }
    });

    const data = await response.json();
    if (data.status === 'success') {
      const item = document.getElementById(`cart-item-${itemId}`);
      item.style.opacity = '0';
      setTimeout(() => {
        item.remove();
        updateCartTotal();
      }, 300);
      showMessage('Item removed from cart', 'success');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('Failed to remove item', 'error');
  }
}

/**
 * updates the cart total display
 * @param {number} total precalculated total, if not provided, calculate from items
 */
function updateCartTotal(total) {
  // If total is provided, use it directly
  if (typeof total === 'number') {
    document.getElementById('cart-subtotal').textContent = `£${total.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `£${total.toFixed(2)}`;
    return;
  }

  // Otherwise calculate total from item prices
  const itemTotals = document.querySelectorAll('.item-total');
  let calculatedTotal = 0;

  itemTotals.forEach(item => {
    const price = parseFloat(item.textContent.replace('£', ''));
    if (!isNaN(price)) {
      calculatedTotal += price;
    }
  });

  document.getElementById('cart-subtotal').textContent = `£${calculatedTotal.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `£${calculatedTotal.toFixed(2)}`;
}

/**
 * Initialize event handlers when the DOM is fully loaded
 * Sets up listeners for quantity changes and item removal
 */
document.addEventListener('DOMContentLoaded', function () {
  // Load prices when page loads
  loadPrices();

  // Quantity input handlers
  const quantityInputs = document.querySelectorAll('.quantity-input');
  quantityInputs.forEach(input => {
    input.addEventListener('change', function () {
      const itemId = this.dataset.itemId;
      updateQuantity(itemId, this.value);
    });
  });

  // Increase/decrease button handlers
  const increaseBtns = document.querySelectorAll('.increase-btn');
  const decreaseBtns = document.querySelectorAll('.decrease-btn');

  increaseBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const itemId = this.dataset.itemId;
      updateQuantity(itemId, 1);
    });
  });

  decreaseBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const itemId = this.dataset.itemId;
      updateQuantity(itemId, -1);
    });
  });

  // Remove button handlers
  const removeButtons = document.querySelectorAll('.remove-item');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const itemId = this.dataset.itemId;
      removeItem(itemId);
    });
  });
});

  // Remove item
  document.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', function () {
      const item = this.closest('.cart-item');
      item.style.opacity = '0';
      setTimeout(() => {
        item.remove();
        updateCartTotal();
      }, 300);
    });
  });
