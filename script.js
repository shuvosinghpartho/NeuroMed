// Medical Diagnostic Tool with Enhanced Gemini API Integration
document.addEventListener('DOMContentLoaded', () => {
    // --- GEMINI API KEY ---
    // Note: In production, this should be handled via a backend service
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
        newAnalysisBtn: document.querySelector('.new-analysis-button'),
        clinicalNotes: document.getElementById('clinical-notes')
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
        ]
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
        if (symptom && !state.selectedSymptoms.includes(symptom)) {
            addSymptom(symptom);
            elements.searchInput.value = '';
            elements.suggestionsDropdown.style.display = 'none';
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

    async function simulateAIAssist() {
        elements.aiAssistBtn.disabled = true;
        elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⚡</span> Analyzing...';
        const currentInput = elements.searchInput.value.toLowerCase();

        if (!currentInput) {
            showTemporaryMessage('Please enter a symptom to get AI suggestions');
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
            return;
        }

        try {
            const prompt = `As a medical professional, suggest 3-5 related symptoms for "${currentInput}" that would help diagnose a condition. 
            Already selected symptoms: ${state.selectedSymptoms.join(', ') || 'none'}. 
            Return ONLY a comma-separated list in lowercase, nothing else. Example: "headache,dizziness,blurred vision"`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_MEDICAL", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            const suggestionsText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const suggestions = suggestionsText.split(',')
                .map(s => s.trim().toLowerCase())
                .filter(s => s && !state.selectedSymptoms.includes(s) && state.symptomsDatabase.includes(s))
                .slice(0, 5);

            if (suggestions.length > 0) {
                displaySuggestions(suggestions);
            } else {
                performMockAIAssist(currentInput);
            }
        } catch (error) {
            console.error("AI Assist error:", error);
            performMockAIAssist(currentInput);
        } finally {
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
        }
    }

    function performMockAIAssist(currentInput) {
        let suggestedSymptoms = [];
        if (currentInput.includes('head')) {
            suggestedSymptoms = ['headache', 'dizziness', 'blurred vision', 'light sensitivity', 'neck stiffness'];
        } else if (currentInput.includes('stomach')) {
            suggestedSymptoms = ['nausea', 'abdominal pain', 'vomiting', 'diarrhea', 'bloating'];
        } else {
            suggestedSymptoms = state.symptomsDatabase
                .filter(s => !state.selectedSymptoms.includes(s))
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
        }
        displaySuggestions(suggestions.filter(s => s));
    }

    async function runPrediction() {
        if (state.selectedSymptoms.length === 0) {
            showTemporaryMessage('Please select at least one symptom');
            return;
        }

        elements.predictBtn.disabled = true;
        elements.predictBtn.querySelector('.button-text').textContent = 'Analyzing Patterns';
        elements.predictBtn.querySelector('.button-icon').textContent = '⌛';
        elements.clinicalNotes.textContent = '';

        try {
            const prompt = `Act as an experienced diagnostician. Analyze these symptoms: ${state.selectedSymptoms.join(', ')}.
            
            Provide response in this exact JSON format:
            {
                "disease": "Condition Name (or 'Unknown Condition')",
                "confidence": 50-95,
                "urgency": "routine/urgent/emergency",
                "recommendations": [
                    {"icon": "emoji", "text": "max 8 words"},
                    {"icon": "emoji", "text": "max 8 words"},
                    {"icon": "emoji", "text": "max 8 words"}
                ],
                "clinical_notes": "1-2 sentence professional assessment"
            }
            
            Guidelines:
            - Confidence: 95=very sure, 50=uncertain
            - Urgency: "emergency" for life-threatening conditions
            - Recommendations: actionable and practical
            - Notes: professional tone, no alarmist language`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_MEDICAL", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS", threshold: "BLOCK_NONE" }
                    ],
                    generationConfig: {
                        temperature: 0.2, // More deterministic responses
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const cleanedJsonText = resultText.replace(/^```json|```$/g, '').trim();
            const result = JSON.parse(cleanedJsonText);

            // Validate and normalize response
            const validatedResult = {
                disease: result.disease || "Unknown Condition",
                confidence: Math.min(95, Math.max(50, result.confidence || 50)),
                urgency: ["routine", "urgent", "emergency"].includes(result.urgency) ? result.urgency : "routine",
                recommendations: (result.recommendations || []).slice(0, 3).map(rec => ({
                    icon: rec.icon || "ℹ️",
                    text: rec.text ? rec.text.split('.').shift() : "Consult a doctor"
                })),
                clinical_notes: result.clinical_notes || "Professional evaluation recommended"
            };

            displayResults(validatedResult);

        } catch (error) {
            console.error("Prediction error:", error);
            displayResults({
                disease: "Unknown Condition",
                confidence: 65,
                urgency: "routine",
                recommendations: [
                    { icon: "👨‍⚕️", text: "Consult a healthcare professional" },
                    { icon: "📞", text: "Describe symptoms to your doctor" },
                    { icon: "⚠️", text: "Monitor for worsening symptoms" }
                ],
                clinical_notes: "Unable to generate diagnosis. Please consult a medical professional."
            });
        } finally {
            elements.predictBtn.disabled = false;
            elements.predictBtn.querySelector('.button-text').textContent = 'Run Neural Analysis';
            elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
        }
    }

    function displayResults(result) {
        // Update disease and confidence
        elements.predictedDisease.textContent = result.disease;
        elements.confidenceValue.textContent = `${result.confidence}%`;
        elements.confidenceFill.style.width = `${result.confidence}%`;
        
        // Update urgency indicator
        const urgencyColors = {
            emergency: "#ff4444",
            urgent: "#ffbb33",
            routine: "#00C851"
        };
        elements.confidenceBadge.style.borderColor = urgencyColors[result.urgency];
        elements.confidenceBadge.title = `Urgency: ${result.urgency}`;

        // Update recommendations
        elements.recommendationsGrid.innerHTML = '';
        result.recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-text">${rec.text}</div>
            `;
            elements.recommendationsGrid.appendChild(card);
        });

        // Update clinical notes
        elements.clinicalNotes.textContent = result.clinical_notes;

        // Show results with animation
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
        elements.clinicalNotes.textContent = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showTemporaryMessage(message) {
        const existingMsg = document.querySelector('.temp-message');
        if (existingMsg) existingMsg.remove();

        const msgElement = document.createElement('div');
        msgElement.className = 'temp-message';
        msgElement.textContent = message;
        document.body.appendChild(msgElement);

        void msgElement.offsetWidth;
        msgElement.style.opacity = '1';
        msgElement.style.transform = 'translateY(0)';

        setTimeout(() => {
            msgElement.style.opacity = '0';
            msgElement.style.transform = 'translateY(-20px)';
            setTimeout(() => msgElement.remove(), 300);
        }, 3000);
    }
});