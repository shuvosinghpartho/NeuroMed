// AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4 <--- User provided key

// Gemini API SDK Import
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT SECURITY WARNING !!!
    // It's highly insecure to embed API keys directly in client-side JavaScript.
    // This key is visible to anyone inspecting your site's code.
    // For production, use a backend proxy to call the Gemini API.
    // This example is for demonstration/prototyping purposes ONLY.
    // Consider the key compromised if deployed publicly this way.
    const GEMINI_API_KEY = "AIzaSyDly98d9CjJCxjBOL7ZmfLKHGK4m79SSq4";

    let genAI;
    let model;
    let uploadedPrescriptionFile = null; // Store the uploaded file object

    // DOM Elements
    const elements = {
        // Symptom Analysis
        symptomDescription: document.getElementById('symptom-description'),
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
        newSymptomAnalysisBtn: document.getElementById('new-symptom-analysis-btn'), // Changed ID

        // Prescription Analysis
        prescriptionUploadInput: document.getElementById('prescription-upload-input'),
        prescriptionFilename: document.getElementById('prescription-filename'),
        prescriptionPreviewContainer: document.getElementById('prescription-preview-container'),
        prescriptionPreviewImage: document.getElementById('prescription-preview-image'),
        analyzePrescriptionBtn: document.getElementById('analyze-prescription-btn'),
        prescriptionResultsSection: document.getElementById('prescription-results-section'),
        prescriptionAnalysisContent: document.getElementById('prescription-analysis-content'),
        newPrescriptionAnalysisBtn: document.getElementById('new-prescription-analysis-btn'),
        copyPrescriptionReportBtn: document.getElementById('copy-prescription-report-btn'),
    };

    if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && GEMINI_API_KEY.startsWith("AIza")) {
        try {
            genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash-latest", // This model supports multimodal
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
            });
            console.log("Gemini SDK Initialized successfully with model: gemini-1.5-flash-latest");
            if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
            if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";

        } catch (error) {
            console.error("Error initializing Gemini SDK:", error);
            showTemporaryMessage("Failed to initialize AI. Check API Key and console.");
            disableAIButtons();
        }
    } else {
        console.warn("Gemini API Key is missing, invalid, or a placeholder. AI features will be disabled.");
        showTemporaryMessage("API Key missing/invalid. AI features disabled.");
        disableAIButtons();
    }

    function disableAIButtons() {
        if(elements.aiAssistBtn) elements.aiAssistBtn.disabled = true;
        if(elements.predictBtn) elements.predictBtn.disabled = true;
        if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.disabled = true;
    }

    // State
    let state = {
        selectedSymptoms: [],
        symptomsDatabase: [
            "fever", "headache", "nausea", "fatigue", "cough",
            "sore throat", "muscle pain", "dizziness", "shortness of breath",
            "chest pain", "abdominal pain", "diarrhea", "vomiting", "rash",
            "joint pain", "back pain", "chills", "sweating", "weight loss",
            "loss of appetite", "weakness", "blurred vision", "frequent urination",
            "constipation", "heartburn", "swelling", "numbness", "tingling",
            "runny nose", "body aches", "sore eyes", "light sensitivity",
            "injury", "swollen leg", "leg pain", "ankle pain", "difficulty walking"
        ],
    };

    initUI();

    function initUI() {
        setupEventListeners();
        updateSelectedSymptomsDisplay();
        if (!model) {
            disableAIButtons();
        }
        if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
        if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";
        if(elements.confidenceFill) elements.confidenceFill.style.width = '0%';
        if(elements.recommendationsGrid) elements.recommendationsGrid.innerHTML = '';
        if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.disabled = true; // Disabled initially
    }

    function setupEventListeners() {
        // Symptom Analysis
        if(elements.symptomDescription) elements.symptomDescription.addEventListener('input', handleSearchInput);
        if(elements.symptomDescription) elements.symptomDescription.addEventListener('focus', handleSearchInput);
        document.addEventListener('click', (event) => {
            if (elements.suggestionsDropdown && !elements.suggestionsDropdown.contains(event.target) && event.target !== elements.symptomDescription) {
                elements.suggestionsDropdown.style.display = 'none';
            }
        });
        if(elements.aiAssistBtn) elements.aiAssistBtn.addEventListener('click', callAIAssist);
        if(elements.predictBtn) elements.predictBtn.addEventListener('click', runPrediction);
        if(elements.newSymptomAnalysisBtn) elements.newSymptomAnalysisBtn.addEventListener('click', resetSymptomAnalysis); // Renamed

        // Prescription Analysis
        if(elements.prescriptionUploadInput) elements.prescriptionUploadInput.addEventListener('change', handlePrescriptionUpload);
        if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.addEventListener('click', runPrescriptionAnalysis);
        if(elements.newPrescriptionAnalysisBtn) elements.newPrescriptionAnalysisBtn.addEventListener('click', resetPrescriptionAnalysis);
        if(elements.copyPrescriptionReportBtn) elements.copyPrescriptionReportBtn.addEventListener('click', copyPrescriptionReportToClipboard);
    }

    // --- Symptom Analysis Functions (mostly unchanged, ensure reset function is correct) ---
    function handleSearchInput() {
        if(!elements.symptomDescription || !elements.suggestionsDropdown) return;
        const searchTerm = elements.symptomDescription.value.toLowerCase();
        if (searchTerm.length < 3) {
            elements.suggestionsDropdown.style.display = 'none';
            return;
        }
        const wordsInSearch = searchTerm.split(/\s+/);
        const matchingSymptoms = state.symptomsDatabase.filter(symptom => {
            return (wordsInSearch.some(word => symptom.toLowerCase().includes(word) && word.length > 2) ||
                   symptom.toLowerCase().includes(searchTerm)) &&
                   !state.selectedSymptoms.includes(symptom);
        }).slice(0, 5);
        if (matchingSymptoms.length > 0) displaySuggestions(matchingSymptoms);
        else elements.suggestionsDropdown.style.display = 'none';
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

    async function generateContentWithGemini(promptOrParts) {
        if (!model) {
            throw new Error("AI Model not initialized. Cannot generate content.");
        }
        let rawTextOutput;

        try {
            // If promptOrParts is a string (text-only), pass it directly.
            // If it's an array (multimodal), pass it as { parts: promptOrParts }.
            // The SDK's generateContent method should handle string for text prompts
            // and an array of parts for multimodal if the model supports it.
            // For gemini-1.5-flash, content can be a string or `GenerateContentRequest`.
            // `GenerateContentRequest` has a `contents` field which is an array of `Content`.
            // A `Content` object has `parts` which is an array of `Part`.
            // Simpler: `model.generateContent([textPart, imagePart])`
            // Or `model.generateContent(textPrompt)`
            let request;
            if (typeof promptOrParts === 'string') {
                request = promptOrParts;
            } else if (Array.isArray(promptOrParts)) {
                request = promptOrParts; // For multimodal: [ {text: "..."} , {inlineData: ...} ] or [ "text", {inlineData: ...} ]
            } else {
                 throw new Error("Invalid prompt format for Gemini. Must be string or array of parts.");
            }

            const result = await model.generateContent(request);
            const response = result.response;
            console.log("Gemini SDK Raw Full Response Object:", response);

            if (response && typeof response.text === 'function') {
                rawTextOutput = response.text();
            } else if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts[0] && typeof response.candidates[0].content.parts[0].text !== 'undefined') {
                // Handle cases where response.text() might not be available directly but parts are
                rawTextOutput = response.candidates[0].content.parts[0].text;
            } else {
                console.warn("Gemini SDK response.text() was not available or response structure unexpected.", response);
                 const finishReason = response?.candidates?.[0]?.finishReason;
                const safetyRatings = response?.candidates?.[0]?.safetyRatings;
                let errorMsg = "AI returned an empty or unexpected response structure.";
                if (finishReason === "SAFETY") errorMsg = "AI response blocked due to safety settings. Please rephrase your input or check the content.";
                else if (finishReason === "RECITATION") errorMsg = "AI response blocked due to potential recitation.";
                else if (finishReason === "OTHER") errorMsg = "AI response incomplete or an unknown issue occurred.";
                throw new Error(errorMsg);
            }
            
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
                if (!cleanedText) throw new Error("AI returned empty content after cleaning.");
                return JSON.parse(cleanedText);
            } else {
                throw new Error("AI returned empty text output.");
            }
        } catch (error) {
            console.error("Error in generateContentWithGemini or parsing response:", error);
            if (error instanceof SyntaxError && typeof rawTextOutput !== 'undefined') {
                console.error("Text that failed JSON parsing:", rawTextOutput);
            }
            if (error instanceof SyntaxError) throw new Error("AI returned data in an unexpected format. Could not parse JSON.");
            if (error.message && error.message.toLowerCase().includes("api key not valid")) throw new Error ("AI Error: API Key is invalid or not authorized.");
            else if (error.message && error.message.toLowerCase().includes("quota")) throw new Error ("AI Error: API quota likely exceeded.");
            throw error; // Re-throw other errors
        }
    }

    function fallbackAIAssistSuggestions() {
        if(!elements.symptomDescription) return;
        const currentInput = elements.symptomDescription.value.toLowerCase();
        let suggestedSymptoms = [];
        if (currentInput.includes('মাথা') || currentInput.includes('head')) suggestedSymptoms = ['headache', 'dizziness'];
        else if (currentInput.includes('পেট') || currentInput.includes('stomach')) suggestedSymptoms = ['abdominal pain', 'nausea', 'vomiting'];
        else if (currentInput.includes('গলা') || currentInput.includes('throat')) suggestedSymptoms = ['sore throat', 'cough'];
        else if (currentInput.includes('پا') || currentInput.includes('leg') || currentInput.includes('ব্যথা') || currentInput.includes('pain')) suggestedSymptoms = ['leg pain', 'muscle pain', 'joint pain', 'swelling'];
        else {
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
            showTemporaryMessage("Please describe your symptoms first for AI tag assistance.");
            elements.aiAssistBtn.disabled = false;
            elements.aiAssistBtn.innerHTML = '<span class="ai-icon">⟳</span> AI Assist';
            return;
        }
        const existingSymptomsString = state.selectedSymptoms.join(", ") || "none";
        const allKnownSymptomsString = state.symptomsDatabase.join(", ");
        const assistPrompt = `
You are an AI medical symptom suggestion assistant.
User's description: "${currentInput}".
Already tagged symptoms: "${existingSymptomsString}".
Known English symptom tags database: "${allKnownSymptomsString}".
Suggest up to 3 relevant English symptom terms FROM THE DATABASE that are NOT already tagged.
If too vague, suggest common general symptoms from the database.
If no new relevant symptoms, return an empty array.
Format: JSON array of English symptom strings. Example: ["symptom one", "symptom two"]
ONLY THE JSON ARRAY.`;

        try {
            const suggestedSymptomsArray = await generateContentWithGemini(assistPrompt);
            if (Array.isArray(suggestedSymptomsArray)) {
                const validSuggestions = suggestedSymptomsArray
                    .map(s => String(s).toLowerCase().trim())
                    .filter(s => s && state.symptomsDatabase.includes(s) && !state.selectedSymptoms.includes(s))
                    .slice(0, 3);
                if (validSuggestions.length > 0) displaySuggestions(validSuggestions);
                else {
                    elements.suggestionsDropdown.style.display = 'none';
                    showTemporaryMessage("AI couldn't find specific new tags. Your description will be used.");
                }
            } else throw new Error("AI Assist response was not a valid array.");
        } catch (error) {
            console.error("AI Assist Main Error:", error);
            showTemporaryMessage(error.message || "AI Assist failed. Using fallback.");
            fallbackAIAssistSuggestions();
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
        if (userDescription.length < 10) {
            showTemporaryMessage('Please describe your symptoms in more detail.');
            return;
        }
        elements.predictBtn.disabled = true;
        elements.predictBtn.querySelector('.button-text').textContent = 'AI Analyzing...';
        elements.predictBtn.querySelector('.button-icon').textContent = '⌛';
        elements.resultsSection.classList.add('hidden');

        const taggedSymptomsString = state.selectedSymptoms.length > 0 ? ` User also tagged: "${state.selectedSymptoms.join(", ")}".` : "";
        const diagnosticPrompt = `
You are an expert medical diagnostic AI. This is not medical advice.
User's symptom description (any language): "${userDescription}"
${taggedSymptomsString}
Analyze symptoms and provide:
1. Most probable primary medical condition (English).
2. Confidence level (integer 0-100).
3. 3-4 general recommended actions/self-care (English), each with "icon" (emoji) and "text". No specific prescription drugs.
Format: Strict JSON object:
{
  "predictedDisease": "Example: Tension Headache",
  "confidence": 75,
  "recommendations": [
    { "icon": "🛌", "text": "Rest and hydrate." },
    { "icon": "🌡️", "text": "Monitor. If worsens or persists, see a doctor." }
  ]
}
If symptoms are too vague/insufficient:
{
  "predictedDisease": "Insufficient Information",
  "confidence": 10,
  "recommendations": [
    { "icon": "❓", "text": "Description too general." },
    { "icon": "✍️", "text": "Provide more specific details (duration, intensity, location, triggers)." },
    { "icon": "👨‍⚕️", "text": "Always consult a healthcare professional for diagnosis." }
  ]
}
ONLY THE JSON object. English for keys and string values in JSON.`;

        try {
            const resultJson = await generateContentWithGemini(diagnosticPrompt);
            if (resultJson.predictedDisease && typeof resultJson.confidence === 'number' && Array.isArray(resultJson.recommendations)) {
                displaySymptomResults(resultJson.predictedDisease, resultJson.confidence, resultJson.recommendations);
            } else throw new Error("AI diagnosis response format incorrect.");
        } catch (error) {
            console.error("Error during prediction:", error);
            showTemporaryMessage(error.message || "Error during AI analysis.");
            displaySymptomResults("Analysis Error", 0, [
                { icon: "❌", text: "Could not complete AI analysis: " + (error.message.length < 100 ? error.message : "Details in console.") },
                { icon: "🔄", text: "Check input or try again. Ensure API key is valid/has quota." },
                { icon: "👨‍⚕️", text: "Always consult a healthcare professional." }
            ], true);
        } finally {
            elements.predictBtn.disabled = false;
            elements.predictBtn.querySelector('.button-text').textContent = 'Generate AI Analysis';
            elements.predictBtn.querySelector('.button-icon').textContent = '⇨';
        }
    }

    function displaySymptomResults(disease, confidence, recommendations, isError = false) { // Renamed
        if(!elements.predictedDisease || !elements.confidenceValue || !elements.confidenceBadge || !elements.confidenceFill || !elements.recommendationsGrid || !elements.resultsSection) return;
        elements.predictedDisease.textContent = disease;
        elements.confidenceValue.textContent = `${confidence}%`;
        elements.confidenceBadge.classList.remove('high', 'medium', 'low', 'error');
        elements.confidenceBadge.style.background = ''; elements.confidenceBadge.style.borderColor = ''; elements.confidenceBadge.style.color = '';

        if (isError) {
            elements.confidenceBadge.classList.add('error');
            elements.confidenceBadge.style.background = 'rgba(231, 76, 60, 0.1)'; elements.confidenceBadge.style.borderColor = 'rgba(231, 76, 60, 0.3)'; elements.confidenceBadge.style.color = 'var(--danger, #e74c3c)';
        } else if (confidence > 80) {
            elements.confidenceBadge.classList.add('high');
            elements.confidenceBadge.style.background = 'rgba(46, 204, 113, 0.1)'; elements.confidenceBadge.style.borderColor = 'rgba(46, 204, 113, 0.3)'; elements.confidenceBadge.style.color = 'var(--success, #2ecc71)';
        } else if (confidence > 50) {
            elements.confidenceBadge.classList.add('medium');
            elements.confidenceBadge.style.background = 'rgba(241, 196, 15, 0.15)'; elements.confidenceBadge.style.borderColor = 'rgba(241, 196, 15, 0.4)'; elements.confidenceBadge.style.color = 'var(--warning-text, #b08d0b)';
        } else {
            elements.confidenceBadge.classList.add('low');
            elements.confidenceBadge.style.background = 'rgba(230, 126, 34, 0.1)'; elements.confidenceBadge.style.borderColor = 'rgba(230, 126, 34, 0.3)'; elements.confidenceBadge.style.color = 'var(--danger-orange, #d35400)';
        }
        elements.confidenceFill.style.width = '0%';
        setTimeout(() => { elements.confidenceFill.style.width = `${Math.max(0, Math.min(100, confidence))}%`; }, 100);

        elements.recommendationsGrid.innerHTML = '';
        if (recommendations && recommendations.length > 0) {
            recommendations.forEach(rec => {
                const card = document.createElement('div');
                card.className = 'recommendation-card';
                card.innerHTML = `<div class="rec-icon">${rec.icon || 'ℹ️'}</div><div class="rec-text">${rec.text || 'No specific recommendation.'}</div>`;
                elements.recommendationsGrid.appendChild(card);
            });
        } else {
             const noRec = document.createElement('div');
             noRec.className = 'recommendation-card placeholder-rec';
             noRec.innerHTML = `<div class="rec-icon">ℹ️</div><div class="rec-text">No specific recommendations.</div>`;
             elements.recommendationsGrid.appendChild(noRec);
        }
        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.style.opacity = '0'; elements.resultsSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            elements.resultsSection.style.opacity = '1'; elements.resultsSection.style.transform = 'translateY(0)';
            if (elements.resultsSection.scrollIntoView) elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    function resetSymptomAnalysis() { // Renamed
        state.selectedSymptoms = [];
        updateSelectedSymptomsDisplay();
        if(elements.symptomDescription) elements.symptomDescription.value = '';
        if(elements.suggestionsDropdown) elements.suggestionsDropdown.style.display = 'none';
        if(elements.resultsSection) elements.resultsSection.classList.add('hidden');
        if(elements.predictedDisease) elements.predictedDisease.textContent = "Awaiting Analysis...";
        if(elements.confidenceValue) elements.confidenceValue.textContent = "N/A";
        if(elements.confidenceFill) elements.confidenceFill.style.width = '0%';
        if(elements.confidenceBadge) {
            elements.confidenceBadge.classList.remove('high', 'medium', 'low', 'error');
            elements.confidenceBadge.style.background = ''; elements.confidenceBadge.style.borderColor = ''; elements.confidenceBadge.style.color = '';
        }
        if(elements.recommendationsGrid) elements.recommendationsGrid.innerHTML = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Prescription Analysis Functions ---
    function handlePrescriptionUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showTemporaryMessage('Please upload an image file (PNG, JPG, etc.).');
                elements.prescriptionUploadInput.value = ''; // Reset file input
                elements.prescriptionFilename.textContent = 'No file chosen';
                elements.prescriptionPreviewContainer.classList.add('hidden');
                elements.analyzePrescriptionBtn.disabled = true;
                uploadedPrescriptionFile = null;
                return;
            }
            // Limit file size (e.g., 5MB)
            if (file.size > 5 * 1024 * 1024) {
                 showTemporaryMessage('File is too large. Max 5MB allowed.');
                 elements.prescriptionUploadInput.value = '';
                 elements.prescriptionFilename.textContent = 'No file chosen';
                 elements.prescriptionPreviewContainer.classList.add('hidden');
                 elements.analyzePrescriptionBtn.disabled = true;
                 uploadedPrescriptionFile = null;
                 return;
            }

            uploadedPrescriptionFile = file;
            elements.prescriptionFilename.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                if(elements.prescriptionPreviewImage) elements.prescriptionPreviewImage.src = e.target.result;
                if(elements.prescriptionPreviewContainer) elements.prescriptionPreviewContainer.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
            if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.disabled = false;
        } else {
            uploadedPrescriptionFile = null;
            if(elements.prescriptionFilename) elements.prescriptionFilename.textContent = 'No file chosen';
            if(elements.prescriptionPreviewContainer) elements.prescriptionPreviewContainer.classList.add('hidden');
            if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.disabled = true;
        }
    }

    async function fileToGenerativePart(file) {
        const base64EncodedDataPromise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]); // Get only base64 part
                } else {
                    reject(new Error("Failed to read file as base64 string."));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
        try {
            const base64Data = await base64EncodedDataPromise;
            return {
                inlineData: { data: base64Data, mimeType: file.type }
            };
        } catch (error) {
            console.error("Error converting file to generative part:", error);
            throw new Error("Could not process the uploaded image file.");
        }
    }
    
    async function runPrescriptionAnalysis() {
        if (!model) {
            showTemporaryMessage("AI Analysis is unavailable (AI not initialized).");
            return;
        }
        if (!uploadedPrescriptionFile) {
            showTemporaryMessage('Please upload a prescription image first.');
            return;
        }
        if(!elements.analyzePrescriptionBtn || !elements.prescriptionResultsSection || !elements.prescriptionAnalysisContent) return;

        elements.analyzePrescriptionBtn.disabled = true;
        elements.analyzePrescriptionBtn.querySelector('.button-text').textContent = 'AI Analyzing Image...';
        elements.analyzePrescriptionBtn.querySelector('.button-icon').textContent = '⌛';
        elements.prescriptionResultsSection.classList.add('hidden');
        elements.prescriptionAnalysisContent.innerHTML = '<p class="loading-text">Analyzing prescription, please wait...</p>'; // Initial loading text

        const prescriptionPromptText = `
You are an AI medical assistant specialized in analyzing prescription images.
The user has uploaded an image of a medical prescription.
Your task is to carefully analyze the image and extract key information.

CRITICALLY IMPORTANT: Your entire response MUST be a single, valid JSON object. Do not include any text before or after the JSON structure.
If the image is unclear, unreadable, not a prescription, or if you cannot confidently extract information, use the "error" field in the JSON.

JSON Output Structure:
{
  "summary": "A brief, neutral summary of the prescription's apparent purpose if clearly inferable (e.g., 'Prescription for managing bacterial infection'). If not clear, state 'Purpose not clearly identifiable from image'.",
  "medications": [
    {
      "name": "Medication Name (as written, or standardized if clear)",
      "dosage": "Dosage (e.g., '500 mg', '1 tablet')",
      "frequency": "Frequency (e.g., 'Twice a day', 'Once daily at bedtime')",
      "duration": "Duration if specified (e.g., 'For 7 days', '30 tablets total')",
      "notes": "Any other specific instructions for this medication (e.g., 'With food', 'Before meals'). If none, use 'N/A'."
    }
    // Add more medication objects if multiple are present
  ],
  "doctor_details": { // Optional: if clearly visible and legible
    "name": "Doctor's Name (if visible)",
    "clinic": "Clinic/Hospital Name (if visible)",
    "date": "Prescription Date (if visible)"
  },
  "patient_details": { // Optional: if clearly visible and legible - BE CAREFUL WITH PRIVACY. Prefer to omit if not essential for understanding.
    "name": "Patient Name (if visible and clearly part of prescription for context)"
  },
  "general_advice_and_info": [
    "General information point 1 (e.g., 'Ensure to complete the full course of antibiotics as prescribed.').",
    "General information point 2 (e.g., 'Store medications in a cool, dry place away from children.')."
  ],
  "warnings_and_next_steps": [
    "Always double-check medication names and dosages with your pharmacist.",
    "Discuss any concerns or side effects with your doctor immediately.",
    "This AI analysis is for informational purposes and may contain errors or omissions."
  ],
  "critical_disclaimer": "This AI analysis is NOT a substitute for professional medical or pharmaceutical advice. Misinterpretation or errors can occur. ALWAYS verify any information with your doctor or a qualified pharmacist. DO NOT make any decisions about your medication or treatment based solely on this AI analysis. NeuroMed is not liable for any actions taken based on this analysis.",
  "error": null // or "Description of error if analysis failed (e.g., Image unclear, Not a prescription)"
}

Instructions for analysis:
1.  Identify each medication listed. Capture its name, dosage, frequency, and duration if specified.
2.  Look for any general instructions from the doctor.
3.  Extract doctor's details (name, clinic, date) if clearly visible and legible.
4.  Patient name can be noted if clearly part of the prescription context, but prioritize privacy.
5.  Provide 2-3 general advice points related to taking medication or common prescription practices.
6.  Include standard warnings about verifying with professionals.
7.  The "critical_disclaimer" field MUST be included verbatim.
8.  If the image quality is poor, or it's not a prescription, populate the "error" field and provide minimal other data.
Focus on accuracy. If unsure about a detail, state 'Not clearly legible' or omit.
Do not invent information. Do not provide medical advice beyond very general, universally accepted medication practices.
Prioritize safety and the need for human verification.
The language of the keys and string values in the JSON response MUST be in English.
Example for an unreadable image:
{
  "summary": "Image analysis failed.",
  "medications": [],
  "doctor_details": {},
  "patient_details": {},
  "general_advice_and_info": [],
  "warnings_and_next_steps": ["Ensure to consult your doctor or pharmacist for accurate prescription details."],
  "critical_disclaimer": "This AI analysis is NOT a substitute for professional medical or pharmaceutical advice. Misinterpretation or errors can occur. ALWAYS verify any information with your doctor or a qualified pharmacist. DO NOT make any decisions about your medication or treatment based solely on this AI analysis. NeuroMed is not liable for any actions taken based on this analysis.",
  "error": "The uploaded image is unclear or not a recognizable prescription."
}
`;

        try {
            const imagePart = await fileToGenerativePart(uploadedPrescriptionFile);
            const requestParts = [
                { text: prescriptionPromptText },
                imagePart
            ];
            console.log("Sending request to Gemini for prescription analysis with image.");
            const resultJson = await generateContentWithGemini(requestParts);
            
            if (resultJson && typeof resultJson === 'object') {
                displayPrescriptionAnalysis(resultJson);
            } else {
                throw new Error("AI prescription analysis response was not a valid JSON object or was empty.");
            }

        } catch (error) {
            console.error("Error during prescription analysis:", error);
            showTemporaryMessage(error.message || "An error occurred during AI prescription analysis.");
            displayPrescriptionAnalysis({ // Display error structure
                summary: "Analysis Error",
                medications: [],
                doctor_details: {},
                patient_details: {},
                general_advice_and_info: [],
                warnings_and_next_steps: [
                    "Could not complete AI analysis: " + (error.message.length < 150 ? error.message : "Details in console."),
                    "Please ensure the image is clear and a valid prescription, or try again later."
                ],
                critical_disclaimer: "This AI analysis is NOT a substitute for professional medical or pharmaceutical advice. Misinterpretation or errors can occur. ALWAYS verify any information with your doctor or a qualified pharmacist. DO NOT make any decisions about your medication or treatment based solely on this AI analysis. NeuroMed is not liable for any actions taken based on this analysis.",
                error: "AI analysis failed: " + error.message
            });
        } finally {
            elements.analyzePrescriptionBtn.disabled = false;
            elements.analyzePrescriptionBtn.querySelector('.button-text').textContent = 'Analyze Prescription';
            elements.analyzePrescriptionBtn.querySelector('.button-icon').textContent = '🖼️';
        }
    }

    function displayPrescriptionAnalysis(data) {
        if (!elements.prescriptionAnalysisContent || !elements.prescriptionResultsSection) return;
        
        elements.prescriptionAnalysisContent.innerHTML = ''; // Clear previous/loading

        if (data.error) {
            const errorP = document.createElement('p');
            errorP.className = 'analysis-error-message';
            errorP.innerHTML = `<strong>Analysis Issue:</strong> ${data.error}`;
            elements.prescriptionAnalysisContent.appendChild(errorP);
        }

        // Title/Summary
        const summaryTitle = document.createElement('h3');
        summaryTitle.className = 'report-section-title prescript-title';
        summaryTitle.textContent = data.summary || "Prescription Summary";
        elements.prescriptionAnalysisContent.appendChild(summaryTitle);
        
        if(data.summary && data.summary !== "Image analysis failed." && data.summary !== "Analysis Error") { // Add summary text if not an error message already
            const summaryText = document.createElement('p');
            summaryText.className = 'prescript-summary-text';
            summaryText.textContent = data.summary;
            elements.prescriptionAnalysisContent.appendChild(summaryText);
        }


        // Medications
        if (data.medications && data.medications.length > 0) {
            const medTitle = document.createElement('h4');
            medTitle.className = 'report-subsection-title';
            medTitle.textContent = "Medications Identified:";
            elements.prescriptionAnalysisContent.appendChild(medTitle);

            const medList = document.createElement('ul');
            medList.className = 'medication-list';
            data.medications.forEach(med => {
                const item = document.createElement('li');
                item.className = 'medication-item';
                item.innerHTML = `
                    <div class="med-name"><strong>${med.name || 'N/A'}</strong></div>
                    ${med.dosage ? `<div class="med-detail"><span>Dosage:</span> ${med.dosage}</div>` : ''}
                    ${med.frequency ? `<div class="med-detail"><span>Frequency:</span> ${med.frequency}</div>` : ''}
                    ${med.duration ? `<div class="med-detail"><span>Duration:</span> ${med.duration}</div>` : ''}
                    ${med.notes && med.notes !== 'N/A' ? `<div class="med-detail notes"><span>Notes:</span> ${med.notes}</div>` : ''}
                `;
                medList.appendChild(item);
            });
            elements.prescriptionAnalysisContent.appendChild(medList);
        } else if (!data.error) {
            const noMedText = document.createElement('p');
            noMedText.textContent = "No specific medications clearly identified or listed.";
            elements.prescriptionAnalysisContent.appendChild(noMedText);
        }
        
        // Doctor Details (optional)
        if (data.doctor_details && (data.doctor_details.name || data.doctor_details.clinic || data.doctor_details.date)) {
            const docTitle = document.createElement('h4');
            docTitle.className = 'report-subsection-title';
            docTitle.textContent = "Doctor / Clinic Information (if legible):";
            elements.prescriptionAnalysisContent.appendChild(docTitle);
            const docDetailsP = document.createElement('p');
            docDetailsP.className = 'doctor-details-text';
            let detailsHtml = '';
            if(data.doctor_details.name) detailsHtml += `<strong>Dr.:</strong> ${data.doctor_details.name}<br>`;
            if(data.doctor_details.clinic) detailsHtml += `<strong>Clinic:</strong> ${data.doctor_details.clinic}<br>`;
            if(data.doctor_details.date) detailsHtml += `<strong>Date:</strong> ${data.doctor_details.date}`;
            docDetailsP.innerHTML = detailsHtml || "No specific doctor details clearly identified.";
            elements.prescriptionAnalysisContent.appendChild(docDetailsP);
        }

        // Patient Details (VERY optional, consider privacy)
        // For this example, let's keep it minimal or skip if not explicitly requested to be very visible
        if (data.patient_details && data.patient_details.name) {
             const patientTitle = document.createElement('h4');
             patientTitle.className = 'report-subsection-title';
             patientTitle.textContent = "Patient Information (if legible on prescription):";
             elements.prescriptionAnalysisContent.appendChild(patientTitle);
             const patientP = document.createElement('p');
             patientP.textContent = `Name: ${data.patient_details.name}`;
             elements.prescriptionAnalysisContent.appendChild(patientP);
        }


        // General Advice
        if (data.general_advice_and_info && data.general_advice_and_info.length > 0) {
            const adviceTitle = document.createElement('h4');
            adviceTitle.className = 'report-subsection-title';
            adviceTitle.textContent = "General Information & Advice:";
            elements.prescriptionAnalysisContent.appendChild(adviceTitle);
            const adviceList = document.createElement('ul');
            adviceList.className = 'advice-list';
            data.general_advice_and_info.forEach(advice => {
                const item = document.createElement('li');
                item.innerHTML = `<span class="advice-icon">💡</span> ${advice}`;
                adviceList.appendChild(item);
            });
            elements.prescriptionAnalysisContent.appendChild(adviceList);
        }

        // Warnings
        if (data.warnings_and_next_steps && data.warnings_and_next_steps.length > 0) {
            const warningsTitle = document.createElement('h4');
            warningsTitle.className = 'report-subsection-title warnings-title';
            warningsTitle.textContent = "Important Warnings & Next Steps:";
            elements.prescriptionAnalysisContent.appendChild(warningsTitle);
            const warningsList = document.createElement('ul');
            warningsList.className = 'warnings-list';
            data.warnings_and_next_steps.forEach(warning => {
                const item = document.createElement('li');
                item.innerHTML = `<span class="warning-icon">⚠️</span> ${warning}`;
                warningsList.appendChild(item);
            });
            elements.prescriptionAnalysisContent.appendChild(warningsList);
        }

        // CRITICAL DISCLAIMER (append last, or ensure it's there from HTML if static)
        const disclaimerDiv = elements.prescriptionAnalysisContent.querySelector('.critical-disclaimer-prescription') || document.createElement('div');
        if (!disclaimerDiv.parentElement) { // If not already in HTML, create and append
            disclaimerDiv.className = 'ai-footnote critical-disclaimer-prescription';
            disclaimerDiv.innerHTML = `
                <div class="ai-avatar">AI</div>
                <p><strong>CRITICAL DISCLAIMER:</strong> ${data.critical_disclaimer || "This AI analysis is NOT a substitute for professional medical or pharmaceutical advice. Misinterpretation or errors can occur. ALWAYS verify any information with your doctor or a qualified pharmacist. DO NOT make any decisions about your medication or treatment based solely on this AI analysis. NeuroMed is not liable for any actions taken based on this analysis."}</p>
            `;
            elements.prescriptionAnalysisContent.appendChild(disclaimerDiv);
        }


        elements.prescriptionResultsSection.classList.remove('hidden');
        elements.prescriptionResultsSection.style.opacity = '0';
        elements.prescriptionResultsSection.style.transform = 'translateY(20px)';
        setTimeout(() => {
            elements.prescriptionResultsSection.style.opacity = '1';
            elements.prescriptionResultsSection.style.transform = 'translateY(0)';
            if (elements.prescriptionResultsSection.scrollIntoView) {
                elements.prescriptionResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }
    
    function copyPrescriptionReportToClipboard() {
        if (!elements.prescriptionAnalysisContent) return;

        let reportText = "NeuroMed AI Prescription Analysis:\n\n";
        
        const summaryTitle = elements.prescriptionAnalysisContent.querySelector('.prescript-title');
        if (summaryTitle) reportText += `${summaryTitle.textContent}\n`;
        const summaryTextEl = elements.prescriptionAnalysisContent.querySelector('.prescript-summary-text');
        if (summaryTextEl) reportText += `${summaryTextEl.textContent}\n\n`;


        const medTitle = elements.prescriptionAnalysisContent.querySelector('.report-subsection-title'); // Assuming first h4 is med title
        if (medTitle && medTitle.textContent.toLowerCase().includes('medication')) {
            reportText += `${medTitle.textContent}\n`;
            const medItems = elements.prescriptionAnalysisContent.querySelectorAll('.medication-item');
            medItems.forEach(item => {
                const name = item.querySelector('.med-name strong')?.textContent || 'N/A';
                reportText += `- ${name}:\n`;
                item.querySelectorAll('.med-detail').forEach(detail => {
                    const label = detail.querySelector('span')?.textContent || '';
                    const value = detail.textContent.replace(label, '').trim();
                    reportText += `  ${label} ${value}\n`;
                });
            });
            reportText += "\n";
        }

        elements.prescriptionAnalysisContent.querySelectorAll('h4.report-subsection-title').forEach(h4 => {
            if (h4.textContent.toLowerCase().includes('medication')) return; // Skip already processed med title
            reportText += `${h4.textContent}\n`;
            let nextElement = h4.nextElementSibling;
            if (nextElement && (nextElement.tagName === 'P' || nextElement.tagName === 'UL')) {
                if (nextElement.tagName === 'P') reportText += `${nextElement.innerText.replace(/\n\s*\n/g, '\n')}\n`;
                if (nextElement.tagName === 'UL') {
                    nextElement.querySelectorAll('li').forEach(li => {
                        reportText += `  • ${li.textContent.trim()}\n`;
                    });
                }
            }
            reportText += "\n";
        });
        
        const disclaimer = elements.prescriptionAnalysisContent.querySelector('.critical-disclaimer-prescription p');
        if (disclaimer) reportText += `\n${disclaimer.textContent}\n`;

        navigator.clipboard.writeText(reportText.trim())
            .then(() => showTemporaryMessage('Prescription report copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy prescription report: ', err);
                showTemporaryMessage('Failed to copy report. See console.');
            });
    }


    function resetPrescriptionAnalysis() {
        uploadedPrescriptionFile = null;
        if(elements.prescriptionUploadInput) elements.prescriptionUploadInput.value = ''; // Reset file input
        if(elements.prescriptionFilename) elements.prescriptionFilename.textContent = 'No file chosen';
        if(elements.prescriptionPreviewImage) elements.prescriptionPreviewImage.src = '#';
        if(elements.prescriptionPreviewContainer) elements.prescriptionPreviewContainer.classList.add('hidden');
        if(elements.analyzePrescriptionBtn) elements.analyzePrescriptionBtn.disabled = true;
        if(elements.prescriptionResultsSection) elements.prescriptionResultsSection.classList.add('hidden');
        if(elements.prescriptionAnalysisContent) elements.prescriptionAnalysisContent.innerHTML = '';
        
        // Scroll to the top of the prescription analysis section if desired
        const prescriptionSection = document.querySelector('.prescription-analysis-section');
        if (prescriptionSection) {
            prescriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Fallback to page top
        }
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
            setTimeout(() => { if (document.body.contains(msgElement)) document.body.removeChild(msgElement); }, 500);
        }, 3500);
    }
});