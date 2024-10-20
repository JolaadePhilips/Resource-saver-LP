document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Check if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("User is signed in:", user.uid);
            fetchUserData(user.uid);
        } else {
            console.log("No user is signed in.");
            window.location.href = 'index.html'; // Redirect to login page
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });

    const downloadExtensionBtn = document.getElementById('downloadExtensionBtn');
    const extensionInstructions = document.getElementById('extensionInstructions');

    downloadExtensionBtn.addEventListener('click', () => {
        extensionInstructions.classList.toggle('hidden');
        const icon = downloadExtensionBtn.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    });
});

function fetchUserData(userId) {
    console.log('Fetching user data for:', userId);
    const db = firebase.firestore();
    
    // Fetch user's resources
    db.collection('users').doc(userId).collection('resources').get()
        .then((querySnapshot) => {
            const resourceCount = querySnapshot.size;
            document.querySelector('#totalResources h2').textContent = resourceCount;

            const categories = {};
            const resourceTypes = {};

            querySnapshot.forEach((doc) => {
                const resource = doc.data();
                if (resource.category) {
                    categories[resource.category] = (categories[resource.category] || 0) + 1;
                }
                if (resource.type) {
                    resourceTypes[resource.type] = (resourceTypes[resource.type] || 0) + 1;
                }
            });

            updateTopCategory(categories);
            updateTopResourceType(resourceTypes);

            console.log("Dashboard updated with data:", {
                totalResources: resourceCount,
                categories,
                resourceTypes
            });

            // Fetch recent activity
            db.collection('users').doc(userId).collection('resources')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get()
                .then((querySnapshot) => {
                    updateRecentActivity(querySnapshot);
                });
        })
        .catch((error) => {
            console.error("Error fetching user data: ", error);
        });
}

function updateTopCategory(categories) {
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        document.querySelector('#topCategory h2').textContent = topCategory[0];
        document.querySelector('#topCategory .count').textContent = `(${topCategory[1]})`;
    }
}

function updateTopResourceType(resourceTypes) {
    const topType = Object.entries(resourceTypes).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
        document.querySelector('#topResourceType h2').textContent = topType[0];
        document.querySelector('#topResourceType .count').textContent = `(${topType[1]})`;
    }
}

function updateTopCollection(collections) {
    const topCollection = Object.entries(collections).sort((a, b) => b[1] - a[1])[0];
    if (topCollection) {
        document.querySelector('#topCollection h2').textContent = topCollection[0];
        document.querySelector('#topCollection .count').textContent = `(${topCollection[1]})`;
    }
}

function updateRecentActivity(querySnapshot) {
    const recentActivityList = document.getElementById('recentActivityList');
    recentActivityList.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const resource = doc.data();
        const li = document.createElement('li');
        li.textContent = `Added: ${resource.title}`;
        recentActivityList.appendChild(li);
    });
}

// Handle quick add form submission
const quickAddForm = document.getElementById('quickAddForm');
quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('resourceUrl').value;
    const title = document.getElementById('resourceTitle').value;
    // Add logic to save the new resource to Firebase
    // Then update the recent activity list
});
