window.openExportModal = function() {
    console.log("AMS: [v2.0] Export request received. Checking data...");
    if(!window.currentReportData || window.currentReportData.length === 0) {
        alert("No data is loaded! Filter output first.");
        return;
    }

    let modal = document.getElementById('exportModal');
    if (!modal) {
        console.log("AMS: [v2.0] Injecting massive dynamic modal...");
        modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 style="color: white; margin-bottom: 0.5rem; font-size: 2rem; font-weight: 800;">Export Attendance Report</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">Select your high-resolution format:</p>
                <div class="export-buttons-container">
                    <button class="btn-primary btn-csv" onclick="exportCSV()">
                        <i class="fas fa-file-excel" style="font-size: 2.5rem;"></i>
                        <span>Excel (CSV)</span>
                    </button>
                    <button class="btn-primary btn-pdf" onclick="exportPDF()">
                        <i class="fas fa-file-pdf" style="font-size: 2.5rem;"></i>
                        <span>Portable (PDF)</span>
                    </button>
                </div>
                <button class="btn-primary" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; margin-top: 2rem; width: 100%; border-radius: 12px;" onclick="closeExportModal()">
                    CANCEL EXPORT
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    console.log("AMS: Showing v2.0 modal...");
    modal.classList.add('show');
};

// Emergency Manual Access
window.AMS_MANUAL_EXPORT = window.openExportModal;

window.closeExportModal = function() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.addEventListener('click', function(event) {
    const modal = document.getElementById('exportModal');
    if (event.target == modal) {
        modal.classList.remove('show');
    }
});

/*** HARDENED TRIGGER: Auto-Hook Export & Refresh Buttons ***/
document.addEventListener('DOMContentLoaded', () => {
    // Shared functionality: Handle Time Updates across admin portal
    const timeDisplay = document.getElementById('currentTime');
    if (timeDisplay) {
        setInterval(() => {
            const now = new Date();
            timeDisplay.innerText = now.toLocaleTimeString() + ' | ' + now.toLocaleDateString();
        }, 1000);
    }

    // Auto-Hook: Search for 'Export' buttons and attach listeners manually
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.textContent.trim().toUpperCase() === 'EXPORT') {
            console.log("AMS: Found Export button, hardening trigger...");
            btn.removeAttribute('onclick'); // Clear potentially cached handler
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.openExportModal();
            });
        }
    });

    // SECURITY CHECK: Immediate role validation for admin portal
    fetch('./apis/check_role.html')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.role !== 'admin') {
                    // Not an admin? Redirect immediately to employee dashboard
                    window.location.replace('./employee_dashboard.html');
                }
            } else {
                // No session? Redirect to login
                window.location.replace('./login.html');
            }
        })
        .catch(err => {
            console.error('Auth verification failed', err);
        });

    // Page-specific initialization (executes only if redirect didn't happen)
    const path = window.location.pathname;

    if (path.includes('dashboard.html') || path.includes('dashboard.html')) {
        initDashboard();
    } else if (path.includes('settings.html') || path.includes('settings.html')) {
        initSettings();
    } else if (path.includes('reports.html') || path.includes('reports.html')) {
        initReports();
    } else if (path.includes('register.html') || path.includes('register.html')) {
        initRegistration();
    }
});

/* ===========================
    DASHBOARD LOGIC
=========================== */
function initDashboard() {
    const tbody = document.getElementById('recentLogsTableBody');
    const refreshBtn = document.getElementById('viewAllBtn');
    
    if(!tbody) return;

    const fetchLogs = () => {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Syncing logs...</td></tr>';
        
        // Fetch Summary Stats for Admin Dashboard
        fetch('./apis/get_employee_dashboard.html?admin_summary=true')
            .then(res => res.json())
            .then(stats => {
                if (stats.status === 'success') {
                    document.getElementById('totalPresents').innerText = stats.summary.total_present;
                    document.getElementById('totalAbsents').innerText = stats.summary.total_absent;
                    document.getElementById('activeEmployees').innerText = stats.summary.active_in;
                    document.getElementById('registeredDevices').innerText = stats.summary.devices_online;
                }
            });

        fetch('./apis/get_recent_logs.html')
            .then(res => res.json())
            .then(data => {
                tbody.innerHTML = '';
// ... (rest of the logic remains)
                if (data.status === 'success' && data.data.length > 0) {
                    data.data.forEach((log, index) => {
                        const tr = document.createElement('tr');
                        const logTime = log.time.split(' ')[1] || 'N/A';
                        
                        tr.innerHTML = `
                            <td>${index + 1}</td>
                            <td><strong>${log.employee_id}</strong></td>
                            <td>${log.employee_name}</td>
                            <td><span class="role" style="background: ${log.action === 'IN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${log.action === 'IN' ? '#10b981' : '#ef4444'}; border: 1px solid ${log.action === 'IN' ? '#10b981' : '#ef4444'};">${log.action}</span></td>
                            <td style="color: var(--text-secondary); font-size: 0.9rem;">${logTime}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No recent logs found.</td></tr>';
                }
            });
    };

    fetchLogs();
    fetchUsers();

    if (refreshBtn) {
        refreshBtn.onclick = () => {
            fetchLogs();
            fetchUsers();
        };
    }
}

/* ===========================
    SETTINGS LOGIC
=========================== */
function initSettings() {
    loadDevices();
    loadUsers();
}

function loadDevices() {
    const tbody = document.getElementById('deviceTableBody');
    if(!tbody) return;

    fetch('./apis/device_management.html')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.status === 'success' && data.data.length > 0) {
                data.data.forEach(dev => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${dev.device_id}</strong></td>
                        <td>${dev.device_name || 'N/A'}</td>
                        <td><span style="color: ${dev.status === 'active' || dev.status === 'online' ? '#10b981' : '#94a3b8'}">${dev.status ? dev.status.toUpperCase() : 'OFFLINE'}</span></td>
                        <td><button class="btn-danger" onclick="deleteDevice('${dev.device_id}')">Remove</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No devices registered.</td></tr>';
            }
        });
}

window.addDevice = function() {
    const id = document.getElementById('devIdInput').value;
    const loc = document.getElementById('devLocInput').value;
    
    if(!id) {
        alert("Device ID is required!");
        return;
    }
    
    fetch('./apis/device_management.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: id, location: loc })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            document.getElementById('devIdInput').value = '';
            document.getElementById('devLocInput').value = '';
            loadDevices();
        } else {
            alert("Error: " + data.message);
        }
    });
};

window.deleteDevice = function(id) {
    if(confirm("Remove device " + id + "?")) {
        fetch('./apis/device_management.html', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                loadDevices();
            } else {
                alert("Error: " + data.message);
            }
        });
    }
};

function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;

    fetch('./apis/user_management.html')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.status === 'success' && data.data.length > 0) {
                data.data.forEach((user, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td><strong>${user.username}</strong></td>
                        <td><span class="role">${user.role.toUpperCase()}</span></td>
                        <td><button class="btn-danger" onclick="deleteUser(${user.id})">Remove</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No admins found.</td></tr>';
            }
        });
}

window.addUser = function() {
    const user = document.getElementById('usernameInput').value;
    const pass = document.getElementById('passwordInput').value;
    
    if(!user || !pass) {
        alert("Username and password are required!");
        return;
    }
    
    fetch('./apis/user_management.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            document.getElementById('usernameInput').value = '';
            document.getElementById('passwordInput').value = '';
            loadUsers();
        } else {
            alert("Error: " + data.message);
        }
    });
};

window.deleteUser = function(id) {
    if(confirm("Remove admin with ID " + id + "?")) {
        fetch('./apis/user_management.html', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                loadUsers();
            } else {
                alert("Error: " + data.message);
            }
        });
    }
};

/* ===========================
    REPORTS LOGIC
=========================== */
window.currentReportData = []; // Explicitly attach to window for global access

function initReports() {
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    
    if(startInput) startInput.value = today;
    if(endInput) endInput.value = today;
    loadReports();
}

function initRegistration() {
    fetchUsers();
}

function fetchUsers() {
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;
    
    fetch('./apis/get_users.html')
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if(data.status === 'success' && data.data.length > 0) {
                data.data.forEach((user, index) => {
                    const tr = document.createElement('tr');
                    const names = user.employee_name.split(', ');
                    const displayName = names[0];
                    const aliasHint = names.length > 1 ? `<br><small style="color:var(--text-secondary); font-style: italic;">Aliases: ${names.slice(1).join(', ')}</small>` : '';

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td style="color: var(--accent-blue); font-weight: 700;">${user.employee_id}</td>
                        <td>
                            <div style="font-weight: 500;">${displayName}</div>
                            ${aliasHint}
                        </td>
                        <td><button class="btn-primary" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 5px 12px; font-size: 11px; border-radius: 4px;" onclick="deleteEmployeeByID('${user.employee_id}')">Delete</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No authorized employees found.</td></tr>';
            }
        });
}

function deleteEmployeeByID(id) {
    if(!confirm(`Are you sure you want to delete Employee ${id}? This will remove all associated aliases from the database and hardware.`)) return;
    
    fetch('./apis/delete_user.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            fetchUsers();
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(err => alert("Connection error while deleting."));
}

window.fetchUsers = fetchUsers;
window.deleteEmployeeByID = deleteEmployeeByID;
window.initRegistration = initRegistration;

window.addEmployee = function() {
    const id = document.getElementById('empIdInput').value;
    const name = document.getElementById('empNameInput').value;
    
    if(!id || !name) {
        alert("Employee ID and Name are required!");
        return;
    }
    
    fetch('./apis/add_user.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: id, username: name })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            document.getElementById('empIdInput').value = '';
            document.getElementById('empNameInput').value = '';
            fetchUsers();
            alert("Employee registered successfully!");
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(err => {
        console.error("Registration error:", err);
        alert("Connection error while registering.");
    });
};

function loadReports() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const search = document.getElementById('filterID').value;
    
    let url = `./apis/get_reports.html?start_date=${start}&end_date=${end}&search=${encodeURIComponent(search)}`;
    
    const tbody = document.getElementById('reportTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Calculating results...</td></tr>';

    fetch(url)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = '';
            if (data.status === 'success' && data.data.length > 0) {
                currentReportData = data.data; 
                data.data.forEach((row, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td><strong>${row.name}</strong></td>
                        <td>${row.presents}</td>
                        <td>${row.absents}</td>
                        <td>${row.hours}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                currentReportData = [];
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No results found for this range.</td></tr>';
            }
        });
};

window.exportCSV = function() {
    if(currentReportData.length === 0) {
        alert("No data to export!");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Sl.No.,Employee Name,Total Presents,Total Absents,Total Hours\n";
    
    currentReportData.forEach(function(row, index) {
       let csvRow = `${index + 1},"${row.name}",${row.presents},${row.absents},${row.hours}`;
       csvContent += csvRow + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AMS_Attendance_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeExportModal();
};

window.openExportModal = function() {
    if(currentReportData.length === 0) {
        alert("No data is loaded! Filter output first.");
        return;
    }
    document.getElementById('exportModal').style.display = "block";
};

window.closeExportModal = function() {
    document.getElementById('exportModal').style.display = "none";
};

// Close modal if user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('exportModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

window.exportPDF = function() {
    if(typeof html2pdf === 'undefined') {
        alert("PDF Library not loaded. Check internet connection.");
        return;
    }

    if(currentReportData.length === 0) {
        alert("No data to export!");
        return;
    }

    // Create a temporary container for styling the PDF
    const printDiv = document.createElement('div');
    printDiv.style.padding = '20px';
    printDiv.style.fontFamily = 'sans-serif';
    printDiv.style.color = '#333';
    
    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin:0; color:#1e40af;">AMS ATTENDANCE SYSTEM</h2>
            <h3 style="margin:5px 0; color:#555;">Aggregated Performance Report</h3>
            <p style="margin:0; font-size:12px; color:#888;">Generated: ${new Date().toLocaleString()}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px;">
            <thead>
                <tr style="background-color:#f1f5f9;">
                    <th style="padding:8px; border:1px solid #cbd5e1;">Sl.No</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;">Employee Name</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;">Presents</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;">Absents</th>
                    <th style="padding:8px; border:1px solid #cbd5e1;">Total Hours</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentReportData.forEach((row, index) => {
        html += `
            <tr>
                <td style="padding:8px; border:1px solid #cbd5e1;">${index + 1}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;"><strong>${row.name}</strong></td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${row.presents}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${row.absents}</td>
                <td style="padding:8px; border:1px solid #cbd5e1;">${row.hours}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    printDiv.innerHTML = html;

    const opt = {
      margin:       10,
      filename:     'attendance_report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printDiv).save().then(() => {
        closeExportModal();
    });
};

