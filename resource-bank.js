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

    switch (currentTab) {
        case 'resources':
            contentArea.style.display = 'grid';
            notesSection.style.display = 'none';
            fetchAndDisplayResources();
            break;
        case 'notes':
            contentArea.style.display = 'none';
            notesSection.style.display = 'block';
            fetchAndDisplayNotes();
            break;
        case 'collections':
            fetchAndDisplayCollections();
            break;
        case 'favorites':
            fetchAndDisplayFavorites();
            break;
        case 'tags':
            fetchAndDisplayTags();
            break;
        case 'statistics':
            fetchAndDisplayStatistics();
            break;
        case 'learning-paths':
            fetchAndDisplayLearningPaths();
            break;
        case 'recent':
            fetchAndDisplayRecentActivity();
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
            collectionRef = db.collection('users').doc(currentUser.uid).collection('collections').doc();
        } else {
            console.error('No collection selected or created');
            return;
        }

        collectionRef.set({
            name: newCollectionName.value || collectionSelect.options[collectionSelect.selectedIndex].text,
            resources: firebase.firestore.FieldValue.arrayUnion(resourceId)
        }, { merge: true })
        .then(() => {
            console.log('Resource added to collection successfully');
            closeAllModals();
            newCollectionName.value = '';
        })
        .catch((error) => {
            console.error('Error adding resource to collection: ', error);
            alert('Failed to add resource to collection. Please try again.');
        });
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
    const shareUrl = `${window.location.origin}/shared-note.html?shareId=${note.shareId}`;

    shareModal.style.display = 'block';

    closeBtn.onclick = () => {
        shareModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === shareModal) {
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
    contentArea.innerHTML = `
        <div class="collections-header">
            <h2>Collections</h2>
            <button id="createCollectionBtn" class="btn-primary" title="Create New Collection"><i class="fas fa-plus"></i> Create Collection</button>
        </div>
        <div id="collectionsContainer" class="collections-container"></div>
    `;

    displayCollections();

    // Add event listener for creating a new collection
    document.getElementById('createCollectionBtn').addEventListener('click', showCreateCollectionModal);
}

// Add this function to show the create collection modal
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

// Add this function to create a new collection
function createNewCollection(name) {
    db.collection('users').doc(currentUser.uid).collection('collections').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Collection created successfully');
        closeAllModals();
        displayCollections();
    })
    .catch((error) => {
        console.error('Error creating collection:', error);
        alert('Failed to create collection. Please try again.');
    });
}

// Update the viewCollection function
function viewCollection(id) {
    db.collection('users').doc(currentUser.uid).collection('collections').doc(id).get()
        .then((doc) => {
            const collection = doc.data();
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `
                <h2>${collection.name}</h2>
                <p class="collection-description">${collection.description || 'No description'}</p>
                <div id="collectionResources" class="content-area grid-view"></div>
                <button id="backToCollections" class="btn-secondary"><i class="fas fa-arrow-left"></i> Back to Collections</button>
            `;

            if (collection.resources && collection.resources.length > 0) {
                displayResources(collection.resources);
            } else {
                document.getElementById('collectionResources').innerHTML = '<p>No resources in this collection.</p>';
            }

            document.getElementById('backToCollections').addEventListener('click', fetchAndDisplayCollections);
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
function viewCollectionResources(collectionId) {
    db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).get()
        .then((doc) => {
            const collection = doc.data();
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `<h2>${collection.name}</h2>`;

            if (collection.resources && collection.resources.length > 0) {
                collection.resources.forEach(resourceId => {
                    db.collection('users').doc(currentUser.uid).collection('resources').doc(resourceId).get()
                        .then((resourceDoc) => {
                            if (resourceDoc.exists) {
                                const resource = resourceDoc.data();
                                const resourceElement = document.createElement('div');
                                resourceElement.classList.add('resource-card');
                                resourceElement.innerHTML = `
                                    <h3><a href="${resource.url}" target="_blank">${resource.title}</a></h3>
                                    <p>${resource.description || ''}</p>
                                    <button class="remove-from-collection" data-id="${resourceId}">Remove from Collection</button>
                                    <button class="move-to-collection" data-id="${resourceId}">Move to Another Collection</button>
                                `;
                                contentArea.appendChild(resourceElement);

                                // Add event listeners for resource actions
                                resourceElement.querySelector('.remove-from-collection').addEventListener('click', () => removeFromCollection(collectionId, resourceId));
                                resourceElement.querySelector('.move-to-collection').addEventListener('click', () => moveToCollection(collectionId, resourceId));
                            }
                        });
                });
            } else {
                contentArea.innerHTML += '<p>No resources in this collection.</p>';
            }
        });
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
    db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).update({
        resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
    }).then(() => {
        console.log('Resource removed from collection successfully');
        viewCollectionResources(collectionId);
    }).catch((error) => {
        console.error('Error removing resource from collection:', error);
        alert('Failed to remove resource from collection. Please try again.');
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
    resourcesRef.get().then((querySnapshot) => {
        const stats = {
            totalResources: querySnapshot.size,
            readResources: 0,
            unreadResources: 0,
            favoriteResources: 0,
            categoryCounts: {},
            typeCounts: {}
        };

        querySnapshot.forEach((doc) => {
            const resource = doc.data();
            if (resource.status === 'read') stats.readResources++;
            else stats.unreadResources++;
            if (resource.favorite) stats.favoriteResources++;
            stats.categoryCounts[resource.category] = (stats.categoryCounts[resource.category] || 0) + 1;
            stats.typeCounts[resource.type] = (stats.typeCounts[resource.type] || 0) + 1;
        });

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <h2>Statistics</h2>
            <p>Total Resources: ${stats.totalResources}</p>
            <p>Read Resources: ${stats.readResources}</p>
            <p>Unread Resources: ${stats.unreadResources}</p>
            <p>Favorite Resources: ${stats.favoriteResources}</p>
            <h3>Categories</h3>
            <ul>${Object.entries(stats.categoryCounts).map(([category, count]) => `<li>${category}: ${count}</li>`).join('')}</ul>
            <h3>Types</h3>
            <ul>${Object.entries(stats.typeCounts).map(([type, count]) => `<li>${type}: ${count}</li>`).join('')}</ul>
        `;
    });
}

function fetchAndDisplayLearningPaths() {
    if (!currentUser) return;

    const learningPathsRef = db.collection('users').doc(currentUser.uid).collection('learningPaths');
    learningPathsRef.get().then((querySnapshot) => {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<h2>Learning Paths</h2>';
        contentArea.innerHTML += '<button id="createLearningPath" class="btn-primary"><i class="fas fa-plus"></i> Create New Learning Path</button>';
        contentArea.innerHTML += '<div class="learning-paths-container"></div>';

        // Show the learning paths blurb if it hasn't been dismissed before
        if (!localStorage.getItem('learningPathsBlurbDismissed')) {
            document.getElementById('learningPathsBlurb').style.display = 'block';
        }

        const learningPathsContainer = contentArea.querySelector('.learning-paths-container');

        if (querySnapshot.empty) {
            learningPathsContainer.innerHTML = '<p>You haven\'t created any learning paths yet. Click the "Create New Learning Path" button to get started!</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const path = doc.data();
                const pathElement = document.createElement('div');
                pathElement.classList.add('learning-path-card');
                const completedResources = path.resources ? path.resources.filter(r => r.completed).length : 0;
                const totalResources = path.resources ? path.resources.length : 0;
                const progressPercentage = totalResources > 0 ? (completedResources / totalResources) * 100 : 0;

                pathElement.innerHTML = `
                    <h3>${path.name}</h3>
                    <p>${path.description || 'No description provided.'}</p>
                    <div class="learning-path-progress">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                    <p class="progress-text">${completedResources}/${totalResources} resources completed</p>
                    <div class="learning-path-actions">
                        <button class="btn-primary view-learning-path" data-id="${doc.id}"><i class="fas fa-eye"></i> View</button>
                        <button class="btn-secondary edit-learning-path" data-id="${doc.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-danger delete-learning-path" data-id="${doc.id}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                `;
                learningPathsContainer.appendChild(pathElement);
            });
        }

        // Add event listeners
        document.getElementById('createLearningPath').addEventListener('click', () => showLearningPathModal());
        document.querySelectorAll('.view-learning-path').forEach(btn => {
            btn.addEventListener('click', (e) => viewLearningPath(e.target.closest('button').getAttribute('data-id')));
        });
        document.querySelectorAll('.edit-learning-path').forEach(btn => {
            btn.addEventListener('click', (e) => showLearningPathModal(e.target.closest('button').getAttribute('data-id')));
        });
        document.querySelectorAll('.delete-learning-path').forEach(btn => {
            btn.addEventListener('click', (e) => deleteLearningPath(e.target.closest('button').getAttribute('data-id')));
        });
        document.getElementById('closeBlurb').addEventListener('click', dismissLearningPathsBlurb);
    });
}

function showLearningPathModal(pathId = null) {
    const modal = document.getElementById('learningPathModal');
    const form = document.getElementById('learningPathForm');
    const titleElement = document.getElementById('learningPathModalTitle');
    const nameInput = document.getElementById('learningPathName');
    const descriptionInput = document.getElementById('learningPathDescription');

    if (pathId) {
        titleElement.textContent = 'Edit Learning Path';
        db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
            .then((doc) => {
                const path = doc.data();
                nameInput.value = path.name;
                descriptionInput.value = path.description || '';
            });
    } else {
        titleElement.textContent = 'Create Learning Path';
        form.reset();
    }

    modal.style.display = 'block';

    form.onsubmit = (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        if (name) {
            const pathData = {
                name: name,
                description: description,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (pathId) {
                db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).update(pathData)
                    .then(() => {
                        modal.style.display = 'none';
                        fetchAndDisplayLearningPaths();
                    });
            } else {
                pathData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                pathData.resources = [];
                db.collection('users').doc(currentUser.uid).collection('learningPaths').add(pathData)
                    .then(() => {
                        modal.style.display = 'none';
                        fetchAndDisplayLearningPaths();
                    });
            }
        }
    };

    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function dismissLearningPathsBlurb() {
    document.getElementById('learningPathsBlurb').style.display = 'none';
    localStorage.setItem('learningPathsBlurbDismissed', 'true');
}

function viewLearningPath(pathId) {
    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = `
                <h2>${path.name}</h2>
                <p>${path.description || 'No description provided.'}</p>
                <div class="learning-path-progress">
                    <div class="progress-bar" style="width: ${calculateProgress(path)}%"></div>
                </div>
                <p class="progress-text">${calculateCompletedResources(path)}/${path.resources ? path.resources.length : 0} resources completed</p>
                <button id="addResourceToPath" class="btn-primary"><i class="fas fa-plus"></i> Add Resource to Path</button>
                <h3>Resources:</h3>
                <div id="pathResources" class="learning-path-resources"></div>
                <button id="backToLearningPaths" class="btn-secondary"><i class="fas fa-arrow-left"></i> Back to Learning Paths</button>
            `;

            const pathResourcesContainer = document.getElementById('pathResources');

            if (path.resources && path.resources.length > 0) {
                path.resources.forEach((resource, index) => {
                    const resourceElement = document.createElement('div');
                    resourceElement.classList.add('learning-path-resource');
                    resourceElement.innerHTML = `
                        <div class="learning-path-resource-number">${index + 1}</div>
                        <div class="learning-path-resource-content">
                            <h4>${resource.title}</h4>
                            <p>${resource.description || 'No description provided.'}</p>
                            <a href="${resource.url}" target="_blank" class="btn-link">View Resource</a>
                        </div>
                        <div class="learning-path-resource-status ${resource.completed ? 'completed' : ''}">
                            ${resource.completed ? 'Completed' : 'Not Completed'}
                        </div>
                        <button class="btn-secondary toggle-resource-status" data-id="${resource.id}">
                            ${resource.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                        </button>
                        <button class="btn-danger remove-from-path" data-id="${resource.id}"><i class="fas fa-trash"></i></button>
                    `;
                    pathResourcesContainer.appendChild(resourceElement);
                });
            } else {
                pathResourcesContainer.innerHTML = '<p>No resources added to this path yet.</p>';
            }

            document.getElementById('addResourceToPath').addEventListener('click', () => addResourceToPath(pathId));
            document.getElementById('backToLearningPaths').addEventListener('click', fetchAndDisplayLearningPaths);
            pathResourcesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-from-path')) {
                    removeResourceFromPath(pathId, e.target.getAttribute('data-id'));
                } else if (e.target.classList.contains('toggle-resource-status')) {
                    toggleResourceStatus(pathId, e.target.getAttribute('data-id'));
                }
            });
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

function addResourceToPath(pathId) {
    db.collection('users').doc(currentUser.uid).collection('resources').get()
        .then((querySnapshot) => {
            const resources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const modal = createModal('Add Resource to Path', `
                <select id="resourceSelect">
                    ${resources.map(resource => `<option value="${resource.id}">${resource.title}</option>`).join('')}
                </select>
            `);

            modal.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                const resourceId = document.getElementById('resourceSelect').value;
                const selectedResource = resources.find(r => r.id === resourceId);
                
                db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).update({
                    resources: firebase.firestore.FieldValue.arrayUnion({
                        id: selectedResource.id,
                        title: selectedResource.title,
                        description: selectedResource.description,
                        url: selectedResource.url,
                        completed: false
                    })
                }).then(() => {
                    closeModal(modal);
                    viewLearningPath(pathId);
                }).catch((error) => {
                    console.error('Error adding resource to path:', error);
                    alert('Failed to add resource to path. Please try again.');
                });
            });
        });
}

function editLearningPath(pathId) {
    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).get()
        .then((doc) => {
            const path = doc.data();
            const modal = createModal('Edit Learning Path', `
                <input type="text" id="editLearningPathName" value="${path.name}" required>
                <textarea id="editLearningPathDescription">${path.description || ''}</textarea>
            `);

            modal.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('editLearningPathName').value;
                const description = document.getElementById('editLearningPathDescription').value;

                if (name) {
                    db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).update({
                        name: name,
                        description: description,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        closeModal(modal);
                        fetchAndDisplayLearningPaths();
                    }).catch((error) => {
                        console.error('Error updating learning path:', error);
                        alert('Failed to update learning path. Please try again.');
                    });
                }
            });
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
        db.collection('users').doc(currentUser.uid).collection('learningPaths').doc(pathId).update({
            resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
        }).then(() => {
            viewLearningPath(pathId);
        }).catch((error) => {
            console.error('Error removing resource from path:', error);
            alert('Failed to remove resource from path. Please try again.');
        });
    }
}

function fetchAndDisplayRecentActivity() {
    if (!currentUser) return;

    const recentActivity = [];

    // Fetch recent resources
    db.collection('users').doc(currentUser.uid).collection('resources')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const resource = doc.data();
                recentActivity.push({
                    type: 'resource',
                    title: resource.title,
                    date: resource.createdAt.toDate()
                });
            });

            // Fetch recent notes
            return db.collection('users').doc(currentUser.uid).collection('notes')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        })
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                recentActivity.push({
                    type: 'note',
                    title: note.resourceTitle,
                    date: note.createdAt.toDate()
                });
            });

            // Sort all activities by date
            recentActivity.sort((a, b) => b.date - a.date);

            // Display recent activity
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = '<h2>Recent Activity</h2>';
            recentActivity.forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.classList.add('activity-item');
                activityElement.innerHTML = `
                    <p>${activity.type === 'resource' ? 'Added resource:' : 'Added note to:'} ${activity.title}</p>
                    <small>${activity.date.toLocaleString()}</small>
                `;
                contentArea.appendChild(activityElement);
            });
        });
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
        <h3>${collection.name}</h3>
        <p class="collection-description">${collection.description || 'No description'}</p>
        <p class="resource-count">${collection.resources ? collection.resources.length : 0} resources</p>
        <div class="collection-actions">
            <button class="btn-icon view-collection" title="View Collection"><i class="fas fa-eye"></i></button>
            <button class="btn-icon edit-collection" title="Edit Collection"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-collection" title="Delete Collection"><i class="fas fa-trash"></i></button>
        </div>
    `;

    card.querySelector('.view-collection').addEventListener('click', () => viewCollection(id));
    card.querySelector('.edit-collection').addEventListener('click', () => editCollection(id));
    card.querySelector('.delete-collection').addEventListener('click', () => deleteCollection(id));

    return card;
}

// Add this new function to handle creating a new collection
function createNewCollection() {
    // Implement the logic to create a new collection
    console.log('Creating a new collection');
}

// Make sure to add this event listener when initializing the app
document.getElementById('createCollectionBtn').addEventListener('click', createNewCollection);
