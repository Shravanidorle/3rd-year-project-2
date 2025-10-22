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
