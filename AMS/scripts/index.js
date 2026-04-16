document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Time Display for Mockup
    const mockupTimeElement = document.getElementById('mockupTime');
    if (mockupTimeElement) {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            hours = hours % 12;
            hours = hours ? hours : 12; 
            minutes = minutes < 10 ? '0' + minutes : minutes;
            
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            
            const dayName = days[now.getDay()];
            const monthName = months[now.getMonth()];
            const date = now.getDate();
            
            mockupTimeElement.textContent = `${hours}:${minutes} ${ampm} | ${dayName}, ${monthName} ${date}`;
        };
        
        // Initial call
        updateTime();
        // Update every minute
        setInterval(updateTime, 60000);
    }

    // Smooth Scrolling for nav links
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Button interactions
    const getStartedBtns = document.querySelectorAll('.btn-primary');
    getStartedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Both buttons should lead to the login/dashboard portal for now
            window.location.href = './login.html';
        });
    });
});

