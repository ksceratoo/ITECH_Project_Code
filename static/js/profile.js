document.addEventListener('DOMContentLoaded', function () {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Handle profile image upload
    const profileImageInput = document.querySelector('#profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.querySelector('.profile-img').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle message animations
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        setTimeout(() => {
            message.classList.add('show');
            setTimeout(() => {
                message.classList.remove('show');
                setTimeout(() => message.remove(), 300);
            }, 5000);
        }, 100);
    });

    // Load collection items
    loadCollectionItems();
});

async function loadCollectionItems() {
    try {
        const response = await fetch('/collection/items/');
        const data = await response.json();
        const container = document.getElementById('collectionItemsContainer');

        if (data.products.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No items in collection yet</p>';
            return;
        }

        container.innerHTML = data.products.map(product => `
            <div class="col-md-4">
                <div class="card h-100">
                    <a href="/product_detail/${product.id}/" style="text-decoration: none;">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h6 class="card-title text-dark">${product.name}</h6>
                            <p class="card-text text-muted">$${product.price}</p>
                        </div>
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}
