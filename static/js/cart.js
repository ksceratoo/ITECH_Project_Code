/**
 * calculate and updates the total price display in the shopping cart
 * by summing all individual item totals
 */
function loadPrices() {
  const itemTotals = document.querySelectorAll('.item-total');
  let total = 0;

  itemTotals.forEach(item => {
    const price = parseFloat(item.textContent.replace('£', ''));
    if (!isNaN(price)) {
      total += price;
    }
  });

  document.getElementById('cart-subtotal').textContent = `£${total.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `£${total.toFixed(2)}`;
}

/**
 * Displays a temporary message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('info', 'success', 'error')
 */
function showMessage(message, type = 'info') {
  const messageContainer = document.createElement('div');
  messageContainer.className = `message message-${type}`;
  messageContainer.textContent = message;

  document.body.appendChild(messageContainer);
  setTimeout(() => messageContainer.classList.add('show'), 100);
  setTimeout(() => {
    messageContainer.classList.remove('show');
    setTimeout(() => messageContainer.remove(), 500);
  }, 3000);
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
    newQuantity = parseInt(input.value) + change;
  } else {
    newQuantity = parseInt(change);
  }

  if (newQuantity < 1) return;

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
      document.getElementById(`total-${itemId}`).textContent = `£${data.total.toFixed(2)}`;
      updateCartTotal(data.cart_total);
      showMessage('Cart updated successfully', 'success');
    }
  } catch (error) {
    console.error('Error:', error);
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
      method: 'GET',
      headers: {
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      }
    });

    const data = await response.json();
    if (data.status === 'success') {
      const item = document.getElementById(`cart-item-${itemId}`);
      item.style.opacity = '0';
      setTimeout(() => {
        item.remove();
        updateCartTotal(data.cart_total);
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
