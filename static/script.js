// JavaScript for Hospital Monitoring Dashboard

document.addEventListener('DOMContentLoaded', () => {

    const socket = io(); // Connect to the SocketIO server
    const acknowledgeButton = document.getElementById('acknowledge-button');
    const alertsContainer = document.getElementById('alerts-container');
    const cameraCards = document.querySelectorAll('.camera-card');
    const videoModal = document.getElementById('videoModal');
    const modalVideoFeed = document.getElementById('modal-video-feed');
    const closeBtn = document.querySelector('.close-btn');

    // Quick Actions Buttons
    const openLiveMonitorBtn = document.getElementById('open-live-monitor-btn');
    const viewIncidentLogsBtn = document.getElementById('view-incident-logs-btn');
    const contactSupportBtn = document.getElementById('contact-support-btn');

    // Buzzer Sound
    const buzzerSound = document.getElementById('buzzer-sound');

    // Function to play the buzzer sound
    function playBuzzerSound() {
        if (buzzerSound) {
            buzzerSound.play();
        }
    }

    // Function to add a new alert card to the dashboard
    function addNewAlert(message) {
        const timestamp = new Date().toLocaleString();
        const newAlert = document.createElement('article');
        newAlert.className = 'alert-card alert-fall';
        newAlert.innerHTML = `
            <h3 class="alert-title">Fall Detected &mdash; Camera 101</h3>
            <p class="alert-details">${timestamp} &bull; ${message}</p>
        `;
        alertsContainer.prepend(newAlert); // Add to the top of the list
    }

    // Listen for fall alerts from the server
    socket.on('fall_alert', (data) => {
        playBuzzerSound();
        addNewAlert(data.message);
    });

    // Event listener for Acknowledge All button
    if (acknowledgeButton) {
        acknowledgeButton.addEventListener('click', () => {
            alertsContainer.innerHTML = '';
            console.log('All alerts acknowledged.');
        });
    }

    // Event listeners for camera cards to open modal
    cameraCards.forEach(card => {
        card.addEventListener('click', () => {
            const videoSource = card.querySelector('img').src;
            if (videoSource) {
                modalVideoFeed.src = videoSource;
                videoModal.style.display = 'block';
            }
        });
    });

    // Event listeners for Quick Actions buttons
    if (openLiveMonitorBtn) {
        openLiveMonitorBtn.addEventListener('click', () => {
            // Find the video feed card and simulate a click
            const liveFeedCard = document.querySelector('img[id="camera-feed-1"]').closest('.camera-card');
            if (liveFeedCard) {
                liveFeedCard.click();
            }
        });
    }

    if (viewIncidentLogsBtn) {
        viewIncidentLogsBtn.addEventListener('click', () => {
            console.log('Redirecting to the incident logs page...');
        });
    }

    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', () => {
            console.log('Redirecting to the contact support page...');
        });
    }

    // Close modal when close button is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            videoModal.style.display = 'none';
            modalVideoFeed.pause();
            modalVideoFeed.src = "";
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === videoModal) {
            videoModal.style.display = 'none';
            modalVideoFeed.pause();
            modalVideoFeed.src = "";
        }
    });
});

// --- Login Modal Interaction ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Elements
    // The query selector targets the button element inside the <nav> element, 
    // which is used as the Login button across your pages.
    const loginButton = document.querySelector('nav button'); 
    const loginModal = document.getElementById('login-modal-overlay');
    const closeButton = document.getElementById('close-login-modal');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    
    // 2. Open Modal Listener (When "Login" button is clicked)
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            if (loginModal) {
                loginModal.classList.remove('hidden');
            }
        });
    }

    // 3. Close Modal Listener (When "X" button is clicked)
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (loginModal) {
                loginModal.classList.add('hidden');
            }
            if (loginMessage) {
                loginMessage.textContent = ''; // Clear any previous error message
            }
            if (loginForm) {
                loginForm.reset(); // Clear the form fields
            }
        });
    }

    // 4. Submit Form Handler (Simulated Authentication)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get values from the form inputs
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simulate a successful login check
            // Use 'staff' and '1234' for a successful demo login
            if (username === 'staff' && password === '1234') {
                // SUCCESS
                if (loginMessage) {
                    loginMessage.style.color = 'green';
                    loginMessage.textContent = 'Login successful! Access Granted.';
                }
                
                // Hide the modal after a short delay
                setTimeout(() => {
                    if (loginModal) {
                        loginModal.classList.add('hidden');
                    }
                    if (loginForm) {
                         loginForm.reset();
                    }
                    if (loginMessage) {
                        loginMessage.style.color = '#ff5757'; // Reset error color
                        loginMessage.textContent = '';
                    }
                }, 1500);
                
            } else {
                // FAILURE
                if (loginMessage) {
                    loginMessage.textContent = 'Invalid username or password.';
                }
            }
        });
    }
});

// --- SOCKETIO CONFIGURATION AND REAL-TIME ALERTS ---

document.addEventListener('DOMContentLoaded', function() {
    // Initialize SocketIO connection
    var socket = io();
    
    // DOM Element References
    const statusCard = document.getElementById('status-summary-card');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const alertsContainer = document.getElementById('alerts-container');
    const buzzer = document.getElementById('buzzer-sound');
    const acknowledgedButton = document.getElementById('acknowledge-button');

    // --- 1. SOCKETIO CONNECTION STATUS ---
    socket.on('connect', function() {
        console.log('Connected to SocketIO server.');
        // Update a placeholder time stamp if one existed, or just log to console
    });

    // --- 2. 'FALL_ALERT' LISTENER (CORE REAL-TIME LOGIC) ---
    socket.on('fall_alert', function(data) {
        console.log('Received Fall Alert:', data.message);
        
        // Extract room number from the alert message (e.g., 'Fall detected in Room 101!')
        const roomMatch = data.message.match(/Room (\d+)/);
        const roomNumber = roomMatch ? roomMatch[1] : 'Unknown';
        const timestamp = new Date().toLocaleString();

        // A. Play the alarm sound (if present)
        if (buzzer) {
            // Attempt to play, catching potential browser errors if not user-initiated
            buzzer.play().catch(e => console.error("Audio playback error:", e));
        }
        
        // B. Update Status Card to Emergency State
        statusCard.classList.remove('alert-prolonged');
        statusCard.classList.add('alert-fall'); // Red state
        statusIcon.textContent = '🚨';
        statusIcon.style.color = 'var(--alert-fall-text)';
        statusText.textContent = `CRITICAL ALERT IN ROOM ${roomNumber}!`;
        
        // C. Update Acknowledge button status
        acknowledgedButton.textContent = 'Acknowledge Pending (1)'; 
        acknowledgedButton.disabled = false;
        
        // D. Add new entry to the Alerts Log
        const newAlert = document.createElement('article');
        newAlert.className = 'alert-card alert-fall';
        newAlert.setAttribute('data-timestamp', Date.now());
        
        // Clear the initial "System Ready" placeholder if this is the first alert
        if (alertsContainer.querySelector('.alert-prolonged')) {
            alertsContainer.innerHTML = '';
        }
        
        newAlert.innerHTML = `
            <h3 class="alert-title">FALL DETECTED &mdash; Camera ${roomNumber}</h3>
            <p class="alert-details">${timestamp} &bull; URGENT ACTION REQUIRED</p>
        `;
        
        // Add the new alert to the top of the container
        alertsContainer.prepend(newAlert);
    });

    // --- 3. ACKNOWLEDGMENT LOGIC ---
    acknowledgedButton.addEventListener('click', () => {
        if (!acknowledgedButton.disabled) {
            // Reset status card to normal/safe state
            statusCard.classList.remove('alert-fall');
            statusCard.classList.add('alert-prolonged'); // Assuming prolonged is the 'safe' color tone
            statusIcon.textContent = '✅';
            statusIcon.style.color = 'var(--alert-prolonged-text)'; // Green checkmark color
            statusText.textContent = 'All Systems Normal';
            
            // Disable button and reset counter
            acknowledgedButton.textContent = 'Acknowledge Pending (0)';
            acknowledgedButton.disabled = true;

            // Optional: Visually "acknowledge" or fade the alerts in the log
            alertsContainer.querySelectorAll('.alert-fall').forEach(alert => {
                alert.style.opacity = '0.5'; 
            });
        }
    });

    // --- 4. MODAL/UI INTERACTIONS ---
    
    // Login Modal Elements
    const loginButton = document.getElementById('login-button');
    const loginModal = document.getElementById('login-modal-overlay');
    const closeLoginModal = document.getElementById('close-login-modal');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    
    // Open Modal
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }
    
    // Close Modal (X button)
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.classList.add('hidden');
        });
    }
    
    // Close Modal (Click outside)
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add('hidden');
            }
        });
    }

    // Placeholder Login Submit Logic
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginMessage.textContent = 'Logging in...';
            
            // Simple validation placeholder
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === 'staff' && password === '1234') {
                loginMessage.style.color = 'var(--primary-color)';
                loginMessage.textContent = 'Login Successful! Redirecting...';
                // In a real app, you would redirect here or update the UI
                setTimeout(() => {
                    loginModal.classList.add('hidden');
                    // Reset message
                    loginMessage.textContent = ''; 
                    loginForm.reset();
                }, 1500);
            } else {
                loginMessage.style.color = 'var(--accent-color)';
                loginMessage.textContent = 'Invalid username or password.';
            }
        });
    }
    
    // Quick Action Button Placeholders
    const viewLogsBtn = document.getElementById('view-incident-logs-btn');
    const contactSupportBtn = document.getElementById('contact-support-btn');

    if (viewLogsBtn) {
        viewLogsBtn.addEventListener('click', () => {
            console.log("View Incident Logs clicked. Implement navigation or modal here.");
            // Example: window.location.href = '/logs';
        });
    }

    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', () => {
            console.log("Contact Support clicked. Implement help link or chat here.");
            // Example: alert('Calling hospital support line...');
        });
    }
});
