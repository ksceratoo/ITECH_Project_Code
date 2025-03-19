// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
  // Get references to the password toggle button and password input field
  const togglePassword = document.getElementById('togglePassword');
  const passwordField = document.getElementById('passwordField');
  
  // Add click event listener to the toggle password button
  togglePassword.addEventListener('click', function() {
    // Toggle between password and text input types
    // If current type is password, change to text (show password)
    // If current type is text, change to password (hide password)
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    
    // Toggle the eye icon between open and closed states
    // fa-eye represents visible password
    // fa-eye-slash represents hidden password
    const eyeIcon = this.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
  });
});
