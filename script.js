document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeBtn = document.getElementsByClassName('close')[0];
    const authForm = document.getElementById('authForm');
    const modalTitle = document.getElementById('modalTitle');
    const authSubmit = document.getElementById('authSubmit');
    const switchAuthLink = document.getElementById('switchAuthLink');
    const creatorLink = document.getElementById('creatorLink');
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    const headerSignupBtn = document.getElementById('headerSignupBtn');
    const showcaseLoginBtn = document.getElementById('showcaseLoginBtn');
    const showcaseSignupBtn = document.getElementById('showcaseSignupBtn');
    const ctaSignupBtn = document.getElementById('ctaSignupBtn');
    const footerCreatorLink = document.getElementById('footerCreatorLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordElement = document.getElementById('forgotPassword');
    const emailInput = document.getElementById('email');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordClose = forgotPasswordModal.querySelector('.close');
    const errorElement = document.getElementById('authError');

    function openModal(isSignup = true) {
        modal.style.display = 'block';
        modalTitle.textContent = isSignup ? 'Sign Up' : 'Log In';
        authSubmit.textContent = isSignup ? 'Sign Up' : 'Log In';
        switchAuthLink.textContent = isSignup ? 'Log in' : 'Sign up';
        forgotPasswordElement.classList.toggle('hidden', isSignup);
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    loginBtn.onclick = (e) => {
        e.preventDefault();
        openModal(false);
    };
    signupBtn.onclick = (e) => {
        e.preventDefault();
        openModal(true);
    };
    closeBtn.onclick = closeModal;

    switchAuthLink.onclick = (e) => {
        e.preventDefault();
        const isCurrentlySignup = modalTitle.textContent === 'Sign Up';
        openModal(!isCurrentlySignup);
    }

    creatorLink.onclick = (e) => {
        // The link will now directly open the Twitter profile
    };

    headerLoginBtn.onclick = (e) => {
        e.preventDefault();
        openModal(false);
    };

    headerSignupBtn.onclick = (e) => {
        e.preventDefault();
        openModal(true);
    };

    showcaseLoginBtn.onclick = (e) => {
        e.preventDefault();
        openModal(false);
    };

    showcaseSignupBtn.onclick = (e) => {
        e.preventDefault();
        openModal(true);
    };

    ctaSignupBtn.onclick = (e) => {
        e.preventDefault();
        openModal(true);
    };

    footerCreatorLink.onclick = (e) => {
        // The link will now directly open the Twitter profile
    };

    forgotPasswordLink.onclick = (e) => {
        e.preventDefault();
        authModal.style.display = 'none';
        forgotPasswordModal.style.display = 'block';
    };

    forgotPasswordClose.onclick = () => {
        forgotPasswordModal.style.display = 'none';
    };

    forgotPasswordForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
                alert('Password reset email sent. Please check your inbox.');
                forgotPasswordModal.style.display = 'none';
            })
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
        if (event.target == forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        }
    };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const isSignup = modalTitle.textContent === 'Sign Up';

        try {
            if (isSignup) {
                await firebase.auth().createUserWithEmailAndPassword(email, password);
                window.location.href = 'welcome.html';
            } else {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.error('Authentication error:', error);
            errorElement.textContent = 'Invalid email or password. Please try again.';
            errorElement.style.display = 'block';
        }
    };

    const words = [
        'Articles',
        'Videos',
        'Podcasts',
        'Research Papers',
        'Courses',
        'Newsletters',
        'Blog Posts',
        'Twitter Threads',
        'YouTube Videos',
        'Academic Papers',
        'LinkedIn Posts',
        'Case Studies',
        'Tutorials',
        'Whitepapers',
        'Conference Talks',
        'Webinars',
        'Interviews',
        'TED Talks',
        'Learning Paths',
        'Infographics',
        'Presentations',
        'Lecture Notes',
        'Book Summaries',
        'Journal Entries',
        'Discussion Threads',
        'Industry Reports',
        'Expert Insights'
    ];
    
    const textElement = document.getElementById('typewriter-text');
    if (!textElement) return;
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            textElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            textElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }
        
        if (!isDeleting && charIndex === currentWord.length) {
            setTimeout(() => {
                isDeleting = true;
            }, 1500);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
        }
        
        const typingSpeed = isDeleting ? 100 : 150;
        setTimeout(type, typingSpeed);
    }
    
    type();

    // Get carousel elements
    const carousel = document.querySelector('.screenshot-carousel');
    const images = carousel.querySelectorAll('img');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');

    let currentIndex = 0;
    let autoScrollInterval;
    const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds between slides

    // Function to show specific image with optional animation
    function showImage(index, animate = true) {
        images.forEach(img => img.classList.remove('active', 'slide-in'));
        
        // Handle wrapping around
        if (index >= images.length) currentIndex = 0;
        if (index < 0) currentIndex = images.length - 1;
        else currentIndex = index;
        
        const activeImage = images[currentIndex];
        activeImage.classList.add('active');
        if (animate) {
            activeImage.classList.add('slide-in');
        }
        
        // Descriptions array matching each image
        const descriptions = [
            "Organize all your resources in one place with our intuitive Resource Bank.",
            "Create and manage collections to group related resources together.",
            "Create structured learning paths to organize your resources into step-by-step learning journeys. Track your progress as you complete each resource.",
            "Easily add new resources with our streamlined interface.",
            "Take and organize notes alongside your saved resources.",
            "Track your learning progress with detailed statistics about your saved resources and completed paths.",
            "Save resources directly from your browser with our extension."
        ];
        
        document.getElementById('screenshot-text').textContent = descriptions[currentIndex];
    }

    // Function to start auto-scrolling
    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            showImage(currentIndex + 1);
        }, AUTO_SCROLL_INTERVAL);
    }

    // Function to stop auto-scrolling
    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }

    // Add click event listeners
    prevBtn.addEventListener('click', () => {
        stopAutoScroll();
        showImage(currentIndex - 1);
        startAutoScroll();
    });

    nextBtn.addEventListener('click', () => {
        stopAutoScroll();
        showImage(currentIndex + 1);
        startAutoScroll();
    });

    // Pause auto-scroll when hovering over carousel
    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    // Initialize first image and start auto-scroll
    showImage(0, false);
    startAutoScroll();
});

