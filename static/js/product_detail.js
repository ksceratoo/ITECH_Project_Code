document.addEventListener('DOMContentLoaded', function() {
  // Quantity buttons functionality
  document.getElementById('increase-qty').addEventListener('click', function () {
    var input = document.getElementById('quantity-input');
    input.value = parseInt(input.value) + 1;
  });

  document.getElementById('decrease-qty').addEventListener('click', function () {
    var input = document.getElementById('quantity-input');
    if (parseInt(input.value) > 1) {
      input.value = parseInt(input.value) - 1;
    }
  });

  // Check collection status on page load
  checkCollectionStatus();

  // Add to cart form submission
  document.getElementById('addToCartForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isAuthenticated = document.getElementById('userAuthenticated').value === 'true';
    
    if (!isAuthenticated) {
      const loginModal = new bootstrap.Modal(document.getElementById('loginRequiredModal'));
      loginModal.show();
      return;
    }
    
    const formData = {
      product_id: document.querySelector('input[name="product_id"]').value,
      quantity: document.querySelector('input[name="quantity"]').value
    };

    fetch('/add_to_cart/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('input[name="csrfmiddlewaretoken"]').value
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // Find the messages container or create it if it doesn't exist
        let messagesContainer = document.querySelector('.messages-container');
        if (!messagesContainer) {
          messagesContainer = document.createElement('div');
          messagesContainer.className = 'messages-container';
          const breadcrumb = document.querySelector('nav[aria-label="breadcrumb"]');
          breadcrumb.parentNode.insertBefore(messagesContainer, breadcrumb.nextSibling);
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
          ${data.message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        messagesContainer.appendChild(alertDiv);

        // Optional: Scroll to the alert
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    })
    .catch(error => console.error('Error:', error));
  });
});

// Image preview functionality
function changeImage(element) {
  document.getElementById('mainImage').src = element.src;
}

function previewImages(event) {
  const files = event.target.files;
  const container = document.getElementById('image-preview-container');
  container.innerHTML = '';

  // Limit to a maximum of 3 images
  const maxFiles = Math.min(files.length, 3);

  for (let i = 0; i < maxFiles; i++) {
    const file = files[i];
    if (!file.type.match('image.*')) continue;

    const reader = new FileReader();
    reader.onload = function (e) {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'position-relative';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'img-thumbnail';
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'cover';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0';
      removeBtn.innerHTML = '&times;';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.padding = '0.1rem 0.5rem';
      removeBtn.onclick = function () {
        previewDiv.remove();
      };

      previewDiv.appendChild(img);
      previewDiv.appendChild(removeBtn);
      container.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  }

  // Show a message if more than 3 files were selected
  if (files.length > 3) {
    const message = document.createElement('div');
    message.className = 'alert alert-warning mt-2';
    message.textContent = 'Only the first 3 images will be uploaded.';
    container.appendChild(message);
  }
}

// Collection functionality
async function toggleCollection(buttonElement) {
  try {
    const productId = buttonElement.dataset.productId;
    const response = await fetch(`/collection/toggle/${productId}/`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    const button = buttonElement;
    const buttonText = button.querySelector('#collectionButtonText');

    if (data.status === 'added') {
      button.classList.add('active');
      button.style.backgroundColor = '#dc3545';
      button.style.borderColor = '#dc3545';
      button.style.color = 'white';
      buttonText.textContent = 'Remove from Collection';
    } else {
      button.classList.remove('active');
      button.style.backgroundColor = '';
      button.style.borderColor = '';
      button.style.color = '';
      buttonText.textContent = 'Add to Collection';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if product is in collection on page load
async function checkCollectionStatus() {
  try {
    const response = await fetch('/collection/items/');
    const data = await response.json();
    const productId = document.querySelector('.btn-collection').dataset.productId;

    if (data.products.some(p => p.id === parseInt(productId))) {
      const button = document.querySelector('.btn-collection');
      const buttonText = button.querySelector('#collectionButtonText');
      button.classList.add('active');
      button.style.backgroundColor = '#dc3545';
      button.style.borderColor = '#dc3545';
      button.style.color = 'white';
      buttonText.textContent = 'Remove from Collection';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
