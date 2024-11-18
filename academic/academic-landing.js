document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe pain point items
    document.querySelectorAll('.pain-point-item').forEach((item, index) => {
        // Add staggered animation delay
        item.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(item);
    });

    // Hover effect for pain point items
    document.querySelectorAll('.pain-point-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            // Add hover class to siblings
            const siblings = [...item.parentElement.children];
            siblings.forEach(sibling => {
                if (sibling !== item) {
                    sibling.style.opacity = '0.5';
                }
            });
        });

        item.addEventListener('mouseleave', () => {
            // Remove hover class from siblings
            const siblings = [...item.parentElement.children];
            siblings.forEach(sibling => {
                sibling.style.opacity = '1';
            });
        });
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Stats counter animation
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            // Format the number based on size
            let displayValue;
            if (value >= 1000000) {
                displayValue = '1M+';
            } else if (value >= 1000) {
                displayValue = value.toLocaleString() + '+';
            } else {
                displayValue = value + '+';
            }
            
            element.textContent = displayValue;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Animate stats when they come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number[data-value]');
                statNumbers.forEach(stat => {
                    const endValue = parseInt(stat.dataset.value);
                    animateValue(stat, 0, endValue, 2000);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Add subtle parallax effect to pain points
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const painPoints = document.querySelectorAll('.pain-point-item');
                painPoints.forEach((point, index) => {
                    const rect = point.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        const scrollPercent = (window.innerHeight - rect.top) / window.innerHeight;
                        const translateX = Math.min(scrollPercent * 20, 20);
                        point.style.transform = `translateX(${translateX}px)`;
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    });

    // Add hover effect for pain point numbers
    document.querySelectorAll('.pain-point-number').forEach(number => {
        number.addEventListener('mouseenter', () => {
            number.style.transform = 'scale(1.2)';
            number.style.color = 'var(--neon-blue)';
        });

        number.addEventListener('mouseleave', () => {
            number.style.transform = 'scale(1)';
            number.style.color = '';
        });
    });

    // Auth Modal Functionality
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    const authForm = document.getElementById('authForm');
    const modalTitle = document.getElementById('modalTitle');
    const authSubmit = document.getElementById('authSubmit');
    const switchAuthLink = document.getElementById('switchAuthLink');
    const forgotPasswordElement = document.getElementById('forgotPassword');

    // Get all signup buttons
    const signupButtons = document.querySelectorAll('[id="signupBtn"]');
    signupButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(true);
        });
    });

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(false);
        });
    }

    function openModal(isSignup = true) {
        modal.style.display = 'block';
        modalTitle.textContent = isSignup ? 'Sign Up' : 'Log In';
        authSubmit.textContent = isSignup ? 'Sign Up' : 'Log In';
        switchAuthLink.textContent = isSignup ? 'Log in' : 'Sign up';
        forgotPasswordElement.style.display = isSignup ? 'none' : 'block';
    }

    // Close modal functionality
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Switch between login and signup
    switchAuthLink.onclick = (e) => {
        e.preventDefault();
        const isCurrentlySignup = modalTitle.textContent === 'Sign Up';
        openModal(!isCurrentlySignup);
    };

    // Handle form submission
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
            const errorElement = document.getElementById('authError');
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
    };

    // Add mobile menu functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('nav ul');

    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}); 