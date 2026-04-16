/**
 * auth_utils.js
 * Centralized authentication and session utilities for AMS Secure Attendance
 */

(function(window) {
    // Global Fetch Interceptor to enforce Single-Session Concurrency globally
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch.apply(this, args);
            if (response.status === 401) {
                console.warn("AMS: Multiple logins detected or session expired! Kicking out...");
                const path = window.location.pathname;
                const loginUrl = (path.includes('/apis/') || path.includes('/scripts/')) ? '../login.html?error=session_expired' : './login.html?error=session_expired';
                window.location.replace(loginUrl);
                // Return a never-resolving promise to stop execution of further chained .then() blocks
                return new Promise(() => {}); 
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    // Heartbeat: Ping the server every 5 seconds to keep last_active updated and detect remote logouts
    setInterval(() => {
        const path = window.location.pathname;
        if (path.includes('login.html')) return; // Don't heartbeat on login page
        const checkUrl = (path.includes('/apis/') || path.includes('/scripts/')) ? '../apis/check_role.html' : './apis/check_role.html';
        fetch(checkUrl).catch(() => {});
    }, 5000);

    const Auth = {
        /**
         * Global logout function
         * Terminates the session and redirects to index
         */
        logout: function() {
            console.log("AMS: Logout triggered");
            
            // Check if modal already exists, if not, create it
            let modal = document.getElementById('logoutModal');
            if (!modal) {
                console.log("AMS: Creating logout modal...");
                modal = document.createElement('div');
                modal.id = 'logoutModal';
                modal.className = 'logout-overlay';
                modal.innerHTML = `
                    <div class="logout-card">
                        <div class="logout-icon">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to exit AMS Secure Attendance? You will need to log back in to access your dashboard.</p>
                        <div class="logout-buttons">
                            <button class="btn-logout-cancel" id="cancelLogout">Stay Logged In</button>
                            <button class="btn-logout-confirm" id="confirmLogout">Logout Now</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Add event listeners
                document.getElementById('cancelLogout').addEventListener('click', () => {
                    modal.classList.remove('show');
                });

                document.getElementById('confirmLogout').addEventListener('click', () => {
                    const path = window.location.pathname;
                    const isInSubdir = path.includes('/apis/') || path.includes('/scripts/');
                    const logoutUrl = isInSubdir ? '../apis/logout_api.html' : './apis/logout_api.html';
                    window.location.href = logoutUrl;
                });
            }

            // Show the modal
            modal.classList.add('show');
        }
    };

    // Auto-Hook Logic: Find logout buttons and attach listeners manually
    document.addEventListener('DOMContentLoaded', () => {
        console.log("AMS: Auth utils loaded, scanning for logout buttons...");
        const logoutButtons = document.querySelectorAll('.btn-danger');
        logoutButtons.forEach(btn => {
            if (btn.textContent.trim().toUpperCase() === 'LOGOUT') {
                console.log("AMS: Found logout button, hooking up...");
                btn.removeAttribute('onclick'); // Clear old potential cached handler
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout();
                });
            }
        });

        // ENHANCEMENT: Global Date Picker Behavior
        // This ensures clicking ANYWHERE on the date box opens the calendar
        // and disables manual typing.
        document.querySelectorAll('input[type="date"]').forEach(input => {
            // 1. Open picker on click
            input.addEventListener('click', function() {
                if (typeof this.showPicker === 'function') {
                   try { this.showPicker(); } catch(e) {}
                }
            });

            // 2. Open picker on focus (tabbing in)
            input.addEventListener('focus', function() {
                if (typeof this.showPicker === 'function') {
                   try { this.showPicker(); } catch(e) {}
                }
            });

            // 3. Disable manual typing
            input.addEventListener('keydown', function(e) {
                // Allow Tab, Escape, and maybe Backspace/Delete to clear
                if (e.key === 'Tab' || e.key === 'Escape') return;
                
                // For all other keys, prevent default (typing)
                e.preventDefault();
                // But still try to open picker on any keypress as a hint
                if (typeof this.showPicker === 'function') {
                    try { this.showPicker(); } catch(err) {}
                }
            });
        });
    });

    // Export to global window object
    window.logout = Auth.logout;
})(window);

