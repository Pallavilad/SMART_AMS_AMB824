document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch to populate the dashboard with default range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];
    
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    
    if(startInput) startInput.value = firstDay;
    if(endInput) endInput.value = lastDay;
    
    loadHistory();
});

function loadHistory() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const historyTbody = document.getElementById('historyTableBody');
    const todayTbody = document.getElementById('todayTableBody');
    const empName = document.getElementById('empName');
    const empID = document.getElementById('empID');
    const todayDate = document.getElementById('todayDate');
    
    // Stats cards
    const statPresent = document.getElementById('statPresent');
    const statAbsent = document.getElementById('statAbsent');
    const statSundays = document.getElementById('statSundays');

    // Show loading state
    historyTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Fetching your records...</td></tr>';
    
    fetch(`./apis/get_employee_dashboard.html?start_date=${start}&end_date=${end}`)
        .then(res => {
            if (res.status === 401) {
                window.location.href = './login.html';
                throw new Error("Unauthorized");
            }
            return res.json();
        })
        .then(response => {
            if (response.status === 'success') {
                const data = response;
                
                // 1. Update Profile
                empName.innerText = data.profile.employee_name;
                empID.innerText = data.profile.employee_id;
                todayDate.innerText = data.today.date;

                // 2. Update Today's Summary
                todayTbody.innerHTML = `
                    <tr>
                        <td><strong>${data.today.punch_in}</strong></td>
                        <td><strong>${data.today.punch_out}</strong></td>
                        <td style="font-weight: 500;">${data.today.hours}</td>
                        <td><span class="${data.today.status === 'LATE' ? 'status-late' : 'status-ontime'}">${data.today.status}</span></td>
                    </tr>
                `;

                // 3. Update Stats Cards
                statPresent.innerText = data.stats.present;
                statAbsent.innerText = data.stats.absent;
                statSundays.innerText = data.stats.sundays;

                // 4. Update History Table
                historyTbody.innerHTML = '';
                if (data.history.length > 0) {
                    data.history.forEach(row => {
                        const tr = document.createElement('tr');
                        const statusClass = row.status === 'LATE' ? 'status-late' : 'status-ontime';
                        
                        tr.innerHTML = `
                            <td>${row.date}</td>
                            <td style="color: var(--text-secondary);">${row.day}</td>
                            <td>${row.punch_in_fmt}</td>
                            <td>${row.punch_out_fmt}</td>
                            <td style="font-weight: 500;">${row.total_hours}</td>
                            <td><span class="${statusClass}">${row.status}</span></td>
                        `;
                        historyTbody.appendChild(tr);
                    });
                } else {
                    historyTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No scans found for this range.</td></tr>';
                }
            } else {
                alert("Error: " + response.message);
                historyTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #f43f5e;">Error: ${response.message}</td></tr>`;
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            historyTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #f43f5e;">Failed to load data. Please refresh.</td></tr>';
        });
}

function resetFilter() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('startDate').value = firstDay;
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    loadHistory();
}

function togglePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (!modal) return;
    
    if (modal.classList.contains('show')) {
        modal.classList.remove('show');
        // Clear fields on close
        document.getElementById('currentPass').value = '';
        document.getElementById('newPass').value = '';
        document.getElementById('confirmPass').value = '';
        document.getElementById('passwordMessage').innerHTML = '';
        
        // Reset eye icons to 'eye' and types to 'password'
        const toggles = document.querySelectorAll('.toggle-password');
        toggles.forEach(eye => {
            eye.classList.remove('fa-eye-slash');
            eye.classList.add('fa-eye');
            const input = eye.previousElementSibling;
            if(input) input.type = 'password';
        });
    } else {
        modal.classList.add('show');
    }
}

function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function submitPasswordChange() {
    const currentPass = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;
    const btn = document.getElementById('savePasswordBtn');
    const msg = document.getElementById('passwordMessage');

    if (!currentPass || !newPass || !confirmPass) {
        msg.innerHTML = '<span style="color: #f43f5e;">Please fill all fields.</span>';
        return;
    }

    if (newPass !== confirmPass) {
        msg.innerHTML = '<span style="color: #f43f5e;">New passwords do not match!</span>';
        return;
    }

    // UI Feedback
    btn.disabled = true;
    btn.innerText = 'Updating...';
    msg.innerHTML = '<span style="color: var(--accent-blue);">Contacting secure server...</span>';

    try {
        const response = await fetch('./apis/change_password.html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: currentPass,
                new_password: newPass,
                confirm_password: confirmPass
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            msg.innerHTML = `<span style="color: #10b981;"><i class="fas fa-check-circle"></i> ${data.message}</span>`;
            setTimeout(() => {
                togglePasswordModal();
                btn.disabled = false;
                btn.innerText = 'Update Now';
            }, 2000);
        } else {
            msg.innerHTML = `<span style="color: #f43f5e;"><i class="fas fa-exclamation-circle"></i> ${data.message}</span>`;
            btn.disabled = false;
            btn.innerText = 'Update Now';
        }
    } catch (err) {
        console.error("Password update error:", err);
        msg.innerHTML = '<span style="color: #f43f5e;">Critical connection failure.</span>';
        btn.disabled = false;
        btn.innerText = 'Update Now';
    }
}

