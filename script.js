// Enhanced 2030 UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    // --- GEMINI API KEY ---
    // IMPORTANT: Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API key.
    // For security, in a real application, this key should NOT be hardcoded directly in client-side JavaScript.
    // It should be handled via a backend proxy or environment variables that inject it securely.
    const GEMINI_API_KEY = 'AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4';

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
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('focus', handleSearchInput);
        elements.aiAssistBtn.addEventListener('click', simulateAIAssist);
        elements.predictBtn.addEventListener('click', runPrediction);
        elements.newAnalysisBtn.addEventListener('click', resetAnalysis);
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCurrentSymptom();
            }
        });
        document.addEventListener('click', (e) => {
            if (!elements.searchInput.contains(e.target) && !elements.suggestionsDropdown.contains(e.target)) {
                elements.suggestionsDropdown.style.display = 'none';
            }
        });
    }

    function handleSearchInput() {
        const searchTerm = elements.searchInput.value.toLowerCase();
        if (searchTerm.length === 0) {
            elements.suggestionsDropdown.style.display = 'none';
            return;
        }
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
            state.symptomsDatabase.includes(symptom)) { // Ensure symptom is in our known database for this action
            addSymptom(symptom);
            elements.searchInput.value = '';
            elements.suggestionsDropdown.style.display = 'none';
        } else if (symptom && !state.symptomsDatabase.includes(symptom)) {
            // Optionally handle unknown symptoms, e.g., show message or allow adding if desired
            console.warn(`Symptom "${symptom}" not in database. Not added by Enter key.`);
        }
    }

    function addSymptom(symptom) {
        if (!state.selectedSymptoms.includes(symptom)) {
            state.selectedSymptoms.push(symptom);
            updateSelectedSymptomsDisplay();
            const tags = document.querySelectorAll('.symptom-tag');
            if (tags.length > 0) {
                const newTag = tags[tags.length - 1];
                newTag.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    newTag.style.transform = 'scale(1)';
                }, 100);
            }
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
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', () => removeSymptom(symptom));
            tag.appendChild(text);
            tag.appendChild(removeBtn);
            elements.selectedContainer.appendChild(tag);
        });
    }

    // Wrapped original mock AI Assist logic
    function performMockAIAssist(currentInputParam) {
        let suggestedSymptoms = [];
        if (currentInputParam.includes('head')) {
            suggestedSymptoms = ['headache', 'dizziness', 'blurred vision'];
        } else if (currentInputParam.includes('stomach')) {
            suggestedSymptoms = ['nausea', 'abdominal pain', 'vomiting', 'diarrhea'];
        } else if (currentInputParam) { // Suggest based on any input
             suggestedSymptoms = state.symptomsDatabase
                .filter(s => s.toLowerCase().startsWith(currentInputParam.charAt(0)) && !state.selectedSymptoms.includes(s))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
        }
        if (suggestedSymptoms.length === 0) { // Fallback if no specific match
            suggestedSymptoms = state.symptomsDatabase
                .filter(s => !state.selectedSymptoms.includes(s))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
        }
        displaySuggestions(suggestedSymptoms.filter(s => s));
        elements.aiAssistBtn.disabled = false;
        elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
    }

    function simulateAIAssist() {
        elements.aiAssistBtn.disabled = true;
        elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⚡</span> Analyzing...';
        const currentInput = elements.searchInput.value.toLowerCase();

        // --- Hypothetical Gemini API Integration for AI Assist ---
        // Uncomment the block below and replace API key to use Gemini.
        /*
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || !GEMINI_API_KEY) {
            console.warn("Gemini API Key not set or is placeholder. AI Assist will use mock data.");
            setTimeout(() => performMockAIAssist(currentInput), 1500); // Fallback to mock with delay
            return;
        }
        
        // Example: Using Gemini to get symptom suggestions
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Based on the partial medical symptom input "${currentInput}", suggest up to 3 related medical symptoms. These suggestions should not be in the following list of already selected symptoms: ${state.selectedSymptoms.join(', ')}. Provide only the symptom names, separated by commas. If the input is too vague or no good suggestions, return an empty string.`
                    }]
                }],
                // Optional: Add safetySettings if needed
                // safetySettings: [ { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" }, ... ] 
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Gemini AI Assist Response:", data);
            const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            let geminiSuggestions = geminiText.split(',')
                                      .map(s => s.trim().toLowerCase()) // Standardize to lowercase
                                      .filter(s => s && !state.selectedSymptoms.includes(s)); // Ensure not empty and not already selected
            
            // Further filter: only include suggestions that are in our known symptomsDatabase for consistency
            // Or, if you want Gemini to suggest novel symptoms, you might allow them or add them to a temporary list
            geminiSuggestions = geminiSuggestions.filter(s => state.symptomsDatabase.includes(s));


            if (geminiSuggestions.length > 0) {
                displaySuggestions(geminiSuggestions.slice(0, 3));
            } else {
                // Fallback to existing mock logic if Gemini fails or returns no relevant/valid suggestions
                performMockAIAssist(currentInput);
            }
        })
        .catch(error => {
            console.error("Error calling Gemini API for AI Assist:", error);
            performMockAIAssist(currentInput); // Fallback to mock on error
        })
        .finally(() => {
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
        });
        return; // Important: if using API, return here to prevent mock timeout from also running
        */

        // Default: Use mock AI processing with a delay
        setTimeout(() => performMockAIAssist(currentInput), 1500);
    }

    // Wrapped original mock prediction logic
    function performMockPrediction() {
        let predictedDisease = "Unknown Condition";
        // let confidence = 0; // This will be fetched from diseaseData

        if (state.selectedSymptoms.includes("fever") && state.selectedSymptoms.includes("cough")) {
            predictedDisease = "Common Cold";
        } else if (state.selectedSymptoms.includes("fever") && state.selectedSymptoms.includes("muscle pain")) {
            predictedDisease = "Influenza";
        } else if (state.selectedSymptoms.includes("headache") && state.selectedSymptoms.includes("nausea")) {
            predictedDisease = "Migraine";
        } else if (state.selectedSymptoms.includes("vomiting") && state.selectedSymptoms.includes("diarrhea")) {
            predictedDisease = "Food Poisoning";
        } else if (state.selectedSymptoms.length > 0) {
            // Basic fallback for any other combination
            const commonSymptomsForFlu = ["fever", "cough", "sore throat", "muscle pain", "fatigue"];
            const commonSymptomsForCold = ["fever", "cough", "sore throat", "fatigue"];
            
            let fluScore = state.selectedSymptoms.filter(s => commonSymptomsForFlu.includes(s)).length;
            let coldScore = state.selectedSymptoms.filter(s => commonSymptomsForCold.includes(s)).length;

            if (fluScore >= 2 && fluScore > coldScore) predictedDisease = "Influenza";
            else if (coldScore >=2) predictedDisease = "Common Cold";
        }


        const diseaseInfo = state.diseaseData[predictedDisease] || {
            confidence: Math.floor(Math.random() * 20) + 50, // 50-69 for unknown
            recommendations: [
                { icon: "👨‍⚕️", text: "Consult a healthcare professional for diagnosis." },
                { icon: "📞", text: "Describe your symptoms to your doctor." },
                { icon: "⚠️", text: "Monitor symptoms; seek care if they worsen." }
            ]
        };

        displayResults(
            predictedDisease,
            diseaseInfo.confidence,
            diseaseInfo.recommendations
        );

        elements.predictBtn.disabled = false;
        elements.predictBtn.querySelector('.button-text').textContent = 'Run Neural Analysis';
        elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
    }

    function runPrediction() {
        if (state.selectedSymptoms.length === 0) {
            showTemporaryMessage('Please select at least one symptom');
            return;
        }

        elements.predictBtn.disabled = true;
        elements.predictBtn.querySelector('.button-text').textContent = 'Analyzing Patterns';
        elements.predictBtn.querySelector('.button-icon').textContent = '⌛';

        // --- Hypothetical Gemini API Integration for Prediction ---
        // Uncomment the block below and replace API key to use Gemini.
        /*
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE' || !GEMINI_API_KEY) {
            console.warn("Gemini API Key not set or is placeholder. Prediction will use mock data.");
            setTimeout(performMockPrediction, 2500); // Fallback to mock with delay
            return;
        }

        // Example: Using Gemini for prediction and recommendations
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Given the following medical symptoms: ${state.selectedSymptoms.join(', ')}. 
                               1. Predict a likely non-emergency medical condition.
                               2. Provide a confidence level for this prediction (integer between 50 and 95).
                               3. List 3-4 brief care recommendations, each with an appropriate emoji icon and short text.
                               Format the entire response strictly as a single JSON object like this: 
                               {"disease": "Condition Name", "confidence": 85, "recommendations": [{"icon": "🛌", "text": "Get rest"}, {"icon": "💧", "text": "Hydrate well"}, ...]}`
                    }]
                }],
                // Optional: Add safetySettings if needed for medical context, though be careful with blocking
                // safetySettings: [ { "category": "HARM_CATEGORY_MEDICAL", "threshold": "BLOCK_NONE" }, ... ] // Example
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Gemini Prediction Response:", data);
            try {
                const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!resultText) throw new Error("No text in Gemini response");

                // Attempt to parse the JSON output from Gemini
                // This requires careful prompt engineering for Gemini to return valid JSON.
                // Basic cleanup for potential markdown ```json ... ``` blocks
                const cleanedJsonText = resultText.trim().replace(/^```json\s*|```$/g, '');
                const parsedResult = JSON.parse(cleanedJsonText);

                if (parsedResult.disease && typeof parsedResult.confidence === 'number' && Array.isArray(parsedResult.recommendations)) {
                    displayResults(
                        parsedResult.disease,
                        parsedResult.confidence,
                        parsedResult.recommendations
                    );
                } else {
                    throw new Error("Gemini response missing required fields or incorrect format.");
                }
            } catch (e) {
                console.error("Error processing Gemini prediction response:", e, "Raw response text:", data.candidates?.[0]?.content?.parts?.[0]?.text);
                performMockPrediction(); // Fallback to mock logic
            }
        })
        .catch(error => {
            console.error("Error calling Gemini API for prediction:", error);
            performMockPrediction(); // Fallback to mock on error
        })
        .finally(() => {
            elements.predictBtn.disabled = false;
            elements.predictBtn.querySelector('.button-text').textContent = 'Run Neural Analysis';
            elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
        });
        return; // Important: if using API, return here to prevent mock timeout from also running
        */

        // Default: Use mock prediction logic with a delay
        setTimeout(performMockPrediction, 2500);
    }

    function displayResults(disease, confidence, recommendations) {
        elements.predictedDisease.textContent = disease;
        elements.confidenceValue.textContent = `${confidence}%`;
        elements.confidenceBadge.style.setProperty('--confidence-percent', confidence); // Use for CSS if needed

        const badge = elements.confidenceBadge;
        badge.className = 'confidence-badge'; // Reset classes
        if (confidence > 85) {
            badge.classList.add('high-confidence'); // Assumes CSS like .high-confidence { background: ..., border-color: ..., color: ... }
        } else if (confidence > 70) {
            badge.classList.add('medium-confidence');
        } else {
            badge.classList.add('low-confidence');
        }
        // Fallback inline styles if CSS classes are not fully set up
        if (!badge.classList.contains('high-confidence') && !badge.classList.contains('medium-confidence') && !badge.classList.contains('low-confidence')) {
            if (confidence > 85) {
                badge.style.background = 'rgba(0, 206, 201, 0.1)'; badge.style.borderColor = 'rgba(0, 206, 201, 0.3)'; badge.style.color = 'var(--secondary, #00cec9)';
            } else if (confidence > 70) {
                badge.style.background = 'rgba(253, 121, 168, 0.1)'; badge.style.borderColor = 'rgba(253, 121, 168, 0.3)'; badge.style.color = 'var(--accent, #fd79a8)';
            } else {
                badge.style.background = 'rgba(255, 193, 7, 0.1)'; badge.style.borderColor = 'rgba(255, 193, 7, 0.3)'; badge.style.color = '#FFC107';
            }
        }


        elements.confidenceFill.style.width = '0';
        setTimeout(() => {
            elements.confidenceFill.style.width = `${confidence}%`;
        }, 100);

        elements.recommendationsGrid.innerHTML = '';
        recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="rec-icon">${rec.icon || 'ℹ️'}</div>
                <div class="rec-text">${rec.text || 'Recommendation text missing.'}</div>
            `;
            elements.recommendationsGrid.appendChild(card);
        });

        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.style.opacity = '0';
        elements.resultsSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            elements.resultsSection.style.opacity = '1';
            elements.resultsSection.style.transform = 'translateY(0)';
            elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    function resetAnalysis() {
        state.selectedSymptoms = [];
        updateSelectedSymptomsDisplay();
        elements.searchInput.value = '';
        elements.suggestionsDropdown.style.display = 'none';
        elements.resultsSection.classList.add('hidden');
        elements.resultsSection.style.opacity = '0'; // Reset for next animation
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showTemporaryMessage(message) {
        const existingMsg = document.querySelector('.temp-message');
        if (existingMsg) existingMsg.remove();

        const msgElement = document.createElement('div');
        msgElement.className = 'temp-message';
        msgElement.textContent = message;
        document.body.appendChild(msgElement);

        // Force reflow for animation
        void msgElement.offsetWidth;
        msgElement.style.opacity = '1';
        msgElement.style.transform = 'translateY(0)';


        setTimeout(() => {
            msgElement.style.opacity = '0';
            msgElement.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.body.contains(msgElement)) {
                    document.body.removeChild(msgElement);
                }
            }, 300);
        }, 3000);
    }
});