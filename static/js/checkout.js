// Wait for DOM to be fully loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkoutForm');
    const newAddressForm = document.getElementById('new-address-form');
    const useNewAddress = document.getElementById('use-new-address');
    const submitButton = document.getElementById('place-order-btn');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');
    const errorMessage = document.getElementById('error-message');
    
    // Handle form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        // Get the selected address choice (new or existing)
        const addressChoiceInput = document.querySelector('input[name="address_choice"]:checked');
        const hasExistingAddresses = document.getElementById('use-existing-address') !== null;
        
        // Only validate address choice if there are existing addresses
        if (hasExistingAddresses) {
            if (!addressChoiceInput) {
                errorMessage.textContent = 'Please select an address option';
                errorMessage.classList.remove('d-none');
                return;
            }
        }

        // If no existing addresses, treat as new address
        const addressChoice = hasExistingAddresses ? addressChoiceInput.value : 'new';
        
        // Validate form fields based on selected address option
        if (addressChoice === 'new') {
            // Validate all required fields in the new address form
            const requiredFields = newAddressForm.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], select');
            for (let field of requiredFields) {
                if (!field.value) {
                    errorMessage.textContent = 'Please fill in all fields when adding a new address';
                    errorMessage.classList.remove('d-none');
                    return;
                }
            }
        } else {
            // Validate that an existing address is selected
            const selectedAddress = document.querySelector('input[name="selected_address"]:checked');
            if (!selectedAddress) {
                errorMessage.textContent = 'Please select an address';
                errorMessage.classList.remove('d-none');
                return;
            }
        }
        
        // Reset UI state
        errorMessage.classList.add('d-none');
        buttonText.classList.add('d-none');
        spinner.classList.remove('d-none');
        submitButton.disabled = true;

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
                throw new Error(data.error || 'Error placing order');
            }
        } catch (error) {
            errorMessage.textContent = error.message || 'Error processing your order. Please try again.';
            errorMessage.classList.remove('d-none');
            buttonText.classList.remove('d-none');
            spinner.classList.add('d-none');
            submitButton.disabled = false;
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
