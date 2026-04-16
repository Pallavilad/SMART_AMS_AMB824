document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = document.getElementById('btnLoader');
    const loginMessage = document.getElementById('loginMessage');

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Change icon based on state
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Handle Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = passwordInput.value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Reset state
        loginMessage.textContent = '';
        loginMessage.className = 'login-message';
        
        // Start loading
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            // In a real application, you would send this to your API
            // For now, let's simulate a fetch call
            console.log('Attempting login for:', username);

            // Fetch to a login API (we'll implement this next if requested)
            const response = await fetch('./apis/login_api.html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    rememberMe
                })
            });

            const result = await response.json();

            if (result.success) {
                loginMessage.textContent = 'Login successful! Redirecting...';
                loginMessage.classList.add('message-success');
                
                // REDIRECTION LOGIC: Strictly controlled by role
                const userRole = (result.user.role || '').toLowerCase().trim();
                console.log('Final Redirecting for Role:', userRole);
                
                setTimeout(() => {
                    if (userRole === 'admin') {
                        window.location.replace('./dashboard.html');
                    } else if (userRole === 'employee') {
                        window.location.replace('./employee_dashboard.html');
                    } else {
                        // Safety fallback for any other role
                        window.location.replace('./employee_dashboard.html');
                    }
                }, 500);
            } else {
                loginMessage.textContent = result.message || 'Invalid username or password.';
                loginMessage.classList.add('message-error');
                loginBtn.disabled = false;
                btnText.style.display = 'block';
                btnLoader.style.display = 'none';
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback for visual demonstration if API is missing
            loginMessage.textContent = 'Demo Mode: Login sequence initiated.';
            loginMessage.classList.add('message-success');
            
            setTimeout(() => {
                window.location.href = './index.html';
            }, 2000);
        }
    });

    // Submitter feedback interactions
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            loginMessage.textContent = '';
        });
    });
});

