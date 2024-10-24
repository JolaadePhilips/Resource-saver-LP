 // Import necessary Firebase modules and currentUser variable
 import { db, currentUser } from './resource-bank.js';

 // Function to fetch and display collections
 function fetchAndDisplayCollections() {
     const collectionsContainer = document.getElementById('collectionsContainer');
     const collectionsSection = document.querySelector('.collections-section');
     
     // Add loading state
     collectionsSection.classList.add('loading');
     
     db.collection('users').doc(currentUser.uid).collection('collections').orderBy('name').get()
         .then((querySnapshot) => {
             // Clear container with fade out
             collectionsContainer.style.opacity = '0';
             
             setTimeout(() => {
                 collectionsContainer.innerHTML = '';
                 
                 if (querySnapshot.empty) {
                     collectionsContainer.innerHTML = '<p class="no-collections">No collections yet. Create your first collection!</p>';
                 } else {
                     const fragment = document.createDocumentFragment();
                     querySnapshot.forEach((doc, index) => {
                         const collection = doc.data();
                         const collectionCard = createCollectionCard(doc.id, collection);
                         
                         // Add entrance animation classes
                         collectionCard.classList.add('entering');
                         setTimeout(() => {
                             collectionCard.classList.remove('entering');
                             collectionCard.classList.add('entered');
                         }, index * 100); // Stagger the animations
                        
                         fragment.appendChild(collectionCard);
                     });
                     collectionsContainer.appendChild(fragment);
                 }
                 
                 // Fade in the container
                 collectionsContainer.style.opacity = '1';
                 collectionsSection.classList.remove('loading');
             }, 300);
         })
         .catch((error) => {
             console.error("Error fetching collections: ", error);
             collectionsContainer.innerHTML = '<p class="error-message">Error loading collections. Please try again.</p>';
             collectionsSection.classList.remove('loading');
         });
 }
 
 // Function to create a collection card
 function createCollectionCard(id, collection) {
     const card = document.createElement('div');
     card.className = 'collection-card';
     card.setAttribute('data-id', id);
     
     card.innerHTML = `
         <div class="collection-icon">
             <i class="fas fa-folder"></i>
         </div>
         <div class="collection-content">
             <h3>${collection.name || 'Unnamed Collection'}</h3>
             <div class="collection-meta">
                 <span><i class="fas fa-bookmark"></i> ${collection.resources ? collection.resources.length : 0} resources</span>
                 <span><i class="fas fa-clock"></i> Last updated: ${collection.updatedAt ? new Date(collection.updatedAt.toDate()).toLocaleDateString() : 'Never'}</span>
             </div>
         </div>
         <div class="collection-actions">
             <button class="btn-icon view-collection" title="View Collection"><i class="fas fa-eye"></i></button>
             <button class="btn-icon edit-collection" title="Edit Collection"><i class="fas fa-edit"></i></button>
             <button class="btn-icon delete-collection" title="Delete Collection"><i class="fas fa-trash"></i></button>
         </div>
     `;
 
     // Add event listeners
     const viewBtn = card.querySelector('.view-collection');
     const editBtn = card.querySelector('.edit-collection');
     const deleteBtn = card.querySelector('.delete-collection');
     
     viewBtn.addEventListener('click', () => viewCollection(id));
     editBtn.addEventListener('click', () => editCollection(id));
     deleteBtn.addEventListener('click', () => deleteCollection(id));
 
     // Add drop zone functionality
     card.addEventListener('dragover', (e) => {
         e.preventDefault();
         card.classList.add('drag-over');
     });
 
     card.addEventListener('dragleave', () => {
         card.classList.remove('drag-over');
     });
 
     card.addEventListener('drop', async (e) => {
         e.preventDefault();
         card.classList.remove('drag-over');
         
         try {
             const data = JSON.parse(e.dataTransfer.getData('application/json'));
             const targetCollectionId = id;
             
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
 
     return card;
 }
 
 // Function to create a new collection
 function createNewCollection() {
     // Implement the logic to create a new collection
     console.log('Creating a new collection');
     // You can add a modal or form to get collection details from the user
 }
 
 // Function to view a collection
 function viewCollection(id) {
     db.collection('users').doc(currentUser.uid).collection('collections').doc(id).get()
         .then((doc) => {
             if (doc.exists) {
                 const collection = doc.data();
                 const card = document.querySelector(`.collection-card[data-id="${id}"]`);
                 
                 // Create resources list if it doesn't exist
                 let resourcesList = card.querySelector('.collection-resources');
                 if (!resourcesList) {
                     resourcesList = document.createElement('ol'); // Use <ol> for ordered list
                     resourcesList.className = 'collection-resources';
                     card.appendChild(resourcesList);
                 }
                 
                 // Clear existing resources
                 resourcesList.innerHTML = '';
                 
                 // Add resources
                 if (collection.resources && collection.resources.length > 0) {
                     collection.resources.forEach((resource, index) => {
                         const resourceItem = createResourceItem(resource, index, id);
                         resourcesList.appendChild(resourceItem);
                     });
                 } else {
                     resourcesList.innerHTML = '<p class="no-resources">No resources in this collection</p>';
                 }
             }
         })
         .catch(error => {
             console.error("Error viewing collection:", error);
         });
 }
 
 // Function to edit a collection
 function editCollection(id) {
     console.log('Editing collection:', id);
     // Implement the logic to edit a collection
 }
 
 // Function to delete a collection
 function deleteCollection(id) {
     if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
         db.collection('users').doc(currentUser.uid).collection('collections').doc(id).delete()
             .then(() => {
                 console.log('Collection deleted successfully');
                 fetchAndDisplayCollections();
             }).catch((error) => {
                 console.error('Error deleting collection:', error);
                 alert('Failed to delete collection. Please try again.');
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
 
 // Function to remove a resource from a collection
 function removeFromCollection(collectionId, resourceId) {
     db.collection('users').doc(currentUser.uid).collection('collections').doc(collectionId).update({
         resources: firebase.firestore.FieldValue.arrayRemove(resourceId)
     }).then(() => {
         console.log('Resource removed from collection successfully');
         viewCollection(collectionId);
     }).catch((error) => {
         console.error('Error removing resource from collection:', error);
         alert('Failed to remove resource from collection. Please try again.');
     });
 }
 
 // Add event listener for create collection button
 document.getElementById('createCollectionBtn').addEventListener('click', createNewCollection);
 
 // Export functions
 export { 
     fetchAndDisplayCollections, 
     createNewCollection, 
     viewCollection, 
     editCollection, 
     deleteCollection, 
     renameCollection, 
     removeFromCollection 
 };
 
 function createCollectionItem(id, collection) {
     const item = document.createElement('li');
     item.className = 'collection-item';
     
     const resourceCount = collection.resources ? collection.resources.length : 0;
     
     item.innerHTML = `
         <div class="collection-icon">
             <i class="fas fa-folder"></i>
         </div>
         <div class="collection-content">
             <h3 class="collection-title">${collection.name || 'Unnamed Collection'}</h3>
             <div class="collection-meta">
                 <span><i class="fas fa-bookmark"></i> ${resourceCount} resources</span>
             </div>
         </div>
         <div class="collection-actions">
             <button class="view-collection" data-id="${id}" title="View">
                 <i class="fas fa-eye"></i>
             </button>
             <button class="edit-collection" data-id="${id}" title="Edit">
                 <i class="fas fa-edit"></i>
             </button>
             <button class="delete-collection" data-id="${id}" title="Delete">
                 <i class="fas fa-trash"></i>
             </button>
         </div>
     `;

     return item;
 }

 function createResourceItem(resource, index, collectionId) {
    const li = document.createElement('li');
    li.className = 'collection-resource-item';
    
    li.innerHTML = `
        <span class="resource-title">${resource.title}</span>
        <div class="resource-actions">
            <button class="view-resource" title="View Resource">
                <i class="fas fa-external-link-alt"></i>
            </button>
            <button class="remove-resource" title="Remove from Collection">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
 
    // Add event listeners
    const viewBtn = li.querySelector('.view-resource');
    const removeBtn = li.querySelector('.remove-resource');
    
    viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(resource.url, '_blank');
    });
    
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromCollection(collectionId, resource.id);
    });

    return li;
}
