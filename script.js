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

    // Product showcase carousel
    const carousel = document.querySelector('.screenshot-carousel');
    const images = carousel.querySelectorAll('img');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    const descriptionText = document.getElementById('screenshot-text');
    let currentIndex = 0;

    const features = [
        {
            title: "Resource Bank",
            description: "Effortlessly manage all your resources in one place. Search, sort, and organize your saved content based on date added, tags, resource type, collections, and more."
        },
        {
            title: "Collections",
            description: "Create and curate themed collections of resources. Group related content together for easy access and better organization of your knowledge."
        },
        {
            title: "Favorites",
            description: "Quickly access your most important resources by adding them to your favorites list. Easily view and manage all your favorited content in one place."
        },
        {
            title: "Add Resource",
            description: "Seamlessly add new resources directly from the Resource Bank interface. Categorize, tag, and organize your content as you save it."
        },
        {
            title: "Browser Extension",
            description: "Save resources on the go with our powerful browser extension. Capture web content with a single click while you browse."
        }
    ];

    // Add this array of gradient colors
    const gradientColors = [
        { start: '#FF6B6B', end: '#4ECDC4' },
        { start: '#A770EF', end: '#CF8BF3' },
        { start: '#FFD93D', end: '#FF9A3D' },
        { start: '#6DD5FA', end: '#2980B9' },
        { start: '#56CCF2', end: '#2F80ED' }
    ];

    function showImage(index) {
        images.forEach(img => img.classList.remove('active'));
        images[index].classList.add('active');
        descriptionText.innerHTML = `<h3 style="--gradient-start: ${gradientColors[index].start}; --gradient-end: ${gradientColors[index].end};">${features[index].title}</h3><p>${features[index].description}</p>`;
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    });

    // Initialize the first image and description
    showImage(0);

    // Call the functions to create the dynamic elements
    createResourceCarousel();
    createIdeaGalaxy();

    // Remove these function definitions as they're not being used
    // createIdeaCollage();
    // createIdeaShowcase();

    // Add this new code for smooth scrolling to the features section
    const featuresLink = document.querySelector('nav ul li a[href="#features"]');
    const productShowcase = document.getElementById('product-showcase');

    featuresLink.addEventListener('click', (e) => {
        e.preventDefault();
        productShowcase.scrollIntoView({ behavior: 'smooth' });
    });
});

function createResourceCarousel() {
    const carousel = document.getElementById('resource-carousel');
    const resources = [
        'Videos', 'Podcasts', 'Tweets', 'Articles', 'Newsletters', 'Books', 'Research Papers',
        'Infographics', 'Webinars', 'Courses', 'Presentations', 'Case Studies', 'Whitepapers',
        'Interviews', 'Tutorials', 'Documentaries', 'TED Talks', 'Blogs', 'Forums', 'Q&A Threads'
    ];

    const colors = [
        'linear-gradient(45deg, #ff9a9e, #fad0c4)',
        'linear-gradient(45deg, #a1c4fd, #c2e9fb)',
        'linear-gradient(45deg, #ffecd2, #fcb69f)',
        'linear-gradient(45deg, #84fab0, #8fd3f4)',
        'linear-gradient(45deg, #d4fc79, #96e6a1)'
    ];

    let currentIndex = 0;

    function createItem(text, color) {
        const item = document.createElement('div');
        item.classList.add('resource-item');
        item.textContent = text;
        item.style.background = color;
        return item;
    }

    function updateCarousel() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            carousel.innerHTML = '';
            const newItem = createItem(resources[currentIndex], colors[currentIndex % colors.length]);
            carousel.appendChild(newItem);
            
            setTimeout(() => {
                newItem.style.opacity = '0';
                newItem.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % resources.length;
                    const nextItem = createItem(resources[currentIndex], colors[currentIndex % colors.length]);
                    nextItem.style.opacity = '0';
                    nextItem.style.transform = 'translateY(20px)';
                    carousel.appendChild(nextItem);
                    
                    setTimeout(() => {
                        carousel.removeChild(newItem);
                        nextItem.style.opacity = '1';
                        nextItem.style.transform = 'translateY(0)';
                    }, 50);
                }, 450);
            }, 2500);
        } else {
            // Desktop behavior remains the same
            carousel.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const index = (currentIndex + i) % resources.length;
                const newItem = createItem(resources[index], colors[i % colors.length]);
                carousel.appendChild(newItem);
            }
            currentIndex = (currentIndex + 1) % resources.length;
        }
    }

    updateCarousel();
    setInterval(updateCarousel, isMobile ? 3000 : 5000);

    window.addEventListener('resize', () => {
        clearInterval(carouselInterval);
        updateCarousel();
        carouselInterval = setInterval(updateCarousel, window.innerWidth <= 768 ? 3000 : 5000);
    });
}

function createIdeaGalaxy() {
    const galaxy = document.getElementById('idea-galaxy');
    const ideas = [
        { text: "Capture", icon: "💡" },
        { text: "Organize", icon: "🗂️" },
        { text: "Connect", icon: "🔗" },
        { text: "Inspire", icon: "✨" },
        { text: "Learn", icon: "🚀" },
        { text: "Grow", icon: "🌱" },
        { text: "Discover", icon: "🔍" },
        { text: "Create", icon: "🎨" }
    ];

    ideas.forEach((idea, index) => {
        const element = document.createElement('div');
        element.classList.add('idea-planet');
        element.innerHTML = `
            <span class="idea-icon">${idea.icon}</span>
            <p class="idea-text">${idea.text}</p>
        `;
        element.style.setProperty('--orbit-duration', `${20 + index * 5}s`);
        element.style.setProperty('--orbit-size', `${150 + index * 50}px`);
        galaxy.appendChild(element);
    });

    const centerSun = document.createElement('div');
    centerSun.classList.add('idea-sun');
    centerSun.textContent = "Your Ideas";
    galaxy.appendChild(centerSun);
}
