// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser;
let currentView = 'grid';
let currentTab = 'resources';

// Check if user is logged in
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        console.log('User logged in:', currentUser);
        initializeTabs();
        fetchAndDisplayContent();
        populateFilters();
    } else {
        console.log('No user logged in');
        window.location.href = 'index.html'; // Redirect to login page
    }
});

// Initialize tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            currentTab = tab.getAttribute('data-tab');
            if (currentTab === 'notes') {
                currentNotesPage = 1; // Reset to first page when switching to notes tab
            }
            updateActiveTab();
            fetchAndDisplayContent();
        });
    });
}

function updateActiveTab() {
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === currentTab) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function fetchAndDisplayContent() {
    const contentArea = document.getElementById('contentArea');
    const notesSection = document.getElementById('notesSection');
    const paginationContainer = document.getElementById('pagination');

    // Hide pagination by default
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }

    switch (currentTab) {
        case 'resources':
            contentArea.style.display = 'grid';
            notesSection.style.display = 'none';
            // Show pagination only for resources tab
            if (paginationContainer) {
                paginationContainer.style.display = 'flex';
            }
            fetchAndDisplayResources();
            break;
        case 'notes':
            contentArea.style.display = 'none';
            notesSection.style.display = 'block';
            fetchAndDisplayNotes();
            break;
        case 'collections':
            contentArea.style.display = 'block';
            notesSection.style.display = 'none';
            fetchAndDisplayCollections();
            break;
        case 'favorites':
            contentArea.style.display = 'grid';
            notesSection.style.display = 'none';
            fetchAndDisplayFavorites();
            break;
        case 'statistics':
            contentArea.style.display = 'block';
            notesSection.style.display = 'none';
            fetchAndDisplayStatistics();
            break;
        case 'learning-paths':
            contentArea.style.display = 'block';
            notesSection.style.display = 'none';
            fetchAndDisplayLearningPaths();
            break;
        case 'recent':
            contentArea.style.display = 'block';
            notesSection.style.display = 'none';
            fetchAndDisplayRecentActivity();
            break;
        case 'knowledge-paths':
            contentArea.style.display = 'none';
            notesSection.style.display = 'none';
            const knowledgePathsSection = document.getElementById('knowledgePathsSection');
            if (knowledgePathsSection) {
                knowledgePathsSection.style.display = 'block';
                // Initialize knowledge paths if not already initialized
                if (window.knowledgePath) {
                    window.knowledgePath.loadPaths();
                } else {
                    window.knowledgePath = new KnowledgePath();
                }
            }
            break;
    }
}

const RESOURCES_PER_PAGE = 15;
let currentPage = 1;
let totalPages = 1;

function fetchAndDisplayResources() {
    if (!currentUser) return;

    const resourcesRef = db.collection('users').doc(currentUser.uid).collection('resources');
    resourcesRef.get().then((querySnapshot) => {
        const resources = [];
        querySnapshot.forEach((doc) => {
            resources.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort resources by createdAt timestamp (newest first)
        resources.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const timeB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return timeB - timeA; // Descending order (newest first)
        });
        
        totalPages = Math.ceil(resources.length / RESOURCES_PER_PAGE);
        const startIndex = (currentPage - 1) * RESOURCES_PER_PAGE;
        const endIndex = startIndex + RESOURCES_PER_PAGE;
        const paginatedResources = resources.slice(startIndex, endIndex);
        
        filterAndDisplayResources(paginatedResources);
        displayPagination();
    }).catch((error) => {
        console.error("Error fetching resources: ", error);
    });
}

function displayPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.add('pagination-button');
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                fetchAndDisplayResources();
            });
            paginationContainer.appendChild(pageButton);
        }
    }
}

function filterAndDisplayResources(resources) {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filteredResources = resources.filter(resource => {
        const matchesSearch = searchInput === '' || 
            resource.title.toLowerCase().includes(searchInput) || 
            (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchInput)));
        const matchesCategory = !categoryFilter || resource.category === categoryFilter;
        const matchesType = !typeFilter || resource.type === typeFilter;
        const matchesStatus = !statusFilter || resource.status === statusFilter;

        return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });

    displayResources(filteredResources);
}

// Display resources
function displayResources(resources) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '';
    contentArea.className = `content-area ${currentView}-view`;

    resources.forEach((resource) => {
        const resourceCard = document.createElement('div');
        resourceCard.classList.add('resource-card');

        resourceCard.innerHTML = `
            <h3><a href="${resource.url}" target="_blank" title="${resource.title || 'Untitled'}">${resource.title || 'Untitled'}</a></h3>
            <p>${resource.tags ? resource.tags.join(', ') : 'No tags'}</p>
            <div class="resource-meta">
                <span>${resource.category || 'Uncategorized'}</span>
                <span>${resource.type || 'Unspecified'}</span>
                <span>${resource.status === 'read' ? 'Read' : 'Unread'}</span>
            </div>
            <div class="resource-actions">
                <button class="edit-resource" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="add-note" title="Add Note"><i class="fas fa-sticky-note"></i></button>
                <button class="add-to-collection" title="Add to Collection"><i class="fas fa-folder-plus"></i></button>
                <button class="toggle-read" title="Toggle Read Status"><i class="fas fa-book${resource.status === 'read' ? '-open' : ''} ${resource.status === 'read' ? 'active' : ''}"></i></button>
                <button class="toggle-favorite" title="Toggle Favorite"><i class="fas fa-star ${resource.favorite ? 'active' : ''}"></i></button>
                <button class="share-resource" title="Share Resource"><i class="fas fa-share-alt"></i></button>
                <button class="delete-resource" title="Delete Resource"><i class="fas fa-trash"></i></button>
            </div>
        `;

        contentArea.appendChild(resourceCard);

        // Add event listeners for the action buttons
        resourceCard.querySelector('.edit-resource').addEventListener('click', () => editResource(resource.id, resource));
        resourceCard.querySelector('.add-note').addEventListener('click', () => addNote(resource.id, resource));
        resourceCard.querySelector('.add-to-collection').addEventListener('click', () => addToCollection(resource.id, resource));
        resourceCard.querySelector('.toggle-read').addEventListener('click', () => toggleReadStatus(resource.id, resource));
        resourceCard.querySelector('.toggle-favorite').addEventListener('click', () => toggleFavorite(resource.id, resource));
        resourceCard.querySelector('.share-resource').addEventListener('click', () => shareResource(resource.id, resource));
        resourceCard.querySelector('.delete-resource').addEventListener('click', () => deleteResource(resource.id, resource));

        const title = resourceCard.querySelector('h3');
        if (!resource.tags || resource.tags.length === 0) {
            title.classList.add('multi-line');
        }
    });
}

// Function to edit a resource
function editResource(resourceId, resource) {
    const modal = document.getElementById('editResourceModal');
    const titleInput = document.getElementById('editResourceTitle');
    const urlInput = document.getElementById('editResourceUrl');
    const tagsInput = document.getElementById('editResourceTags');
    const categorySelect = document.getElementById('editResourceCategory');
    const typeSelect = document.getElementById('editResourceType');

    // Populate the form with the resource data
    titleInput.value = resource.title || '';
    urlInput.value = resource.url || '';
    tagsInput.value = resource.tags ? resource.tags.join(', ') : '';

    // Populate category and type dropdowns
    populateCategoryAndTypeDropdowns(resource.category, resource.type);

    // Show the modal
    modal.style.display = 'block';

    // Handle save button click
    document.getElementById('saveEditedResource').onclick = function() {
        const updatedResource = {
            title: titleInput.value,
            url: urlInput.value,
            tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            category: categorySelect.value,
            type: typeSelect.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).update(updatedResource)
            .then(() => {
                console.log('Resource updated successfully');
                modal.style.display = 'none';
                fetchAndDisplayResources();
            })
            .catch((error) => {
                console.error('Error updating resource:', error);
                alert('Failed to update resource. Please try again.');
            });
    };
}

// Function to populate category and type dropdowns
function populateCategoryAndTypeDropdowns(selectedCategory = '', selectedType = '') {
    const categorySelects = document.querySelectorAll('#editResourceCategory, #newResourceCategory');
    const typeSelects = document.querySelectorAll('#editResourceType, #newResourceType');

    db.collection('users').doc(currentUser.uid).collection('resources').get()
        .then((querySnapshot) => {
            const categories = new Set();
            const types = new Set();

            querySnapshot.forEach((doc) => {
                const resource = doc.data();
                if (resource.category) categories.add(resource.category);
                if (resource.type) types.add(resource.type);
            });

            // Populate category dropdowns
            categorySelects.forEach(select => {
                select.innerHTML = '<option value="">Select a category</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    if (category === selectedCategory) option.selected = true;
                    select.appendChild(option);
                });
            });

            // Populate type dropdowns
            typeSelects.forEach(select => {
                select.innerHTML = '<option value="">Select a type</option>';
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    if (type === selectedType) option.selected = true;
                    select.appendChild(option);
                });
            });
        })
        .catch((error) => {
            console.error('Error fetching categories and types:', error);
        });
}

// Function to add a resource to a collection
function addToCollection(resourceId, resource) {
    const modal = document.getElementById('collectionModal');
    const collectionSelect = document.getElementById('collectionSelect');
    const newCollectionName = document.getElementById('newCollectionName');
    const addToCollectionBtn = document.getElementById('addToCollection');

    modal.style.display = 'flex'; // Change this from 'block' to 'flex'

    // Populate existing collections
    db.collection('users').doc(currentUser.uid).collection('collections').get()
        .then((querySnapshot) => {
            collectionSelect.innerHTML = '<option value="">Select a collection</option>';
            querySnapshot.forEach((doc) => {
                const collection = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = collection.name;
                collectionSelect.appendChild(option);
            });
        });

    addToCollectionBtn.onclick = function() {
        let collectionRef;
        if (collectionSelect.value) {
            collectionRef = db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionSelect.value);
        } else if (newCollectionName.value) {
            // Check if collection already exists
            db.collection('users').doc(currentUser.uid).collection('collections')
                .where('name', '==', newCollectionName.value.trim())
                .get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        // Collection exists, use existing reference
                        collectionRef = querySnapshot.docs[0].ref;
                    } else {
                        // Create new collection
                        collectionRef = db.collection('users').doc(currentUser.uid).collection('collections').doc();
                    }
                    
                    // Continue with adding resource to collection
                    return collectionRef.set({
                        name: newCollectionName.value.trim(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        resources: firebase.firestore.FieldValue.arrayUnion(resourceId)
                    }, { merge: true });
                })
                .then(() => {
                    console.log('Resource added to collection successfully');
                    closeAllModals();
                    newCollectionName.value = '';
                    
                    // Clear and refresh collections once
                    const collectionsGrid = document.querySelector('.collections-container');
                    if (collectionsGrid) {
                        collectionsGrid.innerHTML = '';
                        fetchAndDisplayCollections();
                    }
                })
                .catch((error) => {
                    console.error('Error adding resource to collection: ', error);
                    alert('Failed to add resource to collection. Please try again.');
                });
                return; // Exit early to prevent duplicate creation
        } else {
            console.error('No collection selected or created');
            return;
        }
        
        // Only execute this for existing collections
        if (collectionRef) {
            collectionRef.set({
                name: newCollectionName.value || collectionSelect.options[collectionSelect.selectedIndex].text,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                resources: firebase.firestore.FieldValue.arrayUnion(resourceId)
            }, { merge: true })
            .then(() => {
                console.log('Resource added to collection successfully');
                closeAllModals();
                newCollectionName.value = '';
                
                // Clear and refresh collections once
                const collectionsGrid = document.querySelector('.collections-container');
                if (collectionsGrid) {
                    collectionsGrid.innerHTML = '';
                    fetchAndDisplayCollections();
                }
            })
            .catch((error) => {
                console.error('Error adding resource to collection: ', error);
                alert('Failed to add resource to collection. Please try again.');
            });
        }
    };

    // Close the modal when clicking on <span> (x)
    modal.querySelector('.close').onclick = closeAllModals;

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            closeAllModals();
        }
    };
}

// Function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Add these simple event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Close button handlers
    const closeButtons = document.querySelectorAll('.modal .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Click outside modal handler
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    };
});

// Function to toggle the read status of a resource
function toggleReadStatus(resourceId, resource) {
    const newStatus = resource.status === 'read' ? 'unread' : 'read';
    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).update({
        status: newStatus
    }).then(() => {
        console.log('Read status updated');
        fetchAndDisplayResources();
    }).catch((error) => {
        console.error('Error updating read status:', error);
    });
}

// Function to toggle the favorite status of a resource
function toggleFavorite(resourceId, resource) {
    const newFavoriteStatus = !resource.favorite;
    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).update({
        favorite: newFavoriteStatus
    }).then(() => {
        console.log('Favorite status updated');
        fetchAndDisplayResources();
    }).catch((error) => {
        console.error('Error updating favorite status:', error);
    });
}

// Populate filter options
function populateFilters() {
    if (!currentUser) return;

    const resourcesRef = db.collection('users').doc(currentUser.uid).collection('resources');

    resourcesRef.get().then((querySnapshot) => {
        const categories = new Set();
        const types = new Set();

        querySnapshot.forEach((doc) => {
            const resource = doc.data();
            if (resource.category) categories.add(resource.category);
            if (resource.type) types.add(resource.type);
        });

        const categoryFilter = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        const typeFilter = document.getElementById('typeFilter');
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    closeAllModals();
    fetchAndDisplayResources();

    // Add existing event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        currentPage = 1;
        fetchAndDisplayResources();
    }, 300));

    document.getElementById('searchBtn').addEventListener('click', () => {
        currentPage = 1;
        fetchAndDisplayResources();
    });

    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        fetchAndDisplayResources();
    });

    document.getElementById('typeFilter').addEventListener('change', () => {
        currentPage = 1;
        fetchAndDisplayResources();
    });

    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        fetchAndDisplayResources();
    });

    document.getElementById('addResourceBtnTop').addEventListener('click', showAddResourceModal);
    // Remove this line
    // document.getElementById('addResourceBtn').addEventListener('click', showAddResourceModal);

    // Close edit resource modal when clicking on the close button or outside the modal
    document.querySelector('#editResourceModal .close').addEventListener('click', () => {
        document.getElementById('editResourceModal').style.display = 'none';
    });

    window.onclick = function(event) {
        if (event.target == document.getElementById('editResourceModal')) {
            document.getElementById('editResourceModal').style.display = 'none';
        }
    };

    // Add event listener for create learning path button
    const createLearningPathBtn = document.getElementById('createLearningPathBtn');
    if (createLearningPathBtn) {
        createLearningPathBtn.addEventListener('click', function() {
            const modal = document.getElementById('learningPathModal');
            if (modal) {
                modal.style.display = 'block';
            }
        });
    }

    // Add form submission handler
    const learningPathForm = document.getElementById('learningPathForm');
    if (learningPathForm) {
        learningPathForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewLearningPath();
        });
    }

    // Add these new event listeners for feedback functionality
    const feedbackButton = document.getElementById('feedbackButton');
    const feedbackDialog = document.getElementById('feedbackDialog');
    const closeFeedback = document.querySelector('.close-feedback');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const submitFeedback = document.getElementById('submitFeedback');
    const feedbackTypeButtons = document.querySelectorAll('.feedback-type-btn');

    function toggleFeedbackDialog() {
        feedbackDialog.classList.toggle('active');
    }

    function closeFeedbackDialog() {
        feedbackDialog.classList.remove('active');
        // Reset form
        document.getElementById('feedbackText').value = '';
        feedbackTypeButtons.forEach(btn => btn.classList.remove('active'));
        feedbackTypeButtons[0].classList.add('active');
    }

    feedbackButton.addEventListener('click', toggleFeedbackDialog);
    closeFeedback.addEventListener('click', closeFeedbackDialog);
    cancelFeedback.addEventListener('click', closeFeedbackDialog);

    // Handle feedback type selection
    feedbackTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            feedbackTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Modify the feedback submission handler
    submitFeedback.addEventListener('click', () => {
        const feedbackType = document.querySelector('.feedback-type-btn.active').dataset.type;
        const feedbackText = document.getElementById('feedbackText').value;

        if (feedbackText.trim() === '') {
            alert('Please enter your feedback before submitting.');
            return;
        }

        // Create feedback object
        const feedback = {
            type: feedbackType,
            text: feedbackText,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'new' // Can be used for tracking feedback status (new, reviewed, resolved, etc.)
        };

        // Save to Firebase
        db.collection('feedback').add(feedback)
            .then(() => {
                console.log('Feedback saved to Firebase');
                alert('Thank you for your feedback!');
                closeFeedbackDialog();
            })
            .catch((error) => {
                console.error('Error saving feedback:', error);
                alert('Failed to submit feedback. Please try again.');
            });
    });

    // Close dialog when clicking outside
    window.addEventListener('click', (e) => {
        if (feedbackDialog.classList.contains('active') && 
            !feedbackDialog.contains(e.target) && 
            !feedbackButton.contains(e.target)) {
            closeFeedbackDialog();
        }
    });
});

document.getElementById('gridViewBtn').addEventListener('click', () => {
    currentView = 'grid';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    fetchAndDisplayResources();
});

document.getElementById('listViewBtn').addEventListener('click', () => {
    currentView = 'list';
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    fetchAndDisplayResources();
});

document.getElementById('toggleThemeBtn').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const icon = document.querySelector('#toggleThemeBtn i');
    if (document.body.classList.contains('light-mode')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});

// Convert resource titles and descriptions to searchable terms
function createSearchTerms(resource) {
    const terms = [];
    if (resource.title) terms.push(...resource.title.toLowerCase().split(' '));
    if (resource.description) terms.push(...resource.description.toLowerCase().split(' '));
    if (resource.category) terms.push(resource.category.toLowerCase());
    if (resource.type) terms.push(resource.type.toLowerCase());
    return [...new Set(terms)]; // Remove duplicates
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
});



// Add these functions to handle the notes functionality

const NOTES_PER_PAGE = 6;
let currentNotesPage = 1;
let allNotes = [];

function fetchAndDisplayNotes() {
    db.collection('users').doc(currentUser.uid).collection('notes')
        .orderBy('updatedAt', 'desc')
        .get()
        .then((querySnapshot) => {
            allNotes = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            currentNotesPage = 1; // Ensure we start on the first page
            displayNotes();
        })
        .catch((error) => {
            console.error("Error fetching notes: ", error);
        });
}

function displayNotes() {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    const pinnedNotes = allNotes.filter(note => note.pinned);
    const unpinnedNotes = allNotes.filter(note => !note.pinned);
    const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

    const startIndex = (currentNotesPage - 1) * NOTES_PER_PAGE;
    const endIndex = startIndex + NOTES_PER_PAGE;
    const notesToDisplay = sortedNotes.slice(startIndex, endIndex);

    notesToDisplay.forEach((note) => {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        if (note.pinned) noteCard.classList.add('pinned');
        
        const excerpt = getExcerpt(note.content, 100);
        const updatedDate = note.updatedAt ? note.updatedAt.toDate().toLocaleDateString() : 'N/A';
        
        noteCard.innerHTML = `
            <h3>${note.resourceTitle}</h3>
            <p class="note-excerpt">${excerpt}</p>
            <div class="note-meta">
                Last updated: ${updatedDate}
            </div>
        `;
        
        noteCard.addEventListener('click', () => openNoteEditor(note));
        notesList.appendChild(noteCard);
    });

    updateNotesPagination();
}

function getExcerpt(content, maxLength) {
    // Remove any HTML tags from the content
    const plainText = content.replace(/<[^>]+>/g, '');
    if (plainText.length <= maxLength) {
        return plainText;
    }
    return plainText.substr(0, maxLength) + '...';
}

function updateNotesPagination() {
    const paginationContainer = document.getElementById('notesPagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(allNotes.length / NOTES_PER_PAGE);

    // Add "Previous" button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.classList.add('pagination-button');
    prevButton.disabled = currentNotesPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentNotesPage > 1) {
            currentNotesPage--;
            displayNotes();
        }
    });
    paginationContainer.appendChild(prevButton);

    // Add page number indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.textContent = `Page ${currentNotesPage} of ${totalPages}`;
    pageIndicator.classList.add('page-indicator');
    paginationContainer.appendChild(pageIndicator);

    // Add "Next" button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.classList.add('pagination-button');
    nextButton.disabled = currentNotesPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentNotesPage < totalPages) {
            currentNotesPage++;
            displayNotes();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Modify the event listener for the notes tab
document.querySelector('[data-tab="notes"]').addEventListener('click', (e) => {
    e.preventDefault();
    // Your existing code to show the notes section
    // ...
    fetchAndDisplayNotes(); // This will now apply pagination immediately
});

let quill; // Declare quill as a global variable

function initializeQuillEditor() {
    quill = new Quill('#noteEditorContent', {
        theme: 'snow',
        modules: {
            toolbar: '#noteEditorToolbar'
        }
    });

    // Add share button functionality
    const shareNoteBtn = document.getElementById('shareNote');
    if (shareNoteBtn) {
        shareNoteBtn.addEventListener('click', () => {
            const noteContent = quill.root.innerHTML;
            const noteTitle = document.getElementById('noteEditorTitle').textContent;
            const resourceTitle = document.getElementById('noteResourceTitle').textContent;
            const resourceLink = document.getElementById('noteResourceLink').href;
            
            const note = {
                content: noteContent,
                resourceTitle: resourceTitle,
                url: resourceLink,
                title: noteTitle
            };
            
            // Use the existing shareResource function
            shareResource(null, note);
        });
    }
}

// Remove the imageHandler function as it's no longer needed

async function uploadImage(file) {
    // Implement your image upload logic here
    // This could involve uploading to Firebase Storage or another service
    // Return the URL of the uploaded image
    // For now, we'll just return a placeholder URL
    return 'https://via.placeholder.com/150';
}

let currentNote;

function openNoteEditor(note) {
    currentNote = note;
    const editorSection = document.getElementById('noteEditorSection');
    const editorTitle = document.getElementById('noteEditorTitle');
    const resourceTitle = document.getElementById('noteResourceTitle');
    const resourceLink = document.getElementById('noteResourceLink');

    editorTitle.textContent = 'Edit Note';
    resourceTitle.textContent = note.resourceTitle;
    resourceLink.href = note.resourceUrl;

    if (!quill) {
        initializeQuillEditor();
    }
    quill.root.innerHTML = note.content;

    editorSection.classList.add('active');

    document.getElementById('closeNoteEditor').onclick = closeNoteEditor;
    document.getElementById('pinNote').onclick = togglePinNote;
    document.getElementById('deleteNote').onclick = () => deleteNote(note.id);
    document.getElementById('saveNoteChanges').onclick = () => saveNoteChanges(note.id);
    document.getElementById('discardNoteChanges').onclick = closeNoteEditor;

    updateWordCount();
    updatePinButton();

    quill.on('text-change', updateWordCount);
}

function closeNoteEditor() {
    const editorSection = document.getElementById('noteEditorSection');
    editorSection.classList.remove('active');
    currentNote = null;
    quill.off('text-change', updateWordCount);
}

// Make sure this function is defined in the global scope
window.closeNoteEditor = closeNoteEditor;

function saveNoteChanges(noteId) {
    const newContent = quill.root.innerHTML;
    
    db.collection('users').doc(currentUser.uid).collection('notes').doc(noteId).update({
        content: newContent,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        pinned: currentNote.pinned
    })
    .then(() => {
        console.log('Note updated successfully');
        closeNoteEditor();
        fetchAndDisplayNotes();
    })
    .catch((error) => {
        console.error('Error updating note:', error);
        alert('Failed to update note. Please try again.');
    });
}

function updateWordCount() {
    const text = quill.getText();
    const wordCount = text.trim().split(/\s+/).length;
    document.getElementById('wordCount').textContent = `Words: ${wordCount}`;
}

function togglePinNote() {
    currentNote.pinned = !currentNote.pinned;
    updatePinButton();
    saveNoteChanges(currentNote.id);
}

function updatePinButton() {
    const pinButton = document.getElementById('pinNote');
    if (currentNote.pinned) {
        pinButton.classList.add('pinned');
        pinButton.title = 'Unpin Note';
    } else {
        pinButton.classList.remove('pinned');
        pinButton.title = 'Pin Note';
    }
}

// Make sure to call initializeQuillEditor when the page loads
document.addEventListener('DOMContentLoaded', initializeQuillEditor);

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        db.collection('users').doc(currentUser.uid).collection('notes').doc(noteId).delete()
            .then(() => {
                console.log('Note deleted successfully');
                fetchAndDisplayNotes();
            })
            .catch((error) => {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            });
    }
}

// Add event listener for the search functionality
document.getElementById('notesSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const noteCards = document.querySelectorAll('.note-card');
    noteCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('p').textContent.toLowerCase();
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Function to display collections and their resources
function viewCollection(collectionId) {
    const collectionCard = document.querySelector(`[data-id="${collectionId}"]`).closest('.collection-card');
    const existingExpanded = document.querySelector('.collection-expanded');
    
    // If clicking the same collection that's already expanded, collapse it
    if (existingExpanded && existingExpanded.previousElementSibling === collectionCard) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300); // Remove after animation
        return;
    }

    // Remove any existing expanded section
    if (existingExpanded) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300);
    }

    // Create new expanded section
    const expandedSection = document.createElement('div');
    expandedSection.className = 'collection-expanded';
    
    expandedSection.innerHTML = `
        <div class="collection-resources">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <button class="btn-icon collapse-collection" title="Collapse">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="resources-list"></div>
        </div>
    `;

    // Insert after the collection card
    collectionCard.insertAdjacentElement('afterend', expandedSection);
    
    // Add collapse button listener
    expandedSection.querySelector('.collapse-collection').addEventListener('click', () => {
        expandedSection.classList.remove('active');
        setTimeout(() => expandedSection.remove(), 300);
    });

    // Trigger animation after a brief delay
    setTimeout(() => expandedSection.classList.add('active'), 50);

    // Populate resources
    const resourcesList = expandedSection.querySelector('.resources-list');
    db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).get()
        .then((doc) => {
            const collection = doc.data();
            if (collection.resources && collection.resources.length > 0) {
                collection.resources.forEach(resourceId => {
                    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).get()
                        .then((resourceDoc) => {
                            if (resourceDoc.exists) {
                                const resource = resourceDoc.data();
                                const resourceElement = document.createElement('div');
                                resourceElement.className = 'resource-item';
                                resourceElement.draggable = true;
                                resourceElement.dataset.resourceId = resourceId;
                                resourceElement.innerHTML = `
                                    <div class="resource-drag-handle">
                                        <i class="fas fa-grip-vertical"></i>
                                    </div>
                                    <h4><a href="${resource.url}" target="_blank">${resource.title}</a></h4>
                                    <div class="resource-actions">
                                        <button class="remove-from-collection" data-id="${resourceId}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `;
                                resourcesList.appendChild(resourceElement);

                                // Add drag event listeners
                                resourceElement.addEventListener('dragstart', (e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        resourceId: resourceId,
                                        sourceCollectionId: collectionId
                                    }));
                                    resourceElement.classList.add('dragging');
                                });

                                resourceElement.addEventListener('dragend', () => {
                                    resourceElement.classList.remove('dragging');
                                    document.querySelectorAll('.collection-card').forEach(card => {
                                        card.classList.remove('drag-over');
                                    });
                                });

                                resourceElement.querySelector('.remove-from-collection').addEventListener('click', () => 
                                    removeFromCollection(collectionId, resourceId));
                            }
                        });
                });
            } else {
                resourcesList.innerHTML = '<p class="no-resources">No resources in this collection yet.</p>';
            }
        });
}

function fetchAndDisplayCollections() {
    const contentArea = document.getElementById('contentArea');

    // Clear existing content and set up the collections section
    contentArea.innerHTML = `
        <div class="collections-section">
            <div class="collections-header">
                <h2>My Collections</h2>
            <button id="createCollectionBtn" class="btn-primary">
                    <i class="fas fa-plus"></i> Create Collection
            </button>
        </div>
            <div class="collections-list"></div>
        </div>
    `;

    const collectionsList = document.querySelector('.collections-list');

    // Fetch collections
    db.collection('users').doc(currentUser.uid).collection('collections')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                collectionsList.innerHTML = '<p class="no-collections">No collections yet. Create your first collection!</p>';
                return;
            }

            // Create a fragment for better performance
            const fragment = document.createDocumentFragment();

            querySnapshot.forEach((doc) => {
                const collection = doc.data();
                const collectionCard = document.createElement('div');
                collectionCard.className = 'collection-card';
                
                const resourceCount = collection.resources ? collection.resources.length : 0;
                const lastUpdated = collection.updatedAt ? new Date(collection.updatedAt.toDate()).toLocaleDateString() : 'Never';
                
                collectionCard.innerHTML = `
                    <div class="collection-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="collection-content">
                        <h3>${collection.name || 'Unnamed Collection'}</h3>
    
                        <div class="collection-meta">
                            <span><i class="fas fa-bookmark"></i> ${resourceCount} resources</span>
                            <span><i class="fas fa-clock"></i> Last updated: ${lastUpdated}</span>
                        </div>
                    </div>
                    <div class="collection-actions">
                        <button class="view-collection" data-id="${doc.id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="edit-collection" data-id="${doc.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-collection" data-id="${doc.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                // Add event listeners
                const viewBtn = collectionCard.querySelector('.view-collection');
                const editBtn = collectionCard.querySelector('.edit-collection');
                const deleteBtn = collectionCard.querySelector('.delete-collection');
                
                viewBtn.addEventListener('click', () => viewCollection(doc.id));
                editBtn.addEventListener('click', () => editCollection(doc.id));
                deleteBtn.addEventListener('click', () => deleteCollection(doc.id));

                // Add drop zone functionality
                collectionCard.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    collectionCard.classList.add('drag-over');
                });

                collectionCard.addEventListener('dragleave', () => {
                    collectionCard.classList.remove('drag-over');
                });

                collectionCard.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    collectionCard.classList.remove('drag-over');
                    
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        const targetCollectionId = doc.id;
                        
                        if (data.sourceCollectionId === targetCollectionId) return;

                        // Remove from source collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(data.sourceCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayRemove(data.resourceId)
                            });

                        // Add to target collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(targetCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayUnion(data.resourceId)
                            });

                        // Refresh both collections
                        viewCollection(data.sourceCollectionId);
                        viewCollection(targetCollectionId);
                        
                        console.log('Resource moved successfully');
                    } catch (error) {
                        console.error('Error moving resource:', error);
                        alert('Failed to move resource. Please try again.');
                    }
                });

                fragment.appendChild(collectionCard);
            });

            // Append all cards at once
            collectionsList.appendChild(fragment);
        })
        .catch((error) => {
            console.error("Error fetching collections: ", error);
            collectionsList.innerHTML = '<p class="error-message">Error loading collections. Please try again.</p>';
        });

    // Add event listener for create collection button
    const createCollectionBtn = document.getElementById('createCollectionBtn');
    if (createCollectionBtn) {
        const newBtn = createCollectionBtn.cloneNode(true);
        createCollectionBtn.parentNode.replaceChild(newBtn, createCollectionBtn);
        
        newBtn.addEventListener('click', () => {
            const modal = document.getElementById('collectionModal');
            modal.style.display = 'block';
            document.getElementById('newCollectionName').value = '';
            modal.querySelector('h2').textContent = 'Create New Collection';
            document.getElementById('addToCollection').textContent = 'Create Collection';
        });
    }
}

// Update the event listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...

    document.getElementById('addNewNoteBtn').addEventListener('click', addNewNote);

    // ... rest of the code ...
});

function editNote(noteId, note) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Note</h2>
            <textarea id="editNoteContent" rows="6">${note.content}</textarea>
            <button id="saveEditedNote">Save Changes</button>
            <button id="cancelEditNote">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('saveEditedNote').onclick = function() {
        const newContent = document.getElementById('editNoteContent').value.trim();
        if (newContent) {
            db.collection('users').doc(currentUser.uid).collection('notes').doc(noteId).update({
                content: newContent,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('Note updated successfully');
                document.body.removeChild(modal);
                fetchAndDisplayNotes();
            }).catch((error) => {
                console.error('Error updating note:', error);
                alert('Failed to update note. Please try again.');
            });
        }
    };

    document.getElementById('cancelEditNote').onclick = function() {
        document.body.removeChild(modal);
    };
}

function shareNote(note) {
    const shareModal = document.getElementById('shareModal');
    const closeBtn = shareModal.querySelector('.close');
    const shareUrl = note.url || window.location.href;
    
    // Use getExcerpt to clean the content and create a preview
    const cleanContent = getExcerpt(note.content, 500); // Increased length for sharing
    
    // Create a share message with clean text
    const shareMessage = `Check out this note about "${note.resourceTitle}"\n\n${cleanContent}\n\nShared via Resource Saver Pro - Your Personal Knowledge Hub`;
    
    // Show the modal
    shareModal.style.display = 'block';

    // Handle share button clicks
    const shareButtons = {
        'shareEmail': () => {
            window.location.href = `mailto:?subject=Note: ${encodeURIComponent(note.resourceTitle)}&body=${encodeURIComponent(shareMessage)}`;
        },
        'shareTwitter': () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareFacebook': () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareWhatsApp': () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareLinkedIn': () => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareIMessage': () => {
            window.location.href = `sms:&body=${encodeURIComponent(shareMessage)}`;
        },
        'shareTelegram': () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareSlack': () => {
            window.open(`https://slack.com/share?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareCopyLink': () => {
            navigator.clipboard.writeText(shareMessage).then(() => {
                alert('Note content and link copied to clipboard!');
            }).catch(console.error);
        }
    };

    // Add click events to share buttons
    Object.keys(shareButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                shareButtons[buttonId]();
            });
        }
    });

    // Close modal functionality
    closeBtn.onclick = () => shareModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == shareModal) {
            shareModal.style.display = 'none';
        }
    };

    // Web Share API
    if (navigator.share) {
        navigator.share({
            title: note.resourceTitle,
            text: note.content.substring(0, 100) + '...',
            url: shareUrl
        }).then(() => {
            console.log('Shared successfully');
        }).catch(console.error);
    }

    // Email
    document.getElementById('shareEmail').onclick = () => {
        const subject = encodeURIComponent(note.resourceTitle);
        const body = encodeURIComponent(`Check out this note: ${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    // Twitter
    document.getElementById('shareTwitter').onclick = () => {
        const text = encodeURIComponent(`Check out this note: ${note.resourceTitle}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
    };

    // Facebook
    document.getElementById('shareFacebook').onclick = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
    };

    // WhatsApp
    document.getElementById('shareWhatsApp').onclick = () => {
        const text = encodeURIComponent(`Check out this note: ${note.resourceTitle} ${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`);
    };

    // LinkedIn
    document.getElementById('shareLinkedIn').onclick = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
    };

    // Copy Link
    document.getElementById('shareCopyLink').onclick = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copied to clipboard!');
        }).catch(console.error);
    };
}

// Add this function to fetch and display collections
function fetchAndDisplayCollections() {
    const contentArea = document.getElementById('contentArea');
    
    // Clear existing content and set up the collections section
    contentArea.innerHTML = `
        <div class="collections-section">
            <div class="collections-header">
                <h2>My Collections</h2>
                <button id="createCollectionBtn" class="btn-primary">
                    <i class="fas fa-plus"></i> Create Collection
                </button>
            </div>
            <div class="collections-list"></div>
        </div>
    `;

    const collectionsList = document.querySelector('.collections-list');

    // Fetch collections
    db.collection('users').doc(currentUser.uid).collection('collections')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                collectionsList.innerHTML = '<p class="no-collections">No collections yet. Create your first collection!</p>';
                return;
            }

            // Create a fragment for better performance
            const fragment = document.createDocumentFragment();

            querySnapshot.forEach((doc) => {
                const collection = doc.data();
                const collectionCard = document.createElement('div');
                collectionCard.className = 'collection-card';
                
                const resourceCount = collection.resources ? collection.resources.length : 0;
                const lastUpdated = collection.updatedAt ? new Date(collection.updatedAt.toDate()).toLocaleDateString() : 'Never';
                
                collectionCard.innerHTML = `
                    <div class="collection-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="collection-content">
                        <h3>${collection.name || 'Unnamed Collection'}</h3>
    
                        <div class="collection-meta">
                            <span><i class="fas fa-bookmark"></i> ${resourceCount} resources</span>
                            <span><i class="fas fa-clock"></i> Last updated: ${lastUpdated}</span>
                        </div>
                    </div>
                    <div class="collection-actions">
                        <button class="view-collection" data-id="${doc.id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="edit-collection" data-id="${doc.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-collection" data-id="${doc.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                // Add event listeners
                const viewBtn = collectionCard.querySelector('.view-collection');
                const editBtn = collectionCard.querySelector('.edit-collection');
                const deleteBtn = collectionCard.querySelector('.delete-collection');
                
                viewBtn.addEventListener('click', () => viewCollection(doc.id));
                editBtn.addEventListener('click', () => editCollection(doc.id));
                deleteBtn.addEventListener('click', () => deleteCollection(doc.id));

                // Add drop zone functionality
                collectionCard.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    collectionCard.classList.add('drag-over');
                });

                collectionCard.addEventListener('dragleave', () => {
                    collectionCard.classList.remove('drag-over');
                });

                collectionCard.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    collectionCard.classList.remove('drag-over');
                    
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        const targetCollectionId = doc.id;
                        
                        if (data.sourceCollectionId === targetCollectionId) return;

                        // Remove from source collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(data.sourceCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayRemove(data.resourceId)
                            });

                        // Add to target collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(targetCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayUnion(data.resourceId)
                            });

                        // Refresh both collections
                        viewCollection(data.sourceCollectionId);
                        viewCollection(targetCollectionId);
                        
                        console.log('Resource moved successfully');
                    } catch (error) {
                        console.error('Error moving resource:', error);
                        alert('Failed to move resource. Please try again.');
                    }
                });

                fragment.appendChild(collectionCard);
            });

            // Append all cards at once
            collectionsList.appendChild(fragment);
        })
        .catch((error) => {
            console.error("Error fetching collections: ", error);
            collectionsList.innerHTML = '<p class="error-message">Error loading collections. Please try again.</p>';
        });

    // Add event listener for create collection button
    document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for create collection button
    const createCollectionBtn = document.getElementById('createCollectionBtn');
    if (createCollectionBtn) {
            createCollectionBtn.addEventListener('click', showCreateCollectionModal);
        const newBtn = createCollectionBtn.cloneNode(true);
        createCollectionBtn.parentNode.replaceChild(newBtn, createCollectionBtn);
        
        newBtn.addEventListener('click', () => {
            const modal = document.getElementById('collectionModal');
            modal.style.display = 'block';
            document.getElementById('newCollectionName').value = '';
            modal.querySelector('h2').textContent = 'Create New Collection';
            document.getElementById('addToCollection').textContent = 'Create Collection';
        });
    }
    });
}

// Function to show the create collection modal
function showCreateCollectionModal() {
    const modal = document.getElementById('collectionModal');
    const modalTitle = modal.querySelector('h2');
    const collectionNameInput = document.getElementById('newCollectionName');
    const addToCollectionBtn = document.getElementById('addToCollection');

    modalTitle.textContent = 'Create New Collection';
    collectionNameInput.value = '';
    addToCollectionBtn.textContent = 'Create Collection';

    modal.style.display = 'flex';

    addToCollectionBtn.onclick = function() {
        const collectionName = collectionNameInput.value.trim();
        if (collectionName) {
            createNewCollection(collectionName);
        }
    };
}

// Function to create a new collection
function createNewCollection(name) {
    db.collection('users').doc(currentUser.uid).collection('collections').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Collection created successfully');
        closeAllModals();
        fetchAndDisplayCollections(); // Refresh the collections list
    })
    .catch((error) => {
        console.error('Error creating collection:', error);
        alert('Failed to create collection. Please try again.');
    });
}

// Ensure the create collection button shows the modal
document.getElementById('createCollectionBtn').addEventListener('click', showCreateCollectionModal);

// Update the resource item creation in viewCollection function
function viewCollection(collectionId) {
    const collectionCard = document.querySelector(`[data-id="${collectionId}"]`).closest('.collection-card');
    const existingExpanded = document.querySelector('.collection-expanded');
    
    // If clicking the same collection that's already expanded, collapse it
    if (existingExpanded && existingExpanded.previousElementSibling === collectionCard) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300); // Remove after animation
        return;
    }

    // Remove any existing expanded section
    if (existingExpanded) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300);
    }

    // Create new expanded section
    const expandedSection = document.createElement('div');
    expandedSection.className = 'collection-expanded';
    
    expandedSection.innerHTML = `
        <div class="collection-resources">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <button class="btn-icon collapse-collection" title="Collapse">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="resources-list"></div>
        </div>
    `;

    // Insert after the collection card
    collectionCard.insertAdjacentElement('afterend', expandedSection);
    
    // Add collapse button listener
    expandedSection.querySelector('.collapse-collection').addEventListener('click', () => {
        expandedSection.classList.remove('active');
        setTimeout(() => expandedSection.remove(), 300);
    });

    // Trigger animation after a brief delay
    setTimeout(() => expandedSection.classList.add('active'), 50);

    // Populate resources
    const resourcesList = expandedSection.querySelector('.resources-list');
    db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).get()
        .then((doc) => {
            const collection = doc.data();
            if (collection.resources && collection.resources.length > 0) {
                collection.resources.forEach(resourceId => {
                    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).get()
                        .then((resourceDoc) => {
                            if (resourceDoc.exists) {
                                const resource = resourceDoc.data();
                                const resourceElement = document.createElement('div');
                                resourceElement.className = 'resource-item';
                                resourceElement.draggable = true;
                                resourceElement.dataset.resourceId = resourceId;
                                resourceElement.innerHTML = `
                                    <div class="resource-drag-handle">
                                        <i class="fas fa-grip-vertical"></i>
                                    </div>
                                    <h4><a href="${resource.url}" target="_blank">${resource.title}</a></h4>
                                    <div class="resource-actions">
                                        <button class="remove-from-collection" data-id="${resourceId}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `;
                                resourcesList.appendChild(resourceElement);

                                // Add drag event listeners
                                resourceElement.addEventListener('dragstart', (e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        resourceId: resourceId,
                                        sourceCollectionId: collectionId
                                    }));
                                    resourceElement.classList.add('dragging');
                                });

                                resourceElement.addEventListener('dragend', () => {
                                    resourceElement.classList.remove('dragging');
                                    document.querySelectorAll('.collection-card').forEach(card => {
                                        card.classList.remove('drag-over');
                                    });
                                });

                                resourceElement.querySelector('.remove-from-collection').addEventListener('click', () => 
                                    removeFromCollection(collectionId, resourceId));
                            }
                        });
                });
            } else {
                resourcesList.innerHTML = '<p class="no-resources">No resources in this collection yet.</p>';
            }
        });
}

// Update the editCollection function
function editCollection(id) {
    db.collection('users').doc(currentUser.uid).collection('collections').doc(id).get()
        .then((doc) => {
            const collection = doc.data();
            const modal = document.getElementById('collectionModal');
            const modalTitle = modal.querySelector('h2');
            const collectionNameInput = document.getElementById('newCollectionName');
            const addToCollectionBtn = document.getElementById('addToCollection');

            modalTitle.textContent = 'Edit Collection';
            collectionNameInput.value = collection.name;
            addToCollectionBtn.textContent = 'Save Changes';

            modal.style.display = 'flex';

            addToCollectionBtn.onclick = function() {
                const newName = collectionNameInput.value.trim();
                if (newName) {
                    updateCollection(id, newName);
                }
            };
        });
}

// Add this function to update a collection
function updateCollection(id, newName) {
    db.collection('users').doc(currentUser.uid).collection('collections').doc(id).update({
        name: newName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Collection updated successfully');
        closeAllModals();
        displayCollections();
    })
    .catch((error) => {
        console.error('Error updating collection:', error);
        alert('Failed to update collection. Please try again.');
    });
}

function fetchAndDisplayFavorites() {
    if (!currentUser) return;

    const resourcesRef = db.collection('users').doc(currentUser.uid).collection('resources');
    resourcesRef.where('favorite', '==', true).get().then((querySnapshot) => {
        const favoriteResources = [];
        querySnapshot.forEach((doc) => {
            favoriteResources.push({ id: doc.id, ...doc.data() });
        });
        displayResources(favoriteResources);
    }).catch((error) => {
        console.error("Error fetching favorite resources: ", error);
    });
}

// Function to display collections and their resources
function viewCollection(collectionId) {
    const collectionCard = document.querySelector(`[data-id="${collectionId}"]`).closest('.collection-card');
    const existingExpanded = document.querySelector('.collection-expanded');
    
    // If clicking the same collection that's already expanded, collapse it
    if (existingExpanded && existingExpanded.previousElementSibling === collectionCard) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300); // Remove after animation
        return;
    }

    // Remove any existing expanded section
    if (existingExpanded) {
        existingExpanded.classList.remove('active');
        setTimeout(() => existingExpanded.remove(), 300);
    }

    // Create new expanded section
    const expandedSection = document.createElement('div');
    expandedSection.className = 'collection-expanded';
    
    expandedSection.innerHTML = `
        <div class="collection-resources">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                <button class="btn-icon collapse-collection" title="Collapse">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="resources-list"></div>
        </div>
    `;

    // Insert after the collection card
    collectionCard.insertAdjacentElement('afterend', expandedSection);
    
    // Add collapse button listener
    expandedSection.querySelector('.collapse-collection').addEventListener('click', () => {
        expandedSection.classList.remove('active');
        setTimeout(() => expandedSection.remove(), 300);
    });

    // Trigger animation after a brief delay
    setTimeout(() => expandedSection.classList.add('active'), 50);

    // Populate resources
    const resourcesList = expandedSection.querySelector('.resources-list');
    db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).get()
        .then((doc) => {
            const collection = doc.data();
            if (collection.resources && collection.resources.length > 0) {
                collection.resources.forEach(resourceId => {
                    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).get()
                        .then((resourceDoc) => {
                            if (resourceDoc.exists) {
                                const resource = resourceDoc.data();
                                const resourceElement = document.createElement('div');
                                resourceElement.className = 'resource-item';
                                resourceElement.draggable = true;
                                resourceElement.dataset.resourceId = resourceId;
                                resourceElement.innerHTML = `
                                    <div class="resource-drag-handle">
                                        <i class="fas fa-grip-vertical"></i>
                                    </div>
                                    <h4><a href="${resource.url}" target="_blank">${resource.title}</a></h4>
                                    <div class="resource-actions">
                                        <button class="remove-from-collection" data-id="${resourceId}">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `;
                                resourcesList.appendChild(resourceElement);

                                // Add drag event listeners
                                resourceElement.addEventListener('dragstart', (e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        resourceId: resourceId,
                                        sourceCollectionId: collectionId
                                    }));
                                    resourceElement.classList.add('dragging');
                                });

                                resourceElement.addEventListener('dragend', () => {
                                    resourceElement.classList.remove('dragging');
                                    document.querySelectorAll('.collection-card').forEach(card => {
                                        card.classList.remove('drag-over');
                                    });
                                });

                                resourceElement.querySelector('.remove-from-collection').addEventListener('click', () => 
                                    removeFromCollection(collectionId, resourceId));
                            }
                        });
                });
            } else {
                resourcesList.innerHTML = '<p class="no-resources">No resources in this collection yet.</p>';
            }
        });
}

function fetchAndDisplayCollections() {
    const contentArea = document.getElementById('contentArea');

    // Clear existing content and set up the collections section
    contentArea.innerHTML = `
        <div class="collections-section">
            <div class="collections-header">
                <h2>My Collections</h2>
            <button id="createCollectionBtn" class="btn-primary">
                    <i class="fas fa-plus"></i> Create Collection
            </button>
        </div>
            <div class="collections-list"></div>
        </div>
    `;

    const collectionsList = document.querySelector('.collections-list');

    // Fetch collections
    db.collection('users').doc(currentUser.uid).collection('collections')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                collectionsList.innerHTML = '<p class="no-collections">No collections yet. Create your first collection!</p>';
                return;
            }

            // Create a fragment for better performance
            const fragment = document.createDocumentFragment();

            querySnapshot.forEach((doc) => {
                const collection = doc.data();
                const collectionCard = document.createElement('div');
                collectionCard.className = 'collection-card';
                
                const resourceCount = collection.resources ? collection.resources.length : 0;
                const lastUpdated = collection.updatedAt ? new Date(collection.updatedAt.toDate()).toLocaleDateString() : 'Never';
                
                collectionCard.innerHTML = `
                    <div class="collection-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="collection-content">
                        <h3>${collection.name || 'Unnamed Collection'}</h3>
    
                        <div class="collection-meta">
                            <span><i class="fas fa-bookmark"></i> ${resourceCount} resources</span>
                            <span><i class="fas fa-clock"></i> Last updated: ${lastUpdated}</span>
                        </div>
                    </div>
                    <div class="collection-actions">
                        <button class="view-collection" data-id="${doc.id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="edit-collection" data-id="${doc.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-collection" data-id="${doc.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                // Add event listeners
                const viewBtn = collectionCard.querySelector('.view-collection');
                const editBtn = collectionCard.querySelector('.edit-collection');
                const deleteBtn = collectionCard.querySelector('.delete-collection');
                
                viewBtn.addEventListener('click', () => viewCollection(doc.id));
                editBtn.addEventListener('click', () => editCollection(doc.id));
                deleteBtn.addEventListener('click', () => deleteCollection(doc.id));

                // Add drop zone functionality
                collectionCard.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    collectionCard.classList.add('drag-over');
                });

                collectionCard.addEventListener('dragleave', () => {
                    collectionCard.classList.remove('drag-over');
                });

                collectionCard.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    collectionCard.classList.remove('drag-over');
                    
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('application/json'));
                        const targetCollectionId = doc.id;
                        
                        if (data.sourceCollectionId === targetCollectionId) return;

                        // Remove from source collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(data.sourceCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayRemove(data.resourceId)
                            });

                        // Add to target collection
                        await db.collection('users').doc(currentUser.uid)
                            .collection('collections').doc(targetCollectionId)
                            .update({
                                resources: firebase.firestore.FieldValue.arrayUnion(data.resourceId)
                            });

                        // Refresh both collections
                        viewCollection(data.sourceCollectionId);
                        viewCollection(targetCollectionId);
                        
                        console.log('Resource moved successfully');
                    } catch (error) {
                        console.error('Error moving resource:', error);
                        alert('Failed to move resource. Please try again.');
                    }
                });

                fragment.appendChild(collectionCard);
            });

            // Append all cards at once
            collectionsList.appendChild(fragment);
        })
        .catch((error) => {
            console.error("Error fetching collections: ", error);
            collectionsList.innerHTML = '<p class="error-message">Error loading collections. Please try again.</p>';
        });

  // Add event listener for create collection button
const createCollectionBtn = document.getElementById('createCollectionBtn');
if (createCollectionBtn) {
    // Remove any existing listeners
    const newBtn = createCollectionBtn.cloneNode(true);
    createCollectionBtn.parentNode.replaceChild(newBtn, createCollectionBtn);
    
    newBtn.addEventListener('click', () => {
        const modal = document.getElementById('collectionModal');
        modal.style.display = 'block';
        document.getElementById('newCollectionName').value = '';
        modal.querySelector('h2').textContent = 'Create New Collection';
        document.getElementById('addToCollection').textContent = 'Create Collection';

        // Add event listener for the modal's create button
        const addToCollectionBtn = document.getElementById('addToCollection');
        addToCollectionBtn.onclick = function() {
            const collectionName = document.getElementById('newCollectionName').value.trim();
            if (collectionName) {
                createNewCollection(collectionName);
            } else {
                alert('Please enter a collection name.');
            }
        };
    });
}

// Function to create a new collection
function createNewCollection(name) {
    db.collection('users').doc(currentUser.uid).collection('collections').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Collection created successfully');
        closeAllModals();
        fetchAndDisplayCollections(); // Refresh the collections list
    })
    .catch((error) => {
        console.error('Error creating collection:', error);
        alert('Failed to create collection. Please try again.');
    });
}

// Function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}
}

// Function to rename a collection
function renameCollection(collectionId, currentName) {
    const newName = prompt('Enter new name for the collection:', currentName);
    if (newName && newName !== currentName) {
        db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).update({
            name: newName
        }).then(() => {
            console.log('Collection renamed successfully');
            fetchAndDisplayCollections();
        }).catch((error) => {
            console.error('Error renaming collection:', error);
            alert('Failed to rename collection. Please try again.');
        });
    }
}

// Function to delete a collection
function deleteCollection(collectionId) {
    if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
        db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).delete()
            .then(() => {
                console.log('Collection deleted successfully');
                fetchAndDisplayCollections();
            }).catch((error) => {
                console.error('Error deleting collection:', error);
                alert('Failed to delete collection. Please try again.');
            });
    }
}

// Function to remove a resource from a collection
function removeFromCollection(collectionId, resourceId) {
    // Get the collection reference
    const collectionRef = db.collection('users').doc(currentUser.uid)
        .collection('collections').doc(collectionId);

    // Start the update process
    collectionRef.update({
        resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
    })
    .then(() => {
        // Successfully removed the resource, update the UI
        const resourceElement = document.querySelector(`[data-resource-id="${resourceId}"]`);
        if (resourceElement) {
            resourceElement.style.opacity = '0';
            resourceElement.style.transform = 'translateX(-10px)';
            setTimeout(() => {
                resourceElement.remove();
                // Optionally refresh the collection view
                viewCollection(collectionId);
            }, 300); // Match the CSS transition duration
        }
    })
    .catch(error => {
        console.error('Error removing resource:', error);
        alert('Failed to remove resource. Please try again.');
    });
}

// Function to move a resource to another collection
function moveToCollection(currentCollectionId, resourceId) {
    // First, get all collections
    db.collection('users').doc(currentUser.uid).collection('collections').get()
        .then((querySnapshot) => {
            const collections = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            const collectionOptions = collections
                .filter(collection => collection.id !== currentCollectionId)
                .map(collection => `<option value="${collection.id}">${collection.name}</option>`)
                .join('');

            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-content">
                        <h2>Move to Collection</h2>
                        <select id="moveToCollectionSelect">
                            ${collectionOptions}
                        </select>
                        <button id="confirmMoveToCollection">Move</button>
                        <button id="cancelMoveToCollection">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('confirmMoveToCollection').onclick = function() {
                const newCollectionId = document.getElementById('moveToCollectionSelect').value;
                if (newCollectionId) {
                    // Remove from current collection
                    db.collection('users').doc(currentUser.uid).collection('collections').doc(currentCollectionId).update({
                        resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
                    }).then(() => {
                        // Add to new collection
                        return db.collection('users').doc(currentUser.uid).collection('collections').doc(newCollectionId).update({
                            resources: firebase.firestore.FieldValue.arrayUnion(resourceId)
                        });
                    }).then(() => {
                        console.log('Resource moved successfully');
                        document.body.removeChild(modal);
                        viewCollectionResources(currentCollectionId);
                    }).catch((error) => {
                        console.error('Error moving resource:', error);
                        alert('Failed to move resource. Please try again.');
                    });
                }
            };

            document.getElementById('cancelMoveToCollection').onclick = function() {
                document.body.removeChild(modal);
            };
        });
}

function fetchAndDisplayTags() {
    if (!currentUser) return;

    const resourcesRef = db.collection('users').doc(currentUser.uid).collection('resources');
    resourcesRef.get().then((querySnapshot) => {
        const tags = new Set();
        querySnapshot.forEach((doc) => {
            const resource = doc.data();
            if (resource.tags) {
                resource.tags.forEach(tag => tags.add(tag));
            }
        });

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<h2>Tags</h2>';
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.textContent = tag;
            contentArea.appendChild(tagElement);
        });
    });
}

function fetchAndDisplayStatistics() {
    if (!currentUser) return;
    
    const resourcesRef = db.collection('users').doc(currentUser.uid).collection('resources');
    const notesRef = db.collection('users').doc(currentUser.uid).collection('notes');
    const collectionsRef = db.collection('users').doc(currentUser.uid).collection('collections');
    
    // Get current timestamp for time comparisons
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    Promise.all([
        resourcesRef.get(),
        notesRef.where('createdAt', '>', sevenDaysAgo).get(),
        collectionsRef.where('createdAt', '>', sevenDaysAgo).get(),
        resourcesRef.where('isFavorite', '==', true).get()
    ]).then(([resourcesSnapshot, recentNotesSnapshot, recentCollectionsSnapshot, favoritesSnapshot]) => {
        const stats = {
            totalResources: resourcesSnapshot.size,
            readResources: 0,
            unreadResources: 0,
            favoriteResources: 0,
            categoryCounts: {},
            typeCounts: {},
            recentlyAdded: 0,
            recentNotes: recentNotesSnapshot.size,
            recentCollections: recentCollectionsSnapshot.size,
            totalFavorites: favoritesSnapshot.size,
            tagsCount: new Set(),
            avgResourcesPerCategory: 0
        };

        resourcesSnapshot.forEach((doc) => {
            const resource = doc.data();
            // Existing stats
            if (resource.status === 'read') stats.readResources++;
            else stats.unreadResources++;
            if (resource.favorite) stats.favoriteResources++;
            stats.categoryCounts[resource.category] = (stats.categoryCounts[resource.category] || 0) + 1;
            stats.typeCounts[resource.type] = (stats.typeCounts[resource.type] || 0) + 1;

            // More accurate recent activity tracking
            if (resource.createdAt && resource.createdAt.toDate() > sevenDaysAgo) {
                stats.recentlyAdded++;
            }
            if (resource.tags) {
                resource.tags.forEach(tag => stats.tagsCount.add(tag));
            }
        });

        // Calculate average resources per category
        const categoryCount = Object.keys(stats.categoryCounts).length;
        stats.avgResourcesPerCategory = categoryCount ? (stats.totalResources / categoryCount).toFixed(1) : 0;

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="statistics-container">
                <h2 class="stats-header">Resource Statistics</h2>
                
                <!-- Overview Stats spread horizontally -->
                <div class="stats-cards">
                    <div class="stat-card">
                        <i class="fas fa-book"></i>
                        <h3>Total Resources</h3>
                        <span>${stats.totalResources}</span>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-check-circle"></i>
                        <h3>Read</h3>
                        <span>${stats.readResources}</span>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-clock"></i>
                        <h3>Unread</h3>
                        <span>${stats.unreadResources}</span>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-star"></i>
                        <h3>Favorites</h3>
                        <span>${stats.favoriteResources}</span>
                    </div>
                </div>

                <!-- Three equal columns for detailed stats -->
                <div class="stats-details">
                    <!-- Categories Distribution -->
                    <div class="chart-container">
                        <h3>Categories Distribution</h3>
                        <div class="category-bars">
                            ${Object.entries(stats.categoryCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([category, count]) => `
                                    <div class="bar-item">
                                        <div class="bar-label">${category || 'Uncategorized'}</div>
                                        <div class="bar-track">
                                            <div class="bar-fill" style="width: ${(count/stats.totalResources)*100}%"></div>
                                        </div>
                                        <div class="bar-value">${count}</div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>

                    <!-- Resource Types -->
                    <div class="chart-container">
                        <h3>Resource Types</h3>
                        <div class="type-grid">
                            ${Object.entries(stats.typeCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => `
                                    <div class="type-item">
                                        <div class="type-icon"><i class="fas ${getTypeIcon(type)}"></i></div>
                                        <div class="type-details">
                                            <span class="type-name">${type || 'Unspecified'}</span>
                                            <span class="type-count">${count}</span>
                                        </div>
                                    </div>
                                `).join('')}
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="stats-section">
                        <h3>Recent Activity</h3>
                        <div class="activity-metrics">
                            <div class="metric">
                                <i class="fas fa-plus-circle"></i>
                                <span>${stats.recentlyAdded} new resources added</span>
                            </div>
                            <div class="metric">
                                <i class="fas fa-sticky-note"></i>
                                <span>${stats.recentNotes} new notes created</span>
                            </div>
                            <div class="metric">
                                <i class="fas fa-folder-plus"></i>
                                <span>${stats.recentCollections} new collections created</span>
                            </div>
                            <div class="metric">
                                <i class="fas fa-star"></i>
                                <span>${stats.totalFavorites} total favorites</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Helper function to get appropriate icon for resource type
function getTypeIcon(type) {
    const iconMap = {
        'article': 'fa-newspaper',
        'video': 'fa-video',
        'book': 'fa-book',
        'course': 'fa-graduation-cap',
        'podcast': 'fa-podcast',
        'document': 'fa-file-alt',
        'tutorial': 'fa-chalkboard-teacher',
        'tool': 'fa-tools',
        'website': 'fa-globe',
        'repository': 'fa-code-branch'
    };
    return iconMap[type.toLowerCase()] || 'fa-bookmark';
}

// Add event listeners for the learning paths tab
document.querySelector('[data-tab="learning-paths"]').addEventListener('click', (e) => {
    e.preventDefault();
    currentTab = 'learning-paths';
    updateActiveTab();
    fetchAndDisplayLearningPaths();
});

// Function to fetch and display learning paths
function fetchAndDisplayLearningPaths() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = ''; // Clear existing content
    
    const learningPathsRef = db.collection('users').doc(currentUser.uid).collection('learningPaths');
    
    learningPathsRef.get().then((querySnapshot) => {
        const paths = [];
        querySnapshot.forEach((doc) => {
            paths.push({ id: doc.id, ...doc.data() });
        });

        // Sort paths by last updated
        paths.sort((a, b) => {
            const timeA = a.updatedAt ? a.updatedAt.toDate() : new Date(0);
            const timeB = b.updatedAt ? b.updatedAt.toDate() : new Date(0);
            return timeB - timeA;
        });

        contentArea.innerHTML = `
            <div class="learning-paths-container">
                <div class="learning-paths-section">
                    <div class="section-header">
                        <h2>Learning Paths</h2>
                        <button id="createLearningPathBtn" class="btn-primary">
                            <i class="fas fa-plus"></i> New Path
                        </button>
                    </div>
                </div>
                ${paths.map(path => `
                    <div class="learning-path-card" data-id="${path.id}">
                        <div class="path-header">
                            <h3 class="path-title">${path.name}</h3>
                            <div class="path-metadata">
                                <span>${path.difficulty || 'Beginner'}</span>
                                <span>${path.estimatedTime || '2-3 hours'}</span>
                            </div>
                        </div>
                        <div class="path-content">
                            <p>${path.description || 'No description available'}</p>
                            <div class="path-progress">
                                <div class="progress-bar" style="width: ${calculateProgress(path)}%"></div>
                            </div>
                            <div class="progress-text">
                                ${calculateCompletedResources(path)} of ${path.resources ? path.resources.length : 0} resources completed
                            </div>
                        </div>
                        <div class="path-actions">
                            <button class="path-action-button" onclick="event.stopPropagation(); viewLearningPath('${path.id}')">
                                <i class="fas fa-eye"></i> View Path
                            </button>
                            <button class="path-action-button" onclick="event.stopPropagation(); editLearningPath('${path.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="path-action-button" onclick="event.stopPropagation(); deleteLearningPath('${path.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).catch((error) => {
        console.error("Error fetching learning paths: ", error);
        contentArea.innerHTML = '<p class="error-message">Error loading learning paths. Please try again.</p>';
    });
}

// Function to view a specific learning path
function viewLearningPath(pathId) {
    const contentArea = document.getElementById('contentArea');
    
    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            contentArea.innerHTML = `
                <div class="notion-like-page">
                    <div class="breadcrumb">
                        <a href="#" onclick="fetchAndDisplayLearningPaths()">
                            <i class="fas fa-graduation-cap"></i> Learning Paths
                        </a>
                        <span class="separator">/</span>
                        <span>${path.name}</span>
                    </div>
                    
                    <div class="path-actions">
                        <button class="path-action-button" onclick="editLearningPath('${pathId}')">
                            <i class="fas fa-edit"></i> Edit Path
                        </button>
                        <button class="path-action-button" onclick="showResourceSelectionModal('${pathId}')">
                            <i class="fas fa-plus"></i> Add Resources
                        </button>
                        <button class="path-action-button" onclick="deleteLearningPath('${pathId}')">
                            <i class="fas fa-trash"></i> Delete Path
                        </button>
                    </div>

                    <div class="learning-hub">
                        <div class="hub-sidebar">
                            <div class="progress-section">
                                <h3>Progress Overview</h3>
                                <div class="path-progress">
                                    <div class="progress-bar" style="width: ${calculateProgress(path)}%"></div>
                                </div>
                                <p class="progress-text">
                                    ${calculateCompletedResources(path)} of ${path.resources ? path.resources.length : 0} completed
                                </p>
                            </div>
                            
                            <div class="path-metadata">
                                <p><i class="fas fa-clock"></i> ${path.estimatedTime || 'Not specified'}</p>
                                <p><i class="fas fa-signal"></i> ${path.difficulty || 'Not specified'}</p>
                                <p><i class="fas fa-calendar"></i> Created: ${formatDate(path.createdAt)}</p>
                            </div>
                        </div>

                        <div class="hub-main">
                            <div class="resource-list">
                                ${path.resources ? path.resources.map((resource, index) => `
                                    <div class="resource-block ${resource.completed ? 'completed' : ''}" 
                                         onclick="toggleResourceStatus('${pathId}', '${resource.id}')">
                                        <div class="resource-number">${index + 1}</div>
                                        <div class="resource-content">
                                            <h4>${resource.title}</h4>
                                            <p>${resource.description || ''}</p>
                                            <div class="resource-meta">
                                                <span><i class="fas fa-clock"></i> ${resource.duration || '10 min'}</span>
                                                <span><i class="fas fa-tag"></i> ${resource.type || 'Article'}</span>
                                            </div>
                                        </div>
                                        <div class="resource-actions">
                                            <a href="${resource.url}" target="_blank" class="resource-link">
                                                <i class="fas fa-external-link-alt"></i>
                                            </a>
                                            <button onclick="removeResourceFromPath('${pathId}', '${resource.id}')" class="remove-resource">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('') : '<p>No resources added to this path yet.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
}

// Function to toggle resource status
function toggleResourceStatus(pathId, resourceId) {
    // Implement the logic to toggle the resource status
    console.log(`Toggling status for resource ${resourceId} in path ${pathId}`);
}

function editLearningPath(pathId) {
    db.collection('users').doc(currentUser.uid)
        .collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            const modalContent = `
                <div class="modal-content cia-style">
                    <h2>Edit Learning Path</h2>
                    <form id="editPathForm">
                        <div class="form-group">
                            <label for="editLearningPathName">Path Name</label>
                            <input type="text" id="editLearningPathName" value="${path.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editLearningPathDescription">Description</label>
                            <textarea id="editLearningPathDescription">${path.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editLearningPathDifficulty">Difficulty Level</label>
                            <select id="editLearningPathDifficulty">
                                <option value="Beginner" ${path.difficulty === 'Beginner' ? 'selected' : ''}>Beginner</option>
                                <option value="Intermediate" ${path.difficulty === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${path.difficulty === 'Advanced' ? 'selected' : ''}>Advanced</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                            <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            `;

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);

            // Show modal with animation
            setTimeout(() => modal.style.display = 'block', 0);

            const form = modal.querySelector('#editPathForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const updatedPath = {
                    name: document.getElementById('editLearningPathName').value,
                    description: document.getElementById('editLearningPathDescription').value,
                    difficulty: document.getElementById('editLearningPathDifficulty').value,
                };

                db.collection('users').doc(currentUser.uid)
                    .collection('learningPaths').doc(pathId)
                    .update(updatedPath)
                    .then(() => {
                        closeModal();
                        viewLearningPath(pathId);
                    })
                    .catch(error => {
                        console.error('Error updating path:', error);
                        alert('Failed to update learning path. Please try again.');
                    });
            });
        });
}

// Update the viewLearningPath function to include the add resources button
function viewLearningPath(pathId) {
    const contentArea = document.getElementById('contentArea');
    
    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            contentArea.innerHTML = `
                <div class="notion-like-page">
                    <div class="breadcrumb">
                        <a href="#" onclick="fetchAndDisplayLearningPaths()">
                            <i class="fas fa-graduation-cap"></i> Learning Paths
                        </a>
                        <span class="separator">/</span>
                        <span>${path.name}</span>
                    </div>
                    
                    <div class="path-actions">
                        <button class="path-action-button" onclick="editLearningPath('${pathId}')">
                            <i class="fas fa-edit"></i> Edit Path
                        </button>
                        <button class="path-action-button" onclick="showResourceSelectionModal('${pathId}')">
                            <i class="fas fa-plus"></i> Add Resources
                        </button>
                        <button class="path-action-button" onclick="deleteLearningPath('${pathId}')">
                            <i class="fas fa-trash"></i> Delete Path
                        </button>
                    </div>
                    <div class="learning-hub">
                        <div class="hub-sidebar">
                            <div class="progress-section">
                                <h3>Progress Overview</h3>
                                <div class="path-progress">
                                    <div class="progress-bar" style="width: ${calculateProgress(path)}%"></div>
                                </div>
                                <p class="progress-text">
                                    ${calculateCompletedResources(path)} of ${path.resources ? path.resources.length : 0} completed
                                </p>
                            </div>
                            
                            <div class="path-metadata">
                                <p><i class="fas fa-clock"></i> ${path.estimatedTime || 'Not specified'}</p>
                                <p><i class="fas fa-signal"></i> ${path.difficulty || 'Not specified'}</p>
                                <p><i class="fas fa-calendar"></i> Created: ${formatDate(path.createdAt)}</p>
                            </div>
                        </div>

                        <div class="hub-main">
                            <div class="resource-list">
                                ${path.resources ? path.resources.map((resource, index) => `
                                    <div class="resource-block ${resource.completed ? 'completed' : ''}" 
                                         onclick="toggleResourceStatus('${pathId}', '${resource.id}')">
                                        <div class="resource-number">${index + 1}</div>
                                        <div class="resource-content">
                                            <h4>${resource.title}</h4>
                                            <p>${resource.description || ''}</p>
                                            <div class="resource-meta">
                                                <span><i class="fas fa-clock"></i> ${resource.duration || '10 min'}</span>
                                                <span><i class="fas fa-tag"></i> ${resource.type || 'Article'}</span>
                                            </div>
                                        </div>
                                        <div class="resource-actions">
                                            <a href="${resource.url}" target="_blank" class="resource-link">
                                                <i class="fas fa-external-link-alt"></i>
                                            </a>
                                            <button onclick="removeResourceFromPath('${pathId}', '${resource.id}')" class="remove-resource">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('') : '<p>No resources added to this path yet.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
}

function calculateProgress(path) {
    if (!path.resources || path.resources.length === 0) return 0;
    const completed = path.resources.filter(resource => resource.completed).length;
    return Math.round((completed / path.resources.length) * 100);
}

function calculateCompletedResources(path) {
    if (!path.resources) return 0;
    return path.resources.filter(resource => resource.completed).length;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Not available';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.remove();
    });
}

function generateResourcesList(resources) {
    if (!resources || resources.length === 0) {
        return '<div class="empty-state">No resources added yet</div>';
    }

    return resources.map((resource, index) => `
        <div class="resource-block ${resource.completed ? 'completed' : ''}" 
             data-id="${resource.id}"
             style="animation-delay: ${index * 0.1}s">
            <div class="resource-content">
                <div class="resource-header">
                    <h4>${resource.title}</h4>
                    <span class="resource-type">${resource.type || 'Article'}</span>
                </div>
                <p class="resource-description">${resource.description || ''}</p>
                <div class="resource-meta">
                    <a href="${resource.url}" target="_blank" class="resource-link">
                        <i class="fas fa-external-link-alt"></i> Open Resource
                    </a>
                    <span class="resource-duration">
                        <i class="far fa-clock"></i> ${resource.duration || '10 min'}
                    </span>
                </div>
            </div>
            <div class="resource-actions">
                <button class="btn-icon complete-resource" title="Mark as ${resource.completed ? 'incomplete' : 'complete'}">
                    <i class="fas fa-${resource.completed ? 'check-circle' : 'circle'}"></i>
                </button>
                <button class="btn-icon remove-resource" title="Remove from path">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showResourceSelectionModal(pathId) {
    db.collection('users').doc(currentUser.uid)
        .collection('resources').get()
        .then((querySnapshot) => {
            const resources = [];
            querySnapshot.forEach((doc) => {
                resources.push({ id: doc.id, ...doc.data() });
            });

            const modalContent = `
                <div class="modal-content cia-style">
                    <h2>Add Resources to Path</h2>
                    <div class="resource-selection-list">
                        ${resources.map((resource, index) => `
                            <div class="resource-selection-item">
                                <span class="resource-number">${index + 1}.</span>
                                <input type="checkbox" id="resource-${resource.id}" value="${resource.id}">
                                <label for="resource-${resource.id}">${resource.title || 'Untitled'}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button onclick="addSelectedResourcesToPath('${pathId}')" class="btn-primary">Add Selected</button>
                        <button onclick="closeModal()" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            `;

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);

            setTimeout(() => modal.style.display = 'block', 0);
        });
}

function addSelectedResourcesToPath(pathId) {
    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one resource');
        return;
    }

    console.log('Selected resources:', selectedCheckboxes.length); // Debug log

    // Get the path document
    db.collection('users').doc(currentUser.uid)
        .collection('learningPaths').doc(pathId).get()
        .then((pathDoc) => {
            if (!pathDoc.exists) {
                throw new Error('Learning path not found');
            }

            const path = pathDoc.data();
            const existingResources = path.resources || [];
            console.log('Existing resources:', existingResources); // Debug log

            // Create an array of promises to fetch each selected resource
            const resourcePromises = Array.from(selectedCheckboxes).map(checkbox => {
                const resourceId = checkbox.value;
                console.log('Fetching resource:', resourceId); // Debug log

                return db.collection('users').doc(currentUser.uid)
                    .collection('resources').doc(resourceId).get()
                    .then(doc => {
                        if (!doc.exists) {
                            console.log('Resource not found:', resourceId); // Debug log
                            return null;
                        }
                        const resourceData = doc.data();
                        return {
                            id: doc.id,
                            title: resourceData.title || 'Untitled',
                            url: resourceData.url || '#',
                            description: resourceData.description || '',
                            type: resourceData.type || 'Article',
                            duration: resourceData.duration || '10 min',
                            completed: false
                        };
                    });
            });

            // Wait for all resource data to be fetched and filter out null values
            return Promise.all(resourcePromises)
                .then(newResources => {
                    // Filter out null values and duplicates
                    const validNewResources = newResources.filter(r => r !== null);
                    console.log('Valid new resources:', validNewResources); // Debug log

                    const existingIds = existingResources.map(r => r.id);
                    const uniqueNewResources = validNewResources.filter(r => !existingIds.includes(r.id));
                    console.log('Unique new resources:', uniqueNewResources); // Debug log

                    // Combine existing and new resources
                    const updatedResources = [...existingResources, ...uniqueNewResources];
                    console.log('Updated resources:', updatedResources); // Debug log

                    // Update the path with the new resources
                    return db.collection('users').doc(currentUser.uid)
                        .collection('learningPaths').doc(pathId)
                        .update({ resources: updatedResources });
                });
        })
        .then(() => {
            console.log('Successfully added resources to path'); // Debug log
            closeModal();
            viewLearningPath(pathId);
        })
        .catch(error => {
            console.error('Detailed error adding resources to path:', error); // More detailed error logging
            alert(`Failed to add resources to path: ${error.message}`);
        });
}

function calculateProgress(path) {
    if (!path.resources || path.resources.length === 0) return 0;
    const completedResources = path.resources.filter(r => r.completed).length;
    return (completedResources / path.resources.length) * 100;
}

function calculateCompletedResources(path) {
    if (!path.resources) return 0;
    return path.resources.filter(r => r.completed).length;
}

function calculateEstimatedCompletion(path) {
    const progress = calculateProgress(path);
    const estimatedDays = Math.ceil(progress / 10);
    return `${estimatedDays} day${estimatedDays > 1 ? 's' : ''}`;
}

function toggleResourceStatus(pathId, resourceId) {
    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            const resourceIndex = path.resources.findIndex(r => r.id === resourceId);
            if (resourceIndex !== -1) {
                path.resources[resourceIndex].completed = !path.resources[resourceIndex].completed;
                return db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).update({
                    resources: path.resources
                });
            }
        })
        .then(() => {
            viewLearningPath(pathId);
        })
        .catch((error) => {
            console.error('Error toggling resource status:', error);
            alert('Failed to update resource status. Please try again.');
        });
}

function deleteLearningPath(pathId) {
    if (confirm('Are you sure you want to delete this learning path? This action cannot be undone.')) {
        db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).delete()
            .then(() => {
                fetchAndDisplayLearningPaths();
            }).catch((error) => {
                console.error('Error deleting learning path:', error);
                alert('Failed to delete learning path. Please try again.');
            });
    }
}

function removeResourceFromPath(pathId, resourceId) {
    if (confirm('Are you sure you want to remove this resource from the path?')) {
        // First get the current path data
        db.collection('users').doc(currentUser.uid)
            .collection('learningPaths').doc(pathId).get()
            .then((doc) => {
                const path = doc.data();
                // Filter out the resource we want to remove
                const updatedResources = path.resources.filter(resource => resource.id !== resourceId);
                
                // Update the path with the filtered resources
                return db.collection('users').doc(currentUser.uid)
                    .collection('learningPaths').doc(pathId)
                    .update({ resources: updatedResources });
            })
            .then(() => {
                console.log('Resource successfully removed from path');
                viewLearningPath(pathId);
            })
            .catch((error) => {
                console.error('Error removing resource from path:', error);
                alert('Failed to remove resource from path. Please try again.');
            });
    }
}

function fetchAndDisplayRecentActivity() {
    if (!currentUser) return;

    const recentActivity = [];
    const promises = [];

    // Fetch recent resources (added/modified)
    promises.push(
        db.collection('users').doc(currentUser.uid).collection('resources')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const resource = doc.data();
                    recentActivity.push({
                        type: 'resource_added',
                        title: resource.title,
                        date: resource.createdAt.toDate(),
                        category: resource.category,
                        resourceType: resource.type,
                        url: resource.url
                    });

                    // Add status changes if they exist
                    if (resource.lastStatusChange) {
                        recentActivity.push({
                            type: 'status_change',
                            title: resource.title,
                            date: resource.lastStatusChange.toDate(),
                            status: resource.status,
                            url: resource.url
                        });
                    }
                });
            })
    );

    // Fetch recent notes
    promises.push(
        db.collection('users').doc(currentUser.uid).collection('notes')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const note = doc.data();
                    recentActivity.push({
                        type: 'note_added',
                        title: note.resourceTitle || 'Untitled Resource',
                        noteContent: note.content.substring(0, 100) + '...',
                        date: note.createdAt.toDate(),
                        resourceId: note.resourceId
                    });
                });
            })
    );

    // Fetch recent learning path progress
    promises.push(
        db.collection('users').doc(currentUser.uid).collection('learningPaths')
            .orderBy('lastUpdated', 'desc')
            .limit(10)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const path = doc.data();
                    if (path.recentProgress) {
                        recentActivity.push({
                            type: 'learning_progress',
                            title: path.name,
                            date: path.lastUpdated.toDate(),
                            progress: path.progress
                        });
                    }
                });
            })
    );

    Promise.all(promises)
        .then(() => {
            // Sort all activities by date
            recentActivity.sort((a, b) => b.date - a.date);

            // Display recent activity
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `
                <div class="recent-activity-container">
                    <h2 class="activity-header">Recent Activity</h2>
                    
                    <div class="activity-stats">
                        <div class="stat-card">
                            <i class="fas fa-clock"></i>
                            <h3>Last 24 Hours</h3>
                            <span>${countActivitiesInPeriod(recentActivity, 1)}</span>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-calendar-week"></i>
                            <h3>Last 7 Days</h3>
                            <span>${countActivitiesInPeriod(recentActivity, 7)}</span>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-calendar-alt"></i>
                            <h3>Last 30 Days</h3>
                            <span>${countActivitiesInPeriod(recentActivity, 30)}</span>
                        </div>
                    </div>

                    <div class="activity-timeline">
                        ${recentActivity.map(activity => createActivityItem(activity)).join('')}
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching recent activity:', error);
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = '<p class="error-message">Error loading recent activity. Please try again.</p>';
        });
}

// Helper function to count activities within a time period
function countActivitiesInPeriod(activities, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return activities.filter(activity => activity.date > cutoffDate).length;
}

// Helper function to create activity item HTML
function createActivityItem(activity) {
    const timeAgo = formatTimeAgo(activity.date);
    let icon, label, details;

    switch (activity.type) {
        case 'resource_added':
            icon = 'fa-plus-circle';
            label = 'Added new resource';
            details = `<a href="${activity.url}" target="_blank">${activity.title}</a>
                      <span class="activity-meta">${activity.category || 'Uncategorized'} · ${activity.resourceType || 'Unknown type'}</span>`;
            break;

        case 'note_added':
            icon = 'fa-sticky-note';
            label = 'Added note to';
            details = `<strong>${activity.title}</strong>
                      <div class="note-preview">${activity.noteContent}</div>`;
            break;

        case 'status_change':
            icon = 'fa-check-circle';
            label = `Marked as ${activity.status}`;
            details = `<a href="${activity.url}" target="_blank">${activity.title}</a>`;
            break;

        case 'learning_progress':
            icon = 'fa-graduation-cap';
            label = 'Updated progress';
            details = `<strong>${activity.title}</strong>
                      <div class="progress-bar">
                          <div class="progress" style="width: ${activity.progress}%"></div>
                      </div>`;
            break;

        default:
            icon = 'fa-circle';
            label = 'Activity';
            details = activity.title;
    }

    return `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-header">
                    <span class="activity-label">${label}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <div class="activity-details">
                    ${details}
                </div>
            </div>
        </div>
    `;
}

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Add the deleteResource function
function deleteResource(resourceId, resource) {
    if (confirm(`Are you sure you want to delete the resource "${resource.title}"? This action cannot be undone.`)) {
        db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).delete()
            .then(() => {
                console.log('Resource deleted successfully');
                fetchAndDisplayResources();
            })
            .catch((error) => {
                console.error('Error deleting resource:', error);
                alert('Failed to delete resource. Please try again.');
            });
    }
}

// Add this debounce function to limit how often the search is performed
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

// Update the addResource function to include searchTerms
function addResource(resourceData) {
    // ... existing code ...

    // Add searchTerms to the resourceData
    resourceData.searchTerms = createSearchTerms(resourceData);

    // ... rest of the function ...
}

// Update existing resources to include searchTerms
function updateExistingResourcesWithSearchTerms() {
    db.collection('users').doc(currentUser.uid).collection('resources').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const resource = doc.data();
                const searchTerms = createSearchTerms(resource);
                doc.ref.update({ searchTerms: searchTerms });
            });
        })
        .catch((error) => {
            console.error("Error updating resources with search terms: ", error);
        });
}

// Call this function once to update existing resources
// You can remove this call after running it once
// updateExistingResourcesWithSearchTerms();

// Add this function to show the add resource modal
function showAddResourceModal() {
    const modal = document.getElementById('addResourceModal');
    modal.style.display = 'flex';

    // Populate category and type dropdowns
    populateCategoryAndTypeDropdowns();

    // Close the modal when clicking on <span> (x)
    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Handle save button click
    document.getElementById('saveNewResource').onclick = saveNewResource;
}

// Add this function to save a new resource
function saveNewResource() {
    const title = document.getElementById('newResourceTitle').value.trim();
    const url = document.getElementById('newResourceUrl').value.trim();
    const tags = document.getElementById('newResourceTags').value.trim().split(',').map(tag => tag.trim());
    const category = document.getElementById('newResourceCategory').value;
    const type = document.getElementById('newResourceType').value;

    if (!title || !url) {
        alert('Title and URL are required!');
        return;
    }

    const newResource = {
        title: title,
        url: url,
        tags: tags,
        category: category,
        type: type,
        status: 'unread',
        favorite: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add searchTerms to the new resource
    newResource.searchTerms = createSearchTerms(newResource);

    db.collection('users').doc(currentUser.uid).collection('resources').add(newResource)
        .then(() => {
            console.log('Resource added successfully');
            document.getElementById('addResourceModal').style.display = 'none';
            fetchAndDisplayResources();
            // Clear the form
            document.getElementById('newResourceTitle').value = '';
            document.getElementById('newResourceUrl').value = '';
            document.getElementById('newResourceTags').value = '';
            document.getElementById('newResourceCategory').value = '';
            document.getElementById('newResourceType').value = '';
        })
        .catch((error) => {
            console.error('Error adding resource:', error);
            alert('Failed to add resource. Please try again.');
        });
}

function addNote(resourceId, resource) {
    const modal = document.getElementById('noteModal');
    const noteContent = document.getElementById('noteContent');
    const saveNoteBtn = document.getElementById('saveNote');
    const deleteNoteBtn = document.getElementById('deleteNote');

    // Check if a note already exists for this resource
    db.collection('users').doc(currentUser.uid).collection('notes')
        .where('resourceId', '==', resourceId)
        .limit(1)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const existingNote = querySnapshot.docs[0].data();
                noteContent.value = existingNote.content;
                deleteNoteBtn.style.display = 'inline-block';
                deleteNoteBtn.onclick = () => deleteNote(querySnapshot.docs[0].id);
            } else {
                noteContent.value = '';
                deleteNoteBtn.style.display = 'none';
            }

            modal.style.display = 'flex';

            saveNoteBtn.onclick = function() {
                const content = noteContent.value.trim();
                if (content) {
                    const noteData = {
                        content: content,
                        resourceId: resourceId,
                        resourceTitle: resource.title,
                        resourceUrl: resource.url,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    if (!querySnapshot.empty) {
                        // Update existing note
                        db.collection('users').doc(currentUser.uid).collection('notes').doc(querySnapshot.docs[0].id).update(noteData)
                            .then(() => {
                                console.log('Note updated successfully');
                                modal.style.display = 'none';
                                if (currentTab === 'notes') {
                                    fetchAndDisplayNotes();
                                }
                            })
                            .catch((error) => {
                                console.error('Error updating note:', error);
                                alert('Failed to update note. Please try again.');
                            });
                    } else {
                        // Add new note
                        noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                        db.collection('users').doc(currentUser.uid).collection('notes').add(noteData)
                            .then(() => {
                                console.log('Note added successfully');
                                modal.style.display = 'none';
                                if (currentTab === 'notes') {
                                    fetchAndDisplayNotes();
                                }
                            })
                            .catch((error) => {
                                console.error('Error adding note:', error);
                                alert('Failed to add note. Please try again.');
                            });
                    }
                }
            };
        });

    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        db.collection('users').doc(currentUser.uid).collection('notes').doc(noteId).delete()
            .then(() => {
                console.log('Note deleted successfully');
                document.getElementById('noteModal').style.display = 'none';
                if (currentTab === 'notes') {
                    fetchAndDisplayNotes();
                }
            })
            .catch((error) => {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            });
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Add event listeners to close buttons and modal backgrounds
document.addEventListener('DOMContentLoaded', () => {
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeAllModals();
            }
        });
    });
});

function createNote(resourceId, content) {
    const shareId = generateUniqueId(); // We'll implement this function
    return db.collection('users').doc(currentUser.uid).collection('notes').add({
        resourceId,
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        shareId
    });
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

function displayCollections() {
    const collectionsContainer = document.getElementById('collectionsContainer');
    collectionsContainer.innerHTML = '';

    db.collection('users').doc(currentUser.uid).collection('collections').orderBy('name').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                collectionsContainer.innerHTML = '<p class="no-collections">No collections yet. Create your first collection!</p>';
            } else {
                querySnapshot.forEach((doc) => {
                    const collection = doc.data();
                    const collectionCard = createCollectionCard(doc.id, collection);
                    collectionsContainer.appendChild(collectionCard);
                });
            }
        })
        .catch((error) => {
            console.error("Error fetching collections: ", error);
            collectionsContainer.innerHTML = '<p class="error-message">Error loading collections. Please try again.</p>';
        });
}

function createCollectionCard(id, collection) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.innerHTML = `
        <div class="collection-icon">
            <i class="fas fa-folder"></i>
            </div>
        <div class="collection-content">
            <h3>${collection.name}</h3>
            <p class="collection-description">${collection.description || 'No description'}</p>
            <div class="collection-meta">
                <span><i class="fas fa-book"></i> ${collection.resources ? collection.resources.length : 0} resources</span>
            </div>
        </div>
        <div class="collection-actions">
            <button class="btn-icon view-collection" title="View Collection"><i class="fas fa-eye"></i></button>
            <button class="btn-icon edit-collection" title="Edit Collection"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-collection" title="Delete Collection"><i class="fas fa-trash"></i></button>
        </div>
    `;

    // Add event listeners
    card.querySelector('.view-collection').addEventListener('click', () => viewCollection(id));
    card.querySelector('.edit-collection').addEventListener('click', () => editCollection(id));
    card.querySelector('.delete-collection').addEventListener('click', () => deleteCollection(id));

    // Update or add the share button event listener
    const shareButton = card.querySelector('.share-resource');
    if (shareButton) {
        shareButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            shareResource(collection);
        });
    }

    return card;
}

// Add this new function to handle creating a new collection
function createNewCollection() {
    // Implement the logic to create a new collection
    console.log('Creating a new collection');
}

// Make sure to add this event listener when initializing the app

// Function to delete a resource
function deleteResource(resourceId) {
    if (confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
        // First, find all collections containing this resource and remove it
        db.collection('users').doc(currentUser.uid)
            .collection('collections')
            .get()
            .then((querySnapshot) => {
                const updatePromises = [];
                
                querySnapshot.forEach((doc) => {
                    const collection = doc.data();
                    if (collection.resources && collection.resources.includes(resourceId)) {
                        updatePromises.push(
                            doc.ref.update({
                                resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
                            })
                        );
                    }
                });

                // Wait for all collection updates to complete
                return Promise.all(updatePromises);
            })
            .then(() => {
                // Now delete the resource itself
                return db.collection('users').doc(currentUser.uid)
                    .collection('resources').doc(resourceId).delete();
            })
            .then(() => {
                console.log('Resource and its references deleted successfully');
                // Refresh the collections view if we're on that page
                if (document.querySelector('#collectionsContainer')) {
                    fetchAndDisplayCollections();
                }
                // Remove the resource card from the UI
                const resourceCard = document.querySelector(`[data-id="${resourceId}"]`);
                if (resourceCard) {
                    resourceCard.remove();
                }
            })
            .catch((error) => {
                console.error('Error deleting resource:', error);
                alert('Failed to delete resource. Please try again.');
            });
    }
}

// Add this to your existing JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    const feedbackButton = document.getElementById('feedbackButton');
    const feedbackDialog = document.getElementById('feedbackDialog');
    const closeFeedback = document.querySelector('.close-feedback');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const submitFeedback = document.getElementById('submitFeedback');
    const feedbackTypeButtons = document.querySelectorAll('.feedback-type-btn');
    
    function toggleFeedbackDialog() {
        feedbackDialog.classList.toggle('active');
    }

    function closeFeedbackDialog() {
        feedbackDialog.classList.remove('active');
        // Reset form
        document.getElementById('feedbackText').value = '';
        feedbackTypeButtons.forEach(btn => btn.classList.remove('active'));
        feedbackTypeButtons[0].classList.add('active');
    }

    feedbackButton.addEventListener('click', toggleFeedbackDialog);
    closeFeedback.addEventListener('click', closeFeedbackDialog);
    cancelFeedback.addEventListener('click', closeFeedbackDialog);

    // Handle feedback type selection
    feedbackTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            feedbackTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Modify the feedback submission handler
    submitFeedback.addEventListener('click', () => {
        const feedbackType = document.querySelector('.feedback-type-btn.active').dataset.type;
        const feedbackText = document.getElementById('feedbackText').value;

        if (feedbackText.trim() === '') {
            alert('Please enter your feedback before submitting.');
            return;
        }

        // Create feedback object
        const feedback = {
            type: feedbackType,
            text: feedbackText,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'new' // Can be used for tracking feedback status (new, reviewed, resolved, etc.)
        };

        // Save to Firebase
        db.collection('feedback').add(feedback)
            .then(() => {
                console.log('Feedback saved to Firebase');
                alert('Thank you for your feedback!');
                closeFeedbackDialog();
            })
            .catch((error) => {
                console.error('Error saving feedback:', error);
                alert('Failed to submit feedback. Please try again.');
            });
    });

    // Close dialog when clicking outside
    document.addEventListener('click', (e) => {
        if (!feedbackDialog.contains(e.target) && !feedbackButton.contains(e.target)) {
            closeFeedbackDialog();
        }
    });
});

// Add this new function to handle resource sharing
function shareResource(resourceId, item) {
    const shareModal = document.getElementById('shareModal');
    const closeBtn = shareModal.querySelector('.close');
    const shareUrl = item.url;
    const appUrl = 'https://resourcesaverpro.com';
    
    // Enhanced HTML stripping function
    const cleanContent = (html) => {
        // First remove common Quill editor formatting
        let cleaned = html.replace(/<p>/g, '')
                         .replace(/<\/p>/g, '\n')
                         .replace(/<br>/g, '\n')
                         .replace(/<strong>/g, '')
                         .replace(/<\/strong>/g, '')
                         .replace(/<em>/g, '')
                         .replace(/<\/em>/g, '')
                         .replace(/&nbsp;/g, ' ');
        
        // Then strip any remaining HTML tags
        const temp = document.createElement('div');
        temp.innerHTML = cleaned;
        return temp.textContent || temp.innerText;
    };
    
    // Updated share message with personalized note title
    const shareMessage = item.content ? 
        `Check out my note on "${item.resourceTitle}"\n\n${cleanContent(item.content)}\n\nResource: ${shareUrl}\n\n📚 Note captured with Resource Saver Pro\nOrganize your digital knowledge at ${appUrl}` :
        `Check out this resource: ${item.title}\n\n${shareUrl}\n\n📚 Saved with Resource Saver Pro\nDiscover a better way to save and organize resources at ${appUrl}`;
    
    // Show the modal
    shareModal.style.display = 'block';

    // Handle share button clicks
    const shareButtons = {
        'shareEmail': () => {
            window.location.href = `mailto:?subject=${encodeURIComponent(item.content ? 'Note: ' + item.title : 'Resource: ' + item.title)}&body=${encodeURIComponent(shareMessage)}`;
        },
        'shareTwitter': () => {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareFacebook': () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareWhatsApp': () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareLinkedIn': () => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareIMessage': () => {
            window.location.href = `sms:&body=${encodeURIComponent(shareMessage)}`;
        },
        'shareTelegram': () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareSlack': () => {
            window.open(`https://slack.com/share?text=${encodeURIComponent(shareMessage)}`, '_blank');
        },
        'shareCopyLink': () => {
            navigator.clipboard.writeText(shareMessage).then(() => {
                alert('Link and message copied to clipboard!');
            }).catch(console.error);
        }
    };

    // Add click events to share buttons
    Object.keys(shareButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            // Remove any existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                shareButtons[buttonId]();
            });
        }
    });

    // Close modal functionality
    const closeModal = () => {
        shareModal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;

    // Close when clicking outside the modal
    window.onclick = (event) => {
        if (event.target == shareModal) {
            closeModal();
        }
    };
}

// Add this at the beginning of your JavaScript file, before any other code
(function initializeMobileWarning() {
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function() {
            // Check if device is mobile
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                const mobileWarning = document.getElementById('mobileWarning');
                if (!mobileWarning) return; // Exit if element not found
                
                // Show warning immediately
                mobileWarning.classList.add('active');
                
                // Handle proceed anyway button
                const proceedBtn = document.getElementById('proceedAnyway');
                if (proceedBtn) {
                    proceedBtn.addEventListener('click', function() {
                        mobileWarning.classList.remove('active');
                        sessionStorage.setItem('mobileWarningDismissed', 'true');
                    });
                }
                
                // Handle desktop button (copy link)
                const desktopBtn = document.getElementById('viewOnDesktop');
                if (desktopBtn) {
                    desktopBtn.addEventListener('click', function() {
                        const currentUrl = window.location.href;
                        if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(currentUrl)
                                .then(() => {
                                    alert('Link copied! Please paste this link in your desktop browser.');
                                })
                                .catch(() => {
                                    fallbackCopyTextToClipboard(currentUrl);
                                });
                        } else {
                            fallbackCopyTextToClipboard(currentUrl);
                        }
                    });
                }
                
                // Check if warning was previously dismissed
                if (sessionStorage.getItem('mobileWarningDismissed') !== 'true') {
                    mobileWarning.classList.add('active');
                }
            }
        });
    }
})();

// Fallback function for copying to clipboard
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        alert('Link copied! Please paste this link in your desktop browser.');
    } catch (err) {
        alert('Unable to copy link. Please manually copy the URL from your browser.');
    }

    document.body.removeChild(textArea);
}



