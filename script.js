// AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4 <--- User provided key

// Gemini API SDK Import
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT SECURITY WARNING !!!
    // ... (rest of the warning as before) ...
    const GEMINI_API_KEY = "AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4";

    let genAI;
    let model;

    // DOM Elements
    const elements = {
        symptomDescription: document.getElementById('symptom-description'), // Changed from searchInput
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

    if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && GEMINI_API_KEY.startsWith("AIza")) {
        try {
            genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash-latest",
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
            });
            console.log("Gemini SDK Initialized successfully with model: gemini-1.5-flash-latest");
            // Set default text for report elements on successful init
            if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
            if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";


        } catch (error) {
            console.error("Error initializing Gemini SDK:", error);
            showTemporaryMessage("Failed to initialize AI. Check API Key and console.");
            if(elements.aiAssistBtn) elements.aiAssistBtn.disabled = true;
            if(elements.predictBtn) elements.predictBtn.disabled = true;
        }
    } else {
        console.warn("Gemini API Key is missing, invalid, or a placeholder. AI features will be disabled.");
        showTemporaryMessage("API Key missing/invalid. AI features disabled.");
        if(elements.aiAssistBtn) elements.aiAssistBtn.disabled = true;
        if(elements.predictBtn) elements.predictBtn.disabled = true;
    }

    // State
    let state = {
        selectedSymptoms: [], // Still used for AI Assist and tagged symptoms
        symptomsDatabase: [
            "fever", "headache", "nausea", "fatigue", "cough",
            "sore throat", "muscle pain", "dizziness", "shortness of breath",
            "chest pain", "abdominal pain", "diarrhea", "vomiting", "rash",
            "joint pain", "back pain", "chills", "sweating", "weight loss",
            "loss of appetite", "weakness", "blurred vision", "frequent urination",
            "constipation", "heartburn", "swelling", "numbness", "tingling",
            "runny nose", "body aches", "sore eyes", "light sensitivity",
            "injury", "swollen leg", "leg pain", "ankle pain", "difficulty walking" // Added some injury related
        ],
    };

    // Initialize UI parts
    initUI();

    function initUI() {
        setupEventListeners();
        updateSelectedSymptomsDisplay();
        if (!model) {
            if(elements.aiAssistBtn) elements.aiAssistBtn.disabled = true;
            if(elements.predictBtn) elements.predictBtn.disabled = true;
        }
         // Set default text for report elements on UI init
        if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
        if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";
        if(elements.confidenceFill) elements.confidenceFill.style.width = '0%';
        if(elements.recommendationsGrid) elements.recommendationsGrid.innerHTML = '';
    }

    function setupEventListeners() {
        if(elements.symptomDescription) elements.symptomDescription.addEventListener('input', handleSearchInput); // For local suggestions
        if(elements.symptomDescription) elements.symptomDescription.addEventListener('focus', handleSearchInput); // For local suggestions
        document.addEventListener('click', (event) => {
            if (elements.suggestionsDropdown && !elements.suggestionsDropdown.contains(event.target) && event.target !== elements.symptomDescription) {
                elements.suggestionsDropdown.style.display = 'none';
            }
        });
        if(elements.aiAssistBtn) elements.aiAssistBtn.addEventListener('click', callAIAssist);
        if(elements.predictBtn) elements.predictBtn.addEventListener('click', runPrediction);
        if(elements.newAnalysisBtn) elements.newAnalysisBtn.addEventListener('click', resetAnalysis);
    }

    function handleSearchInput() {
        if(!elements.symptomDescription || !elements.suggestionsDropdown) return;
        const searchTerm = elements.symptomDescription.value.toLowerCase();

        // For local suggestions, we look for keywords within the description
        // This is primarily for the "AI Assist" to quickly suggest tags
        if (searchTerm.length < 3) { // Only show suggestions if a few chars are typed
            elements.suggestionsDropdown.style.display = 'none';
            return;
        }

        const wordsInSearch = searchTerm.split(/\s+/); // Split by space to get words

        const matchingSymptoms = state.symptomsDatabase.filter(symptom => {
            // Check if any word in the search term is part of a symptom, or vice-versa
            // or if the symptom itself is present in the search term
            return (wordsInSearch.some(word => symptom.toLowerCase().includes(word) && word.length > 2) ||
                   symptom.toLowerCase().includes(searchTerm)) &&
                   !state.selectedSymptoms.includes(symptom);
        }).slice(0, 5); // Limit suggestions

        if (matchingSymptoms.length > 0) {
            displaySuggestions(matchingSymptoms);
        } else {
            elements.suggestionsDropdown.style.display = 'none'; // Hide if no matches
        }
    }

    function displaySuggestions(symptoms) {
        if(!elements.suggestionsDropdown || !elements.symptomDescription) return;
        elements.suggestionsDropdown.innerHTML = '';

        if (symptoms.length === 0) {
            elements.suggestionsDropdown.style.display = 'none';
            return;
        }

        symptoms.forEach(symptom => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = symptom;
            item.addEventListener('click', () => {
                addSymptom(symptom);
                // Do not clear the textarea: elements.symptomDescription.value = '';
                if(elements.suggestionsDropdown) elements.suggestionsDropdown.style.display = 'none';
            });
            elements.suggestionsDropdown.appendChild(item);
        });
        elements.suggestionsDropdown.style.display = 'block';
    }

    function addSymptom(symptom) {
        const normalizedSymptom = symptom.toLowerCase().trim();
        if (normalizedSymptom && !state.selectedSymptoms.includes(normalizedSymptom)) {
            state.selectedSymptoms.push(normalizedSymptom);
            updateSelectedSymptomsDisplay();
            const tags = document.querySelectorAll('.symptom-tag');
            const newTag = tags[tags.length - 1];
            if (newTag && !newTag.classList.contains('placeholder-tag')) {
                newTag.style.transform = 'scale(0.9)';
                setTimeout(() => newTag.style.transform = 'scale(1)', 100);
            }
        }
    }

    function removeSymptom(symptom) {
        state.selectedSymptoms = state.selectedSymptoms.filter(s => s !== symptom);
        updateSelectedSymptomsDisplay();
    }

    function updateSelectedSymptomsDisplay() {
        if(!elements.selectedContainer) return;
        elements.selectedContainer.innerHTML = '';
        if (state.selectedSymptoms.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'symptom-tag placeholder-tag';
            placeholder.textContent = 'No discrete symptoms tagged';
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

    async function generateContentWithGemini(prompt) {
        if (!model) {
            throw new Error("AI Model not initialized. Cannot generate content.");
        }
        let rawTextOutput;

        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            console.log("Gemini SDK Raw Full Response Object:", response);

            rawTextOutput = response.text();
            console.log("Gemini SDK Raw Text Output:", rawTextOutput);

            if (rawTextOutput) {
                let cleanedText = rawTextOutput.trim();
                if (cleanedText.startsWith("```json")) {
                    cleanedText = cleanedText.substring(7);
                } else if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText.substring(3);
                }

                if (cleanedText.endsWith("```")) {
                    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
                }
                cleanedText = cleanedText.trim();

                console.log("Gemini SDK Cleaned Text for JSON Parsing:", cleanedText);

                if (!cleanedText) {
                    throw new Error("AI returned empty content after attempting to clean JSON markers.");
                }
                return JSON.parse(cleanedText);
            } else {
                const finishReason = response.candidates?.[0]?.finishReason;
                const safetyRatings = response.candidates?.[0]?.safetyRatings;
                console.warn("Gemini SDK response.text() was empty or null. Finish Reason:", finishReason, "Safety Ratings:", safetyRatings);
                let errorMsg = "AI returned an empty or unexpected response (text() was null/empty).";
                if (finishReason === "SAFETY") {
                    errorMsg = "AI response blocked due to safety settings. Please rephrase your input.";
                } else if (finishReason === "RECITATION") {
                     errorMsg = "AI response blocked due to potential recitation. Please rephrase your input.";
                } else if (finishReason === "OTHER") {
                    errorMsg = "AI response incomplete or an unknown issue occurred.";
                }
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Error in generateContentWithGemini or parsing response:", error);
            if (error instanceof SyntaxError && typeof rawTextOutput !== 'undefined') {
                console.error("Text that failed JSON parsing:", rawTextOutput);
            }
            if (error instanceof SyntaxError) {
                throw new Error("AI returned data in an unexpected format. Could not parse JSON. Check console for details.");
            }
            if (error.message && error.message.toLowerCase().includes("api key not valid")) {
                 throw new Error ("AI Error: API Key is invalid or not authorized.");
            } else if (error.message && error.message.toLowerCase().includes("quota")) {
                 throw new Error ("AI Error: API quota likely exceeded.");
            }
            throw error;
        }
    }

    function fallbackAIAssistSuggestions() { // This is for AI Assist button's fallback
        if(!elements.symptomDescription) return;
        const currentInput = elements.symptomDescription.value.toLowerCase();
        let suggestedSymptoms = [];
        // Basic keyword matching for fallback
        if (currentInput.includes('মাথা') || currentInput.includes('head')) suggestedSymptoms = ['headache', 'dizziness'];
        else if (currentInput.includes('পেট') || currentInput.includes('stomach')) suggestedSymptoms = ['abdominal pain', 'nausea', 'vomiting'];
        else if (currentInput.includes('গলা') || currentInput.includes('throat')) suggestedSymptoms = ['sore throat', 'cough'];
        else if (currentInput.includes('پا') || currentInput.includes('leg') || currentInput.includes('ব্যথা') || currentInput.includes('pain')) suggestedSymptoms = ['leg pain', 'muscle pain', 'joint pain', 'swelling'];
        else { // Generic fallback
            suggestedSymptoms = state.symptomsDatabase
                .filter(s => !state.selectedSymptoms.includes(s))
                .sort(() => 0.5 - Math.random()).slice(0, 3);
        }
        displaySuggestions(suggestedSymptoms.filter(s => s && !state.selectedSymptoms.includes(s)));
    }

    async function callAIAssist() {
        if (!model) {
            showTemporaryMessage("AI Assist is unavailable (AI not initialized).");
            return;
        }
        if(!elements.aiAssistBtn || !elements.symptomDescription) return;

        elements.aiAssistBtn.disabled = true;
        elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⚡</span> AI Thinking...';

        const currentInput = elements.symptomDescription.value.trim();
        if (!currentInput) {
            showTemporaryMessage("Please describe your symptoms first to get AI assistance for tags.");
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
            return;
        }

        const existingSymptomsString = state.selectedSymptoms.join(", ") || "none";
        const allKnownSymptomsString = state.symptomsDatabase.join(", ");

        const assistPrompt = `
You are an AI medical symptom suggestion assistant.
The user is describing their condition in their own words (this could be in any language): "${currentInput}".
They have already selected these discrete symptoms as tags: "${existingSymptomsString}".
The database of all known English symptom terms that can be suggested as discrete tags is: "${allKnownSymptomsString}".

Based on the user's free-text description and already selected tags, suggest up to 3 highly relevant additional English symptom terms FROM THE KNOWN SYMPTOMS DATABASE that they might want to add as discrete tags.
The suggestions must NOT include any symptoms already tagged by the user.
If the description is too vague for specific suggestions from the database, suggest some common general symptoms from the database.
If there are no new, relevant symptoms to suggest from the database, return an empty array.

Format your response strictly as a JSON array of English symptom strings. Example: ["symptom one", "symptom two"]
Do not include any text outside of the JSON array itself.
`;

        try {
            const suggestedSymptomsArray = await generateContentWithGemini(assistPrompt);
            if (Array.isArray(suggestedSymptomsArray)) {
                const validSuggestions = suggestedSymptomsArray
                    .map(s => String(s).toLowerCase().trim())
                    .filter(s =>
                        s &&
                        state.symptomsDatabase.includes(s) && // Ensure suggestion is in our known DB
                        !state.selectedSymptoms.includes(s)
                    ).slice(0, 3); // Max 3 suggestions

                if (validSuggestions.length > 0) {
                    displaySuggestions(validSuggestions); // This will show them in the dropdown
                } else {
                    // displaySuggestions([]); // Clear any old suggestions
                    elements.suggestionsDropdown.style.display = 'none';
                    showTemporaryMessage("AI couldn't find specific new tags from the database based on your description. Your full description will be used for analysis.");
                }
            } else {
                throw new Error("AI Assist response was not a valid array.");
            }
        } catch (error) {
            console.error("AI Assist Main Error:", error);
            showTemporaryMessage(error.message || "AI Assist failed. Using fallback suggestions.");
            fallbackAIAssistSuggestions(); // Use local keyword-based fallback
        } finally {
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
        }
    }

    async function runPrediction() {
        if (!model) {
            showTemporaryMessage("Prediction is unavailable (AI not initialized).");
            return;
        }
        if(!elements.predictBtn || !elements.resultsSection || !elements.symptomDescription) return;

        const userDescription = elements.symptomDescription.value.trim();

        if (userDescription.length < 10) { // Require a bit more than just a word or two
            showTemporaryMessage('Please describe your symptoms in more detail in the text area.');
            return;
        }

        elements.predictBtn.disabled = true;
        elements.predictBtn.querySelector('.button-text').textContent = 'AI Analyzing...';
        elements.predictBtn.querySelector('.button-icon').textContent = '⌛';
        elements.resultsSection.classList.add('hidden'); // Hide previous results

        const taggedSymptomsString = state.selectedSymptoms.length > 0 ? ` The user also explicitly tagged the following symptoms: "${state.selectedSymptoms.join(", ")}". Consider these as confirmed symptoms.` : "";

        const diagnosticPrompt = `
You are an expert medical diagnostic AI assistant. Your goal is to provide a helpful preliminary analysis based on user-provided symptoms.
This is not a substitute for professional medical advice.

The user has provided the following detailed description of their symptoms. This description might be in any language (e.g., English, Bangla, Hindi, etc.). Please analyze the symptoms described:
"${userDescription}"
${taggedSymptomsString}

Based *primarily* on the detailed symptom description, and also considering any tagged symptoms, provide:
1.  The most probable primary medical condition (in English).
2.  A confidence level for this prediction (as an integer percentage from 0 to 100).
3.  A list of 3-4 general recommended actions or self-care advice (in English). Each recommendation should have an "icon" (a single relevant emoji) and "text" (a short, clear description). Do NOT suggest specific prescription medications. Focus on general well-being, when to see a doctor, or common over-the-counter considerations if appropriate for very common, mild issues.

Format your response strictly as a single JSON object. Example structure:
{
  "predictedDisease": "Example: Tension Headache",
  "confidence": 75,
  "recommendations": [
    { "icon": "🛌", "text": "Get plenty of rest and stay hydrated." },
    { "icon": "🌡️", "text": "Monitor symptoms. If they worsen or don't improve in a few days, consult a doctor." }
  ]
}

If the described symptoms are too vague, very sparse, or insufficient for any meaningful preliminary diagnosis, even with tagged symptoms, respond with:
{
  "predictedDisease": "Insufficient Information",
  "confidence": 10,
  "recommendations": [
    { "icon": "❓", "text": "The symptom description is too general for a specific analysis." },
    { "icon": "✍️", "text": "Please provide more specific details about your symptoms (e.g., duration, intensity, exact location, what makes it better or worse)." },
    { "icon": "👨‍⚕️", "text": "For an accurate diagnosis, always consult a healthcare professional." }
  ]
}
Ensure your entire response is ONLY THE JSON object, with no extra text before or after.
The language of the keys and string values in the JSON response (like "predictedDisease" and its value, and "text" in recommendations) MUST be in English.
`;

        try {
            const resultJson = await generateContentWithGemini(diagnosticPrompt);
            if (resultJson.predictedDisease && typeof resultJson.confidence === 'number' && Array.isArray(resultJson.recommendations)) {
                displayResults(
                    resultJson.predictedDisease,
                    resultJson.confidence,
                    resultJson.recommendations
                );
            } else {
                throw new Error("AI diagnosis response format is incorrect or missing key fields.");
            }
        } catch (error) {
            console.error("Error during prediction:", error);
            showTemporaryMessage(error.message || "An error occurred during AI analysis.");
            // Display error in the results area
            displayResults(
                "Analysis Error", 0,
                [
                    { icon: "❌", text: "Could not complete AI analysis: " + (error.message.length < 100 ? error.message : "Details in console.") },
                    { icon: "🔄", text: "Please check your input or try again later. Ensure your API key is valid and has quota." },
                    { icon: "👨‍⚕️", text: "Always consult a healthcare professional for medical advice." }
                ],
                true // isError flag
            );
        } finally {
            elements.predictBtn.disabled = false;
            elements.predictBtn.querySelector('.button-text').textContent = 'Generate AI Analysis'; // ensure this matches HTML
            elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
        }
    }

    function displayResults(disease, confidence, recommendations, isError = false) {
        if(!elements.predictedDisease || !elements.confidenceValue || !elements.confidenceBadge || !elements.confidenceFill || !elements.recommendationsGrid || !elements.resultsSection) return;

        elements.predictedDisease.textContent = disease;
        elements.confidenceValue.textContent = `${confidence}%`;
        // elements.confidenceBadge.style.setProperty('--confidence', confidence); // Not directly used by CSS, but good for data

        elements.confidenceBadge.classList.remove('high', 'medium', 'low', 'error');
        // Reset inline styles that might have been set
        elements.confidenceBadge.style.background = '';
        elements.confidenceBadge.style.borderColor = '';
        elements.confidenceBadge.style.color = '';


        if (isError) {
            elements.confidenceBadge.classList.add('error');
            // Explicitly set styles for error if CSS variables aren't working or for override
            elements.confidenceBadge.style.background = 'rgba(231, 76, 60, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(231, 76, 60, 0.3)';
            elements.confidenceBadge.style.color = 'var(--danger, #e74c3c)';
        } else if (confidence > 80) {
            elements.confidenceBadge.classList.add('high');
            elements.confidenceBadge.style.background = 'rgba(46, 204, 113, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(46, 204, 113, 0.3)';
            elements.confidenceBadge.style.color = 'var(--success, #2ecc71)';
        } else if (confidence > 50) {
            elements.confidenceBadge.classList.add('medium');
            elements.confidenceBadge.style.background = 'rgba(241, 196, 15, 0.15)';
            elements.confidenceBadge.style.borderColor = 'rgba(241, 196, 15, 0.4)';
            elements.confidenceBadge.style.color = 'var(--warning-text, #b08d0b)'; // Assuming a darker yellow for text might be needed
        } else { // Low confidence or zero
            elements.confidenceBadge.classList.add('low');
            elements.confidenceBadge.style.background = 'rgba(230, 126, 34, 0.1)';
            elements.confidenceBadge.style.borderColor = 'rgba(230, 126, 34, 0.3)';
            elements.confidenceBadge.style.color = 'var(--danger-orange, #d35400)'; // Example of a specific low confidence color
        }

        elements.confidenceFill.style.width = '0%'; // Reset before animating
        setTimeout(() => {
            elements.confidenceFill.style.width = `${Math.max(0, Math.min(100, confidence))}%`;
        }, 100);


        elements.recommendationsGrid.innerHTML = '';
        if (recommendations && recommendations.length > 0) {
            recommendations.forEach(rec => {
                const card = document.createElement('div');
                card.className = 'recommendation-card';
                card.innerHTML = `
                    <div class="rec-icon">${rec.icon || 'ℹ️'}</div>
                    <div class="rec-text">${rec.text || 'No specific recommendation.'}</div>
                `;
                elements.recommendationsGrid.appendChild(card);
            });
        } else {
             const noRec = document.createElement('div');
             noRec.className = 'recommendation-card placeholder-rec'; // Add a class for placeholder
             noRec.innerHTML = `<div class="rec-icon">ℹ️</div><div class="rec-text">No specific recommendations were provided.</div>`;
             elements.recommendationsGrid.appendChild(noRec);
        }

        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.style.opacity = '0';
        elements.resultsSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            elements.resultsSection.style.opacity = '1';
            elements.resultsSection.style.transform = 'translateY(0)';
            if (elements.resultsSection.scrollIntoView) {
                elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }

    function resetAnalysis() {
        state.selectedSymptoms = [];
        updateSelectedSymptomsDisplay();
        if(elements.symptomDescription) elements.symptomDescription.value = '';
        if(elements.suggestionsDropdown) elements.suggestionsDropdown.style.display = 'none';
        if(elements.resultsSection) elements.resultsSection.classList.add('hidden');

        // Reset report fields to default
        if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
        if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";
        if(elements.confidenceFill) elements.confidenceFill.style.width = '0%';
        if(elements.confidenceBadge) {
            elements.confidenceBadge.classList.remove('high', 'medium', 'low', 'error');
            elements.confidenceBadge.style.background = '';
            elements.confidenceBadge.style.borderColor = '';
            elements.confidenceBadge.style.color = '';
        }
        if(elements.recommendationsGrid) elements.recommendationsGrid.innerHTML = '';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showTemporaryMessage(message) {
        const existingMsg = document.querySelector('.temp-message');
        if (existingMsg) existingMsg.remove();

        const msgElement = document.createElement('div');
        msgElement.className = 'temp-message';
        msgElement.textContent = message;
        document.body.appendChild(msgElement);

        requestAnimationFrame(() => {
            msgElement.style.opacity = '1';
            msgElement.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            msgElement.style.opacity = '0';
            msgElement.style.transform = 'translateX(-50%) translateY(-40px)';
            setTimeout(() => {
                if (document.body.contains(msgElement)) {
                    document.body.removeChild(msgElement);
                }
            }, 500);
        }, 3500);
    }
});