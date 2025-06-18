// Enhanced 2030 UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        searchInput: document.getElementById('symptom-search'),
        aiAssistBtn: document.getElementById('ai-assist-btn'),
        predictBtn: document.getElementById('predict-btn'),
        selectedContainer: document.getElementById('selected-symptoms'),
        suggestionsDropdown: document.getElementById('symptom-suggestions'),
        resultsSection: document.getElementById('results-section'),
        predictedDisease: document.getElementById('predicted-disease'),
        confidenceFill: document.getElementById('confidence-fill'),
        confidenceValue: document.getElementById('confidence-value'),
        confidenceBadge: document.getElementById('confidence-badge'),
        recommendationsGrid: document.getElementById('recommendations-grid'),
        newAnalysisBtn: document.querySelector('.new-analysis-button')
    };

    // State
    let state = {
        selectedSymptoms: [],
        symptomsDatabase: [
            "fever", "headache", "nausea", "fatigue", "cough", 
            "sore throat", "muscle pain", "dizziness", "shortness of breath",
            "chest pain", "abdominal pain", "diarrhea", "vomiting", "rash",
            "joint pain", "back pain", "chills", "sweating", "weight loss",
            "loss of appetite", "weakness", "blurred vision", "frequent urination",
            "constipation", "heartburn", "swelling", "numbness", "tingling"
        ],
        diseaseData: {
            "Common Cold": {
                confidence: 78,
                recommendations: [
                    { icon: "🛌", text: "Get plenty of rest" },
                    { icon: "💧", text: "Stay hydrated with warm fluids" },
                    { icon: "🌡️", text: "Monitor temperature regularly" },
                    { icon: "💊", text: "OTC cold medicine as needed" }
                ]
            },
            "Influenza": {
                confidence: 85,
                recommendations: [
                    { icon: "🏠", text: "Isolate to prevent spread" },
                    { icon: "💊", text: "Antiviral medication if early" },
                    { icon: "🌡️", text: "Fever reducers as needed" },
                    { icon: "🏥", text: "Seek ER if severe symptoms" }
                ]
            },
            "Migraine": {
                confidence: 92,
                recommendations: [
                    { icon: "🌑", text: "Rest in dark, quiet room" },
                    { icon: "🧊", text: "Cold compress on forehead" },
                    { icon: "💧", text: "Hydrate with electrolytes" },
                    { icon: "📝", text: "Track triggers in journal" }
                ]
            },
            "Food Poisoning": {
                confidence: 81,
                recommendations: [
                    { icon: "🚽", text: "Rest near bathroom" },
                    { icon: "💧", text: "Small sips of water often" },
                    { icon: "🍌", text: "BRAT diet when ready" },
                    { icon: "🧼", text: "Wash hands frequently" }
                ]
            }
        }
    };

    // Initialize
    init();

    function init() {
        setupEventListeners();
        updateSelectedSymptomsDisplay();
    }

    function setupEventListeners() {
        // Search input interactions
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('focus', handleSearchInput);
        
        // AI Assist button
        elements.aiAssistBtn.addEventListener('click', simulateAIAssist);
        
        // Predict button
        elements.predictBtn.addEventListener('click', runPrediction);
        
        // New analysis button
        elements.newAnalysisBtn.addEventListener('click', resetAnalysis);
        
        // Allow adding symptom by pressing Enter
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCurrentSymptom();
            }
        });
    }

    function handleSearchInput() {
        const searchTerm = elements.searchInput.value.toLowerCase();
        
        if (searchTerm.length === 0) {
            elements.suggestionsDropdown.style.display = 'none';
            return;
        }
        
        // Filter matching symptoms not already selected
        const matchingSymptoms = state.symptomsDatabase.filter(symptom => 
            symptom.toLowerCase().includes(searchTerm) && 
            !state.selectedSymptoms.includes(symptom)
        );
        
        displaySuggestions(matchingSymptoms);
    }

    function displaySuggestions(symptoms) {
        elements.suggestionsDropdown.innerHTML = '';
        
        if (symptoms.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'suggestion-item';
            noResults.textContent = 'No matches found';
            elements.suggestionsDropdown.appendChild(noResults);
        } else {
            symptoms.forEach(symptom => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = symptom;
                
                item.addEventListener('click', () => {
                    addSymptom(symptom);
                    elements.searchInput.value = '';
                    elements.suggestionsDropdown.style.display = 'none';
                });
                
                elements.suggestionsDropdown.appendChild(item);
            });
        }
        
        elements.suggestionsDropdown.style.display = 'block';
    }

    function addCurrentSymptom() {
        const symptom = elements.searchInput.value.trim();
        
        if (symptom && !state.selectedSymptoms.includes(symptom) && 
            state.symptomsDatabase.includes(symptom)) {
            addSymptom(symptom);
            elements.searchInput.value = '';
            elements.suggestionsDropdown.style.display = 'none';
        }
    }

    function addSymptom(symptom) {
        if (!state.selectedSymptoms.includes(symptom)) {
            state.selectedSymptoms.push(symptom);
            updateSelectedSymptomsDisplay();
            
            // Animate the new symptom tag
            const tags = document.querySelectorAll('.symptom-tag');
            const newTag = tags[tags.length - 1];
            newTag.style.transform = 'scale(0.9)';
            setTimeout(() => {
                newTag.style.transform = 'scale(1)';
            }, 100);
        }
    }

    function removeSymptom(symptom) {
        state.selectedSymptoms = state.selectedSymptoms.filter(s => s !== symptom);
        updateSelectedSymptomsDisplay();
    }

    function updateSelectedSymptomsDisplay() {
        elements.selectedContainer.innerHTML = '';
        
        if (state.selectedSymptoms.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'symptom-tag';
            placeholder.textContent = 'No symptoms selected';
            placeholder.style.opacity = '0.6';
            elements.selectedContainer.appendChild(placeholder);
            return;
        }
        
        state.selectedSymptoms.forEach(symptom => {
            const tag = document.createElement('div');
            tag.className = 'symptom-tag';
            
            const text = document.createElement('span');
            text.textContent = symptom;
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => removeSymptom(symptom));
            
            tag.appendChild(text);
            tag.appendChild(removeBtn);
            elements.selectedContainer.appendChild(tag);
        });
    }

    function simulateAIAssist() {
        elements.aiAssistBtn.disabled = true;
        elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⚡</span> Analyzing...';
        
        // Simulate AI processing
        setTimeout(() => {
            // AI would analyze input and suggest relevant symptoms
            const currentInput = elements.searchInput.value.toLowerCase();
            let suggestedSymptoms = [];
            
            if (currentInput.includes('head')) {
                suggestedSymptoms = ['headache', 'migraine', 'light sensitivity'];
            } else if (currentInput.includes('stomach')) {
                suggestedSymptoms = ['nausea', 'abdominal pain', 'vomiting', 'diarrhea'];
            } else {
                // Default to random suggestions if no clear pattern
                suggestedSymptoms = state.symptomsDatabase
                    .filter(s => !state.selectedSymptoms.includes(s))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);
            }
            
            displaySuggestions(suggestedSymptoms);
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
        }, 1500);
    }

    function runPrediction() {
        if (state.selectedSymptoms.length === 0) {
            showTemporaryMessage('Please select at least one symptom');
            return;
        }
        
        // UI Loading state
        elements.predictBtn.disabled = true;
        elements.predictBtn.querySelector('.button-text').textContent = 'Analyzing Patterns';
        elements.predictBtn.querySelector('.button-icon').textContent = '⌛';
        
        // Simulate neural network processing
        setTimeout(() => {
            // Determine prediction based on symptoms
            let predictedDisease = "Unknown Condition";
            let confidence = 0;
            let recommendations = [];
            
            // Simple mock prediction logic
            if (state.selectedSymptoms.includes("fever") && 
                state.selectedSymptoms.includes("cough")) {
                predictedDisease = "Common Cold";
            } 
            else if (state.selectedSymptoms.includes("fever") && 
                     state.selectedSymptoms.includes("muscle pain")) {
                predictedDisease = "Influenza";
            }
            else if (state.selectedSymptoms.includes("headache") && 
                     state.selectedSymptoms.includes("nausea")) {
                predictedDisease = "Migraine";
            }
            else if (state.selectedSymptoms.includes("vomiting") && 
                     state.selectedSymptoms.includes("diarrhea")) {
                predictedDisease = "Food Poisoning";
            }
            
            // Get data from our disease database
            const diseaseInfo = state.diseaseData[predictedDisease] || {
                confidence: Math.floor(Math.random() * 30) + 50,
                recommendations: [
                    { icon: "👨‍⚕️", text: "Consult a healthcare professional" },
                    { icon: "📞", text: "Contact your primary care provider" },
                    { icon: "⚠️", text: "Seek emergency care if severe" }
                ]
            };
            
            // Display results
            displayResults(
                predictedDisease,
                diseaseInfo.confidence,
                diseaseInfo.recommendations
            );
            
            // Reset button
            elements.predictBtn.disabled = false;
            elements.predictBtn.querySelector('.button-text').textContent = 'Run Neural Analysis';
            elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
        }, 2500);
    }

    function displayResults(disease, confidence, recommendations) {
        // Update disease name
        elements.predictedDisease.textContent = disease;
        
        // Animate confidence meter
        elements.confidenceValue.textContent = `${confidence}%`;
        elements.confidenceBadge.style.setProperty('--confidence', confidence);
        
        // Color confidence badge based on value
        if (confidence > 85) {
            elements.confidenceBadge.style.background = 'rgba(0, 206, 201, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(0, 206, 201, 0.3)';
            elements.confidenceBadge.style.color = 'var(--secondary)';
        } else if (confidence > 70) {
            elements.confidenceBadge.style.background = 'rgba(253, 121, 168, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(253, 121, 168, 0.3)';
            elements.confidenceBadge.style.color = 'var(--accent)';
        } else {
            elements.confidenceBadge.style.background = 'rgba(255, 193, 7, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(255, 193, 7, 0.3)';
            elements.confidenceBadge.style.color = '#FFC107';
        }
        
        // Animate confidence fill
        elements.confidenceFill.style.width = '0';
        setTimeout(() => {
            elements.confidenceFill.style.width = `${confidence}%`;
        }, 100);
        
        // Update recommendations
        elements.recommendationsGrid.innerHTML = '';
        recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-text">${rec.text}</div>
            `;
            elements.recommendationsGrid.appendChild(card);
        });
        
        // Show results section with animation
        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.style.opacity = '0';
        elements.resultsSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            elements.resultsSection.style.opacity = '1';
            elements.resultsSection.style.transform = 'translateY(0)';
        }, 50);
        
        // Scroll to results
        setTimeout(() => {
            elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }

    function resetAnalysis() {
        // Reset selected symptoms
        state.selectedSymptoms = [];
        updateSelectedSymptomsDisplay();
        
        // Clear search
        elements.searchInput.value = '';
        elements.suggestionsDropdown.style.display = 'none';
        
        // Hide results
        elements.resultsSection.classList.add('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showTemporaryMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.className = 'temp-message';
        msgElement.textContent = message;
        document.body.appendChild(msgElement);
        
        setTimeout(() => {
            msgElement.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(msgElement);
            }, 300);
        }, 3000);
    }
});