# # app.py

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import random

# app = Flask(__name__)
# # Enable CORS to allow requests from your frontend (likely on a different port during development)
# CORS(app) 

# # Data Store for diseases.
# # - "symptom_rules": A list of sets, where each set contains symptoms that define a rule for this disease.
# #   Rules are checked in order of decreasing specificity (more symptoms first).
# # - "confidence": A pre-defined confidence score if this disease is matched.
# # - "recommendations": A list of actions for the user.
# # In a real-world scenario, this would be more dynamic, potentially using a database
# # and a trained Machine Learning model for predictions and confidence scores.
# disease_data_store = {
#     "Common Cold": {
#         "symptom_rules": [
#             {"fever", "cough", "sore throat"}, # More specific rule
#             {"fever", "cough"}                 # Less specific rule
#         ],
#         "confidence": 78,
#         "recommendations": [
#             { "icon": "🛌", "text": "Get plenty of rest" },
#             { "icon": "💧", "text": "Stay hydrated with warm fluids" },
#             { "icon": "🌡️", "text": "Monitor temperature regularly" },
#             { "icon": "💊", "text": "OTC cold medicine as needed" }
#         ]
#     },
#     "Influenza": {
#         "symptom_rules": [
#             {"fever", "muscle pain", "fatigue"},
#             {"fever", "muscle pain"}
#         ],
#         "confidence": 85,
#         "recommendations": [
#             { "icon": "🏠", "text": "Isolate to prevent spread" },
#             { "icon": "💊", "text": "Antiviral medication if early" },
#             { "icon": "🌡️", "text": "Fever reducers as needed" },
#             { "icon": "🏥", "text": "Seek ER if severe symptoms" }
#         ]
#     },
#     "Migraine": {
#         "symptom_rules": [
#             # The JS example implies "headache" and "nausea" for Migraine.
#             # Adding "blurred vision" or "light sensitivity" would make it more specific.
#             {"headache", "nausea", "blurred vision"}, 
#             {"headache", "nausea"} 
#         ],
#         "confidence": 92,
#         "recommendations": [
#             { "icon": "🌑", "text": "Rest in dark, quiet room" },
#             { "icon": "🧊", "text": "Cold compress on forehead" },
#             { "icon": "💧", "text": "Hydrate with electrolytes" },
#             { "icon": "📝", "text": "Track triggers in journal" }
#         ]
#     },
#     "Food Poisoning": {
#         "symptom_rules": [
#             {"vomiting", "diarrhea", "abdominal pain"},
#             {"vomiting", "diarrhea"}
#         ],
#         "confidence": 81,
#         "recommendations": [
#             { "icon": "🚽", "text": "Rest near bathroom" },
#             { "icon": "💧", "text": "Small sips of water often" },
#             { "icon": "🍌", "text": "BRAT diet when ready" },
#             { "icon": "🧼", "text": "Wash hands frequently" }
#         ]
#     }
#     # Add more diseases and their rules here
# }

# # Default response for when no specific disease rules are met
# default_unknown_condition = {
#     "disease": "Unknown Condition",
#     "confidence": 0, # Will be randomized
#     "recommendations": [
#         { "icon": "👨‍⚕️", "text": "Consult a healthcare professional for an accurate diagnosis." },
#         { "icon": "📞", "text": "Contact your primary care provider if symptoms persist or worsen." },
#         { "icon": "⚠️", "text": "Seek emergency care if you experience severe symptoms (e.g., difficulty breathing, chest pain)." }
#     ]
# }

# @app.route('/api/predict', methods=['POST'])
# def predict_disease_route():
#     try:
#         data = request.get_json()
#         if not data or 'selectedSymptoms' not in data:
#             return jsonify({"error": "Missing selectedSymptoms in request body"}), 400

#         selected_symptoms_list = data['selectedSymptoms']
        
#         # Normalize symptoms: lowercase and use a set for efficient checking
#         selected_symptoms_set = {s.lower().strip() for s in selected_symptoms_list if isinstance(s, str) and s.strip()}

#         if not selected_symptoms_set:
#             return jsonify({"error": "No valid symptoms provided"}), 400

#         predicted_disease_name = "Unknown Condition"
#         matched_disease_info = None
#         best_match_rule_size = 0

#         # --- Mock Prediction Logic ---
#         # This is a rule-based mock. In a real application with Scikit-learn,
#         # you would typically:
#         # 1. Preprocess selected_symptoms_set into a feature vector (e.g., using a CountVectorizer or TfidfVectorizer
#         #    fitted on your 'symptomsDatabase').
#         # 2. Load a pre-trained classification model (e.g., Logistic Regression, SVM, RandomForest).
#         #    `model = joblib.load('your_trained_model.pkl')`
#         # 3. Predict the disease:
#         #    `prediction_index = model.predict(feature_vector)`
#         #    `probabilities = model.predict_proba(feature_vector)`
#         # 4. Map prediction_index to disease name and get confidence from probabilities.
#         #    `predicted_disease_name = class_labels[prediction_index[0]]`
#         #    `confidence = int(probabilities[0][prediction_index[0]] * 100)`
#         #
#         # Current rule-based logic:
#         # Iterate through predefined diseases and check if any of their symptom rules match.
#         # Prioritize rules that are more specific (i.e., contain more symptoms).
        
#         for disease_name, info in disease_data_store.items():
#             # Sort rules by length (descending) to check most specific first
#             for rule_symptoms_set in sorted(info.get("symptom_rules", []), key=len, reverse=True):
#                 if rule_symptoms_set.issubset(selected_symptoms_set):
#                     # This rule matches. Check if it's more specific than previous matches.
#                     if len(rule_symptoms_set) > best_match_rule_size:
#                         predicted_disease_name = disease_name
#                         matched_disease_info = info
#                         best_match_rule_size = len(rule_symptoms_set)
#                     # If this rule is as specific as the best match found so far for another disease,
#                     # this simple logic will prefer the one encountered first or based on dict order.
#                     # More sophisticated tie-breaking could be added if needed.
#                     break # Found the best matching rule for *this* disease, move to the next disease.
        
#         if matched_disease_info:
#             response = {
#                 "disease": predicted_disease_name,
#                 "confidence": matched_disease_info["confidence"], # Use pre-defined confidence
#                 "recommendations": matched_disease_info["recommendations"]
#             }
#         else:
#             # No specific disease rule matched, use "Unknown Condition"
#             response = {
#                 "disease": default_unknown_condition["disease"],
#                 "confidence": random.randint(30, 55), # Randomize confidence for unknown
#                 "recommendations": default_unknown_condition["recommendations"]
#             }

#         return jsonify(response)

#     except Exception as e:
#         app.logger.error(f"Error in /api/predict: {e}")
#         return jsonify({"error": "An internal server error occurred"}), 500

# if __name__ == '__main__':
#     # For development, Flask's built-in server is fine.
#     # For production, use a production-ready WSGI server like Gunicorn:
#     # Example: gunicorn -w 4 -b 0.0.0.0:5000 app:app
#     app.run(host='0.0.0.0', port=5000, debug=True)
#     # host='0.0.0.0' makes the server accessible on your local network,
#     # not just from localhost (127.0.0.1).