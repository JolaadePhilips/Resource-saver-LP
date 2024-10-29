class KnowledgePath {
    constructor() {
        // Initialize Firebase
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        
        // Wait for authentication
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.initializeElements();
                this.bindEvents();
                this.loadPaths();
            }
        });
    }

    initializeElements() {
        this.section = document.getElementById('knowledgePathsSection');
        this.container = document.getElementById('knowledgePathsContainer');
        this.createButton = document.getElementById('createKnowledgePathBtn');
        this.modal = document.getElementById('knowledgePathModal');
        this.modalClose = this.modal.querySelector('.close');
        this.saveButton = document.getElementById('saveKnowledgePath');
        this.pathTitle = document.getElementById('pathTitle');
        this.pathDescription = document.getElementById('pathDescription');
        this.pathNotes = document.getElementById('pathNotes');
        this.resourcesList = document.getElementById('pathResourcesList');

        // Add info button to the section header
        const sectionHeader = this.section.querySelector('.section-header') || this.section.firstElementChild;
        if (sectionHeader) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'kp-info-btn';
            infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
            infoBtn.onclick = () => this.showPathInfo();
            sectionHeader.appendChild(infoBtn);
        }
    }

    bindEvents() {
        // Create button opens modal
        this.createButton.addEventListener('click', () => this.showCreatePathModal());
        
        // Close button closes modal
        this.modalClose.addEventListener('click', () => this.hideModal());
        
        // Save button saves new path
        this.saveButton.addEventListener('click', () => this.savePath());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Close modal when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hideModal();
            }
        });
    }

    showCreatePathModal() {
        const modalHTML = `
            <div class="kp-modal-content">
                <div class="kp-modal-header">
                    <h2>Create Knowledge Path</h2>
                    <span class="kp-close" id="closePathModal">&times;</span>
                </div>
                
                <div class="kp-modal-body">
                    <div class="kp-form-group">
                        <label for="pathTitle">Path Title</label>
                        <input type="text" id="pathTitle" class="kp-input" placeholder="Enter a title for your learning path" required>
                    </div>

                    <div class="kp-form-group">
                        <label for="pathDescription">Description</label>
                        <textarea id="pathDescription" class="kp-input" placeholder="Describe what you want to learn" rows="3"></textarea>
                    </div>
                    
                    <div class="kp-form-section">
                        <h3>Learning Goals</h3>
                        
                        <div class="kp-form-group">
                            <label for="targetCompletion">Target Completion</label>
                            <select id="targetCompletion" class="kp-input">
                                <option value="1week">1 Week</option>
                                <option value="2weeks">2 Weeks</option>
                                <option value="1month">1 Month</option>
                                <option value="3months">3 Months</option>
                                <option value="6months">6 Months</option>
                                <option value="custom">Custom Date</option>
                            </select>
                            <input type="date" id="customDate" class="kp-input kp-custom-date" style="display: none;">
                        </div>

                        <div class="kp-form-group">
                            <label for="timeCommitment">Time Commitment</label>
                            <select id="timeCommitment" class="kp-input">
                                <option value="1hr_week">1 hour per week</option>
                                <option value="2hr_week">2 hours per week</option>
                                <option value="5hr_week">5 hours per week</option>
                                <option value="10hr_week">10 hours per week</option>
                                <option value="custom">Custom</option>
                            </select>
                            <div class="kp-custom-time" style="display: none;">
                                <input type="number" id="customHours" class="kp-input" min="1" placeholder="Hours">
                                <select id="customPeriod" class="kp-input">
                                    <option value="per_day">per day</option>
                                    <option value="per_week">per week</option>
                                    <option value="per_month">per month</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="kp-form-section">
                        <h3>Select Resources</h3>
                        <div id="resourceSelectionList" class="kp-resource-selection-list">
                            <!-- Resources will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="kp-modal-actions">
                    <button class="kp-btn-secondary kp-close-modal" id="cancelPathModal">Cancel</button>
                    <button class="kp-btn-primary" id="saveKnowledgePath">
                        <i class="fas fa-save"></i> Create Path
                    </button>
                </div>
            </div>
        `;

        // Get the modal element
        const modal = document.getElementById('knowledgePathModal');
        modal.innerHTML = modalHTML;
        modal.style.display = 'block';

        // Add event listeners for custom selections
        const targetSelect = document.getElementById('targetCompletion');
        const customDate = document.getElementById('customDate');
        const timeSelect = document.getElementById('timeCommitment');
        const customTime = document.querySelector('.custom-time');

        targetSelect.addEventListener('change', (e) => {
            customDate.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        timeSelect.addEventListener('change', (e) => {
            customTime.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        });

        // Add close functionality
        const closeModal = () => {
            modal.style.display = 'none';
            modal.innerHTML = ''; // Clear the modal content
        };

        // Close button event listener
        document.getElementById('closePathModal').addEventListener('click', closeModal);

        // Cancel button event listener
        document.getElementById('cancelPathModal').addEventListener('click', closeModal);

        // Save button event listener
        document.getElementById('saveKnowledgePath').addEventListener('click', () => {
            this.savePath();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Load available resources
        this.loadAvailableResources();
    }

    hideModal() {
        const modal = document.getElementById('knowledgePathModal');
        if (modal) {
            modal.style.display = 'none';
            modal.innerHTML = ''; // Clear the modal content
        }
    }

    async loadAvailableResources() {
        try {
            const resources = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('resources')
                .get();

            const resourcesList = document.getElementById('resourceSelectionList');
            
            if (resources.empty) {
                resourcesList.innerHTML = '<p class="kp-empty-message">No resources available. Create some resources first!</p>';
                return;
            }

            resourcesList.innerHTML = `
                <div class="resources-selection">
                    ${resources.docs.map(doc => {
                        const resource = doc.data();
                        return `
                            <div class="resource-selection-item">
                                <input type="checkbox" 
                                       id="resource-${doc.id}" 
                                       value="${doc.id}"
                                       data-title="${resource.title}">
                                <label for="resource-${doc.id}">
                                    <span class="resource-title">${resource.title}</span>
                                    <span class="resource-type">${resource.type || 'Article'}</span>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading resources:', error);
            document.getElementById('pathResourcesList').innerHTML = `
                <div class="error-message">Error loading resources: ${error.message}</div>
            `;
        }
    }

    async savePath() {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const title = document.getElementById('pathTitle').value.trim();
            const description = document.getElementById('pathDescription').value.trim();
            const targetCompletion = document.getElementById('targetCompletion').value;
            const timeCommitment = document.getElementById('timeCommitment').value;

            // Calculate target date based on selection
            let targetDate;
            if (targetCompletion === 'custom') {
                targetDate = document.getElementById('customDate').value;
            } else {
                const today = new Date();
                switch(targetCompletion) {
                    case '1week':
                        targetDate = new Date(today.setDate(today.getDate() + 7));
                        break;
                    case '2weeks':
                        targetDate = new Date(today.setDate(today.getDate() + 14));
                        break;
                    case '1month':
                        targetDate = new Date(today.setMonth(today.getMonth() + 1));
                        break;
                    case '3months':
                        targetDate = new Date(today.setMonth(today.getMonth() + 3));
                        break;
                    case '6months':
                        targetDate = new Date(today.setMonth(today.getMonth() + 6));
                        break;
                }
                targetDate = targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }

            // Format time commitment for display
            let formattedTimeCommitment;
            if (timeCommitment === 'custom') {
                const hours = document.getElementById('customHours').value;
                const period = document.getElementById('customPeriod').value;
                formattedTimeCommitment = `${hours} hours ${period.replace('_', ' ')}`;
            } else {
                formattedTimeCommitment = timeCommitment.replace('_', ' ').replace('hr', ' hours');
            }

            // Get selected resources
            const selectedResources = Array.from(
                document.querySelectorAll('#resourceSelectionList input[type="checkbox"]:checked')
            ).map(checkbox => ({
                id: checkbox.value,
                title: checkbox.dataset.title,
                status: 'pending',
                addedAt: new Date().toISOString()
            }));

            const pathData = {
                title,
                description,
                targetDate, // Store the actual date
                timeCommitment: formattedTimeCommitment, // Store formatted time commitment
                resources: selectedResources,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.currentUser.uid
            };

            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('knowledgePaths')
                .add(pathData);

            this.hideModal();
            this.loadPaths();
            alert('Knowledge path created successfully!');
        } catch (error) {
            console.error('Error saving knowledge path:', error);
            alert(`Error saving knowledge path: ${error.message}`);
        }
    }

    async loadPaths() {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const paths = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('knowledgePaths')
                .orderBy('createdAt', 'desc')
                .get();

            this.container.innerHTML = '';
            
            if (paths.empty) {
                this.container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-road"></i>
                        <h3>No Knowledge Paths Yet</h3>
                        <p>Create your first knowledge path to start organizing your learning journey.</p>
                    </div>
                `;
                return;
            }

            paths.forEach(doc => {
                this.renderPathCard(doc.id, doc.data());
            });
        } catch (error) {
            console.error('Error loading knowledge paths:', error);
            this.container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Paths</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    renderPathCard(id, path) {
        const progress = this.calculateProgress(path);
        const card = document.createElement('div');
        card.className = 'kp-path-card';
        card.onclick = () => this.showPathDetails(id, path);
        
        // Format the target date for display
        const targetDateDisplay = path.targetDate ? 
            new Date(path.targetDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Not set';

        card.innerHTML = `
            <div class="kp-path-header">
                <h3 class="kp-path-title">${path.title}</h3>
                <span class="kp-path-date">${this.formatDate(path.createdAt)}</span>
            </div>
            <p class="kp-path-description">${path.description || 'No description provided'}</p>
            <div class="kp-path-goals">
                <div class="kp-goal-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Target completion: ${targetDateDisplay}</span>
                </div>
                <div class="kp-goal-item">
                    <i class="fas fa-clock"></i>
                    <span>Time commitment: ${path.timeCommitment || 'Not specified'}</span>
                </div>
            </div>
            <div class="kp-progress-container">
                <div class="kp-progress-bar">
                    <div class="kp-progress-fill" style="width: ${progress}%"></div>
                </div>
                <p class="kp-progress-text">${progress}% Complete</p>
            </div>
        `;
        this.container.appendChild(card);
    }

    async showPathDetails(pathId, path) {
        this.container.innerHTML = `
            <div class="kp-path-details">
                <div class="kp-path-details-header">
                    <button class="kp-back-button" onclick="knowledgePath.loadPaths()">
                        <i class="fas fa-arrow-left"></i> Back to Paths
                    </button>
                    <div class="kp-path-header-actions">
                        <div class="kp-header-with-info">
                            <h2>${path.title}</h2>
                            <button onclick="knowledgePath.editPathInfo('${pathId}', ${JSON.stringify(path).replace(/"/g, '&quot;')})" class="kp-btn-icon">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        <button onclick="knowledgePath.deletePath('${pathId}', '${path.title}')" class="kp-btn-danger">
                            <i class="fas fa-trash"></i> Delete Path
                        </button>
                    </div>
                </div>
                
                <div class="kp-path-goals-detail">
                    <div class="kp-goal-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Target completion: ${path.targetDate ? new Date(path.targetDate).toLocaleDateString() : 'Not set'}</span>
                        <button onclick="knowledgePath.editTargetDate('${pathId}')" class="kp-btn-icon">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                    <div class="kp-goal-item">
                        <i class="fas fa-clock"></i>
                        <span>Time commitment: ${path.timeCommitment || 'Not set'}</span>
                        <button onclick="knowledgePath.editTimeCommitment('${pathId}')" class="kp-btn-icon">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>

                <div class="kp-path-content">
                    <div class="kp-path-resources">
                        <div class="kp-section-header">
                            <h3>Resources</h3>
                            <button onclick="knowledgePath.addResourceToPath('${pathId}')" class="kp-btn-primary">
                                <i class="fas fa-plus"></i> Add Resource
                            </button>
                        </div>
                        <div class="kp-resources-list">
                            ${await this.renderPathResources(pathId, path.resources || [])}
                        </div>
                    </div>

                    <div class="kp-path-notes">
                        <div class="kp-section-header">
                            <h3>Learning Notes</h3>
                            <button onclick="knowledgePath.editNotes('${pathId}')" class="kp-btn-primary">
                                <i class="fas fa-edit"></i> Edit Notes
                            </button>
                        </div>
                        <div class="kp-notes-content">
                            ${path.notes || '<p class="kp-empty-note">No notes added yet. Click Edit Notes to start documenting your learning journey.</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderPathResources(pathId, resources) {
        if (!resources || resources.length === 0) {
            return `
                <div class="kp-empty-resources">
                    <p>No resources added yet.</p>
                    <button onclick="knowledgePath.showAddResourceModal('${pathId}')" class="kp-btn-primary">
                        <i class="fas fa-plus"></i> Add Resources
                    </button>
                </div>
            `;
        }

        const resourcesHTML = await Promise.all(resources.map(async (resource) => {
            const resourceDoc = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('resources')
                .doc(resource.id)
                .get();

            const resourceData = resourceDoc.data();
            if (!resourceData) return ''; // Skip if resource doesn't exist

            const statusClasses = {
                pending: 'kp-status-pending',
                'in-progress': 'kp-status-progress',
                completed: 'kp-status-completed'
            };

            const completedDate = resource.completedAt ? 
                new Date(resource.completedAt).toLocaleDateString() : '';
            
            const completedInfo = resource.status === 'completed' && completedDate ? 
                `<div class="kp-completion-date">Completed: ${completedDate}</div>` : '';

            return `
    <div class="kp-resource-item ${statusClasses[resource.status || 'pending']}">
        <div class="kp-resource-status">
            <select onchange="knowledgePath.updateResourceStatus('${pathId}', '${resource.id}', this.value)"
                    class="kp-status-select ${statusClasses[resource.status || 'pending']}">
                <option value="pending" ${resource.status === 'pending' ? 'selected' : ''}>
                    To Do
                </option>
                <option value="in-progress" ${resource.status === 'in-progress' ? 'selected' : ''}>
                    In Progress
                </option>
                <option value="completed" ${resource.status === 'completed' ? 'selected' : ''}>
                    Completed
                </option>
            </select>
        </div>
        <div class="kp-resource-content">
            <h4>${resourceData.title}</h4>
            <p>${resourceData.description || ''}</p>
            <div class="kp-resource-meta">
                <span class="kp-resource-type">${resourceData.type || 'Resource'}</span>
                <a href="${resourceData.url}" target="_blank" class="kp-resource-link">
                    <i class="fas fa-external-link-alt"></i> Open Resource
                </a>
                ${completedInfo}
            </div>
        </div>
        <div class="kp-resource-actions">
            <button onclick="knowledgePath.removeResource('${pathId}', '${resource.id}')" 
                    class="kp-btn-icon" title="Remove from path">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
`;
        }));

        return resourcesHTML.join('');
    }

    async updateResourceStatus(pathId, resourceId, newStatus) {
        try {
            const pathRef = this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('knowledgePaths')
                .doc(pathId);

            const pathDoc = await pathRef.get();
            const path = pathDoc.data();
            
            const resources = path.resources.map(r => {
                if (r.id === resourceId) {
                    return {
                        ...r,
                        status: newStatus,
                        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
                    };
                }
                return r;
            });

            await pathRef.update({
                resources: resources,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Refresh the view with the updated data
            this.showPathDetails(pathId, { ...path, resources });
        } catch (error) {
            console.error('Error updating resource status:', error);
            alert('Error updating resource status. Please try again.');
        }
    }

    calculateProgress(path) {
        if (!path.resources || path.resources.length === 0) return 0;
        const completed = path.resources.filter(r => r.status === 'completed').length;
        return Math.round((completed / path.resources.length) * 100);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Just now';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }

    async editGoal(pathId, goalType) {
        let value;
        if (goalType === 'targetDate') {
            value = await this.showDatePicker();
        } else {
            value = prompt('Enter time commitment (e.g., "2 hours per week"):');
        }

        if (value) {
            try {
                await this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId)
                    .update({
                        [goalType]: value,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                // Refresh the view
                const pathDoc = await this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId)
                    .get();
                
                this.showPathDetails(pathId, pathDoc.data());
            } catch (error) {
                console.error('Error updating goal:', error);
                alert('Error updating goal. Please try again.');
            }
        }
    }

    async toggleResourceStatus(pathId, resourceId) {
        try {
            const pathRef = this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('knowledgePaths')
                .doc(pathId);

            const pathDoc = await pathRef.get();
            if (!pathDoc.exists) {
                throw new Error('Path not found');
            }

            const path = pathDoc.data();
            
            // Update the specific resource's status
            const updatedResources = path.resources.map(resource => {
                if (resource.id === resourceId) {
                    const newStatus = resource.status === 'completed' ? 'pending' : 'completed';
                    return {
                        ...resource,
                        status: newStatus,
                        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
                    };
                }
                return resource;
            });

            // Update Firestore - serverTimestamp only for the top-level updatedAt field
            await pathRef.update({
                resources: updatedResources,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update the UI
            const updatedPath = {
                ...path,
                resources: updatedResources
            };
            
            this.showPathDetails(pathId, updatedPath);
        } catch (error) {
            console.error('Detailed error:', error);
            alert('Error updating resource status. Please try again.');
        }
    }

    async editNotes(pathId) {
        const pathDoc = await this.db.collection('users')
            .doc(this.currentUser.uid)
            .collection('knowledgePaths')
            .doc(pathId)
            .get();
        
        const path = pathDoc.data();

        const modal = document.createElement('div');
        modal.className = 'kp-modal';
        modal.innerHTML = `
        <div class="kp-modal-content kp-notes-editor-modal">
            <span class="kp-close">&times;</span>
            <h2>Edit Path Notes</h2>
                
                <div id="notesToolbar" class="kp-notes-toolbar">
                    <span class="ql-formats">
                        <select class="ql-header">
                            <option value="1">Heading 1</option>
                            <option value="2">Heading 2</option>
                            <option value="3">Heading 3</option>
                            <option value="">Normal</option>
                        </select>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                        <button class="ql-strike"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-list" value="ordered"></button>
                        <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-link"></button>
                        <button class="ql-image"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-code-block"></button>
                        <select class="ql-color">
                            <option value="red"></option>
                            <option value="green"></option>
                            <option value="blue"></option>
                            <option value="purple"></option>
                            <option value="orange"></option>
                        </select>
                        <select class="ql-background"></select>
                    </span>
                </div>
                <div id="notesEditor" class="kp-notes-editor">
                    ${path.notes || ''}
                </div>
                
                <div class="kp-modal-actions">
                    <button id="saveNotes" class="kp-btn-primary">Save Notes</button>
                    <button class="kp-btn-secondary kp-close-modal">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize Quill editor
        const quill = new Quill('#notesEditor', {
            theme: 'snow',
            modules: {
                toolbar: '#notesToolbar'
            }
        });

        // Set existing content
        quill.root.innerHTML = path.notes || '';

        // Handle save
        document.getElementById('saveNotes').addEventListener('click', async () => {
            try {
                await this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId)
                    .update({
                        notes: quill.root.innerHTML,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                modal.remove();
                this.showPathDetails(pathId, {
                    ...path,
                    notes: quill.root.innerHTML
                });
            } catch (error) {
                console.error('Error saving notes:', error);
                alert('Error saving notes. Please try again.');
            }
        });

        // Handle close
        const closeButtons = modal.querySelectorAll('.kp-close, .kp-close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => modal.remove());
        });
    }

    async deletePath(pathId, pathTitle) {
        const confirmation = confirm(
            `Are you sure you want to delete "${pathTitle}"?\n\n` +
            `This will permanently delete:\n` +
            `- All progress tracking for resources in this path\n` +
            `- All notes associated with this path\n` +
            `- All learning goals and time commitments\n\n` +
            `This action cannot be undone.`
        );

        if (confirmation) {
            try {
                await this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId)
                    .delete();

                this.loadPaths();
            } catch (error) {
                console.error('Error deleting path:', error);
                alert('Error deleting path. Please try again.');
            }
        }
    }

    async addResourceToPath(pathId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';

        try {
            const resources = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('resources')
                .get();

            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Add Resources to Path</h2>
                    <input type="text" class="resource-search" placeholder="Search resources..." />
                    <div class="resources-selection">
                        ${resources.empty ? 
                            '<p>No resources available. Create some resources first!</p>' :
                            resources.docs.map(doc => `
                                <div class="resource-selection-item" data-title="${doc.data().title.toLowerCase()}">
                                    <input type="checkbox" id="add-resource-${doc.id}" value="${doc.id}" 
                                           data-title="${doc.data().title}">
                                    <label for="add-resource-${doc.id}">
                                        ${doc.data().title}
                                    </label>
                                </div>
                            `).join('')
                        }
                    </div>
                    <div class="modal-actions">
                        <button id="saveNewResources" class="btn-primary">Add Selected</button>
                        <button class="btn-secondary close-modal">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add search functionality
            const searchInput = modal.querySelector('.resource-search');
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const items = modal.querySelectorAll('.resource-selection-item');
                
                items.forEach(item => {
                    const title = item.dataset.title;
                    if (title.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // Handle closing modal
            const closeModal = () => {
                modal.remove();
            };

            modal.querySelector('.close').addEventListener('click', closeModal);
            modal.querySelector('.close-modal').addEventListener('click', closeModal);

            // Handle saving resources
            modal.querySelector('#saveNewResources').addEventListener('click', async () => {
                const selectedResources = Array.from(
                    modal.querySelectorAll('.resource-selection-item input[type="checkbox"]:checked')
                ).map(checkbox => ({
                    id: checkbox.value,
                    title: checkbox.dataset.title,
                    status: 'pending',
                    addedAt: new Date().toISOString()
                }));

                if (selectedResources.length === 0) {
                    alert('Please select at least one resource');
                    return;
                }

                try {
                    const pathRef = this.db.collection('users')
                        .doc(this.currentUser.uid)
                        .collection('knowledgePaths')
                        .doc(pathId);

                    const pathDoc = await pathRef.get();
                    const path = pathDoc.data();
                    const currentResources = path.resources || [];

                    // Add new resources
                    await pathRef.update({
                        resources: [...currentResources, ...selectedResources],
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    closeModal();
                    this.showPathDetails(pathId, { ...path, resources: [...currentResources, ...selectedResources] });
                } catch (error) {
                    console.error('Error adding resources:', error);
                    alert('Error adding resources. Please try again.');
                }
            });

        } catch (error) {
            console.error('Error loading resources:', error);
            alert('Error loading resources. Please try again.');
        }
    }

    async editTargetDate(pathId) {
        const modal = document.createElement('div');
        modal.className = 'kp-modal kp-edit-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="kp-modal-content">
                <span class="kp-close">&times;</span>
                <h2>Edit Target Completion Date</h2>
                <div class="kp-edit-field">
                    <input type="date" id="newTargetDate" class="kp-date-input">
                </div>
                <div class="kp-modal-actions">
                    <button id="saveTargetDate" class="kp-btn-primary">Save</button>
                    <button class="kp-btn-secondary kp-close-modal">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle closing modal
        const closeModal = () => modal.remove();
        modal.querySelector('.kp-close').addEventListener('click', closeModal);
        modal.querySelector('.kp-close-modal').addEventListener('click', closeModal);

        // Handle saving
        modal.querySelector('#saveTargetDate').addEventListener('click', async () => {
            const newDate = document.getElementById('newTargetDate').value;
            if (!newDate) {
                alert('Please select a date');
                return;
            }

            try {
                const pathRef = this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId);

                await pathRef.update({
                    targetDate: newDate,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const updatedPath = (await pathRef.get()).data();
                closeModal();
                this.showPathDetails(pathId, updatedPath);
            } catch (error) {
                console.error('Error updating target date:', error);
                alert('Error updating target date. Please try again.');
            }
        });
    }

    async editTimeCommitment(pathId) {
        const modal = document.createElement('div');
        modal.className = 'kp-modal kp-edit-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
        <div class="kp-modal-content">
            <span class="kp-close">&times;</span>
            <h2>Edit Time Commitment</h2>
            <div class="kp-edit-field">
                <select id="newTimeCommitment" class="kp-time-select">
                    <option value="1 hour per week">1 hour per week</option>
                    <option value="2 hours per week">2 hours per week</option>
                    <option value="5 hours per week">5 hours per week</option>
                    <option value="10 hours per week">10 hours per week</option>
                </select>
            </div>
            <div class="kp-modal-actions">
                <button id="saveTimeCommitment" class="kp-btn-primary">Save</button>
                <button class="kp-btn-secondary kp-close-modal">Cancel</button>
            </div>
        </div>
    `;
    

        document.body.appendChild(modal);

        // Handle closing modal
        const closeModal = () => modal.remove();
        modal.querySelector('.kp-close').addEventListener('click', closeModal);
        modal.querySelector('.kp-close-modal').addEventListener('click', closeModal);

        // Handle saving
        modal.querySelector('#saveTimeCommitment').addEventListener('click', async () => {
            const newTimeCommitment = document.getElementById('newTimeCommitment').value;
            
            try {
                const pathRef = this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId);

                await pathRef.update({
                    timeCommitment: newTimeCommitment,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const updatedPath = (await pathRef.get()).data();
                closeModal();
                this.showPathDetails(pathId, updatedPath);
            } catch (error) {
                console.error('Error updating time commitment:', error);
                alert('Error updating time commitment. Please try again.');
            }
        });
    }

    showPathInfo() {
        const infoModal = document.createElement('div');
        infoModal.className = 'kp-info-modal';
        infoModal.innerHTML = `
            <div class="kp-info-content">
                <h3>About Knowledge Paths</h3>
                <div class="kp-info-body">
                    <p>Knowledge Paths help you organize your learning journey by:</p>
                    <ul>
                        <li>Creating structured learning paths with specific goals</li>
                        <li>Tracking progress through your selected resources</li>
                        <li>Setting time commitments and target dates</li>
                        <li>Taking notes as you learn</li>
                    </ul>
                    <p>Tips for success:</p>
                    <ul>
                        <li>Break down large topics into manageable paths</li>
                        <li>Add relevant resources in a logical order</li>
                        <li>Set realistic time commitments</li>
                        <li>Update your progress regularly</li>
                    </ul>
                </div>
                <button class="kp-btn-primary kp-close-info">Got it!</button>
            </div>
        `;
        
        document.body.appendChild(infoModal);
        
        const closeBtn = infoModal.querySelector('.kp-close-info');
        closeBtn.onclick = () => infoModal.remove();
        
        // Close on click outside
        infoModal.onclick = (e) => {
            if (e.target === infoModal) infoModal.remove();
        };
    }

    async editPathInfo(pathId, path) {
        const modal = document.createElement('div');
        modal.className = 'kp-modal kp-edit-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="kp-modal-content">
                <span class="kp-close">&times;</span>
                <h2>Edit Path Information</h2>
                <div class="kp-edit-field">
                    <label for="editPathTitle">Title</label>
                    <input type="text" id="editPathTitle" class="kp-input" value="${path.title}" required>
                </div>
                <div class="kp-edit-field">
                    <label for="editPathDescription">Description</label>
                    <textarea id="editPathDescription" class="kp-input" rows="3">${path.description || ''}</textarea>
                </div>
                <div class="kp-modal-actions">
                    <button id="savePathInfo" class="kp-btn-primary">Save Changes</button>
                    <button class="kp-btn-secondary kp-close-modal">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle closing modal
        const closeModal = () => modal.remove();
        modal.querySelector('.kp-close').addEventListener('click', closeModal);
        modal.querySelector('.kp-close-modal').addEventListener('click', closeModal);

        // Handle saving
        modal.querySelector('#savePathInfo').addEventListener('click', async () => {
            const newTitle = document.getElementById('editPathTitle').value.trim();
            const newDescription = document.getElementById('editPathDescription').value.trim();

            if (!newTitle) {
                alert('Title is required');
                return;
            }

            try {
                const pathRef = this.db.collection('users')
                    .doc(this.currentUser.uid)
                    .collection('knowledgePaths')
                    .doc(pathId);

                await pathRef.update({
                    title: newTitle,
                    description: newDescription,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                const updatedPath = (await pathRef.get()).data();
                closeModal();
                this.showPathDetails(pathId, updatedPath);
            } catch (error) {
                console.error('Error updating path information:', error);
                alert('Error updating path information. Please try again.');
            }
        });
    }

    // ... Additional methods for CRUD operations ...
}

// Initialize the knowledge path functionality when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.knowledgePath = new KnowledgePath();
});

