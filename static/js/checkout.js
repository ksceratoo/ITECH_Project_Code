// Wait for DOM to be fully loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkoutForm');
    const newAddressForm = document.getElementById('new-address-form');
    const useNewAddress = document.getElementById('use-new-address');
    
    // Handle form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Get the selected address choice (new or existing)
        const addressChoice = document.querySelector('input[name="address_choice"]:checked').value;
        
        // Validate form fields based on selected address option
        if (addressChoice === 'new') {
            // Validate all required fields in the new address form
            const requiredFields = newAddressForm.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], select');
            for (let field of requiredFields) {
                if (!field.value) {
                    alert('Please fill in all fields when adding a new address');
                    return;
                }
            }
        } else {
            // Validate that an existing address is selected
            const selectedAddress = document.querySelector('input[name="selected_address"]:checked');
            if (!selectedAddress) {
                alert('Please select an address');
                return;
            }
        }
        
        const formData = new FormData(form);
        
        try {
            // Send POST request to place order
            const response = await fetch('/place_order/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
            
            const data = await response.json();
            
            // Handle server response
            if (data.success) {
                // Redirect to order confirmation page if successful
                window.location.href = `/order_confirmation/${data.order_id}/`;
            } else {
                alert('Error placing order: ' + data.error);
            }
        } catch (error) {
            alert('Error placing order: ' + error);
        }
    });

    // Handle toggling between new and existing address forms
    const useExistingAddress = document.getElementById('use-existing-address');
    const existingAddresses = document.getElementById('existing-addresses');

    if (useExistingAddress && useNewAddress) {
        // Show existing addresses section when "Use Existing Address" is selected
        useExistingAddress.addEventListener('change', function () {
            if (this.checked) {
                existingAddresses.classList.remove('d-none');
                newAddressForm.classList.add('d-none');
            }
        });

        // Show new address form when "Use New Address" is selected
        useNewAddress.addEventListener('change', function () {
            if (this.checked) {
                existingAddresses.classList.add('d-none');
                newAddressForm.classList.remove('d-none');
            }
        });
    }
});
