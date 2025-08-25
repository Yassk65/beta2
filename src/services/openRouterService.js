// ============================================================================
// SERVICE OPENROUTER - CHAT MÉDICAL IA
// ============================================================================
// 🎯 Service pour interagir avec OpenRouter et les modèles IA médicaux
// 📅 Créé le : 12 Août 2025

const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'microsoft/wizardlm-2-8x22b'; // Modèle médical recommandé
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY manquante dans les variables d\'environnement');
    }
  }

  /**
   * Génère une réponse médicale contextuelle
   * @param {string} userMessage - Message du patient
   * @param {Array} conversationHistory - Historique de la conversation
   * @param {Object} medicalContext - Contexte médical du patient
   * @returns {Object} Réponse avec contenu, métadonnées et contexte
   */
  async generateMedicalResponse(userMessage, conversationHistory = [], medicalContext = {}) {
    try {
      const startTime = Date.now();
      
      // Construction du prompt système médical
      const systemPrompt = this.buildMedicalSystemPrompt(medicalContext);
      
      // Construction des messages pour l'IA
      const messages = this.buildConversationMessages(systemPrompt, conversationHistory, userMessage);
      
      // Appel à OpenRouter
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.defaultModel,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.3, // Température basse pour plus de précision médicale
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3002', // Requis par OpenRouter
            'X-Title': 'Assistant Médical MVP'
          },
          timeout: 30000 // 30 secondes de timeout
        }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Extraction de la réponse
      const aiResponse = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage?.total_tokens || 0;

      // Calcul du score de confiance basé sur la longueur et la cohérence
      const confidenceScore = this.calculateConfidenceScore(aiResponse, userMessage);

      return {
        success: true,
        content: aiResponse,
        metadata: {
          model: this.defaultModel,
          tokensUsed: tokensUsed,
          responseTime: responseTime,
          confidenceScore: confidenceScore
        },
        medicalContext: {
          contextUsed: medicalContext,
          disclaimerShown: true
        }
      };

    } catch (error) {
      console.error('Erreur OpenRouter:', error.response?.data || error.message);
      
      return {
        success: false,
        content: this.getFallbackResponse(userMessage),
        error: error.message,
        metadata: {
          model: 'fallback',
          tokensUsed: 0,
          responseTime: 0,
          confidenceScore: 0.1
        }
      };
    }
  }

  /**
   * Construit le prompt système médical avec contexte
   */
  buildMedicalSystemPrompt(medicalContext) {
    let basePrompt = `Tu es un assistant médical IA spécialisé dans l'aide aux patients. 

RÈGLES IMPORTANTES :
1. Tu n'es PAS un médecin et ne peux pas remplacer une consultation médicale
2. Toujours recommander de consulter un professionnel de santé pour un diagnostic
3. Fournir des informations générales et éducatives uniquement
4. Être empathique et rassurant tout en restant factuel
5. Utiliser un langage simple et accessible
6. Toujours inclure un disclaimer médical dans tes réponses

CONTEXTE PATIENT :`;

    // Ajout du contexte médical si disponible
    if (medicalContext.age) {
      basePrompt += `\n- Âge : ${medicalContext.age} ans`;
    }
    if (medicalContext.gender) {
      basePrompt += `\n- Genre : ${medicalContext.gender}`;
    }
    if (medicalContext.recentDocuments) {
      basePrompt += `\n- Documents récents : ${medicalContext.recentDocuments.length} document(s)`;
    }
    if (medicalContext.recentExams) {
      basePrompt += `\n- Examens récents : ${medicalContext.recentExams.length} examen(s)`;
    }

    return basePrompt + `\n\nRéponds en français de manière claire et bienveillante.`;
  }

  /**
   * Construit les messages de conversation pour l'IA
   */
  buildConversationMessages(systemPrompt, history, currentMessage) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Ajout de l'historique (limité aux 10 derniers messages)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.sender_type === 'patient' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Ajout du message actuel
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Calcule un score de confiance basique
   */
  calculateConfidenceScore(response, userMessage) {
    let score = 0.5; // Score de base

    // Facteurs positifs
    if (response.length > 100) score += 0.1; // Réponse détaillée
    if (response.includes('médecin') || response.includes('professionnel')) score += 0.2; // Recommande consultation
    if (response.includes('disclaimer') || response.includes('information générale')) score += 0.1; // Disclaimer présent
    
    // Facteurs négatifs
    if (response.length < 50) score -= 0.2; // Réponse trop courte
    if (response.includes('diagnostic') && !response.includes('consulter')) score -= 0.3; // Diagnostic sans recommandation

    return Math.max(0.1, Math.min(1.0, score)); // Entre 0.1 et 1.0
  }

  /**
   * Réponse de fallback en cas d'erreur
   */
  getFallbackResponse(userMessage) {
    return `Je suis désolé, je rencontre actuellement des difficultés techniques pour traiter votre demande. 

Pour toute question médicale, je vous recommande vivement de :
- Consulter votre médecin traitant
- Contacter votre établissement de santé
- En cas d'urgence, appeler le 15 (SAMU)

Votre santé est importante, n'hésitez pas à consulter un professionnel de santé qualifié.

⚠️ Disclaimer : Cet assistant ne remplace en aucun cas une consultation médicale professionnelle.`;
  }

  /**
   * Génère un titre automatique pour la session de chat
   */
  async generateSessionTitle(firstMessage) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Génère un titre court (max 50 caractères) pour cette conversation médicale. Réponds uniquement avec le titre, sans guillemets.'
            },
            {
              role: 'user',
              content: firstMessage
            }
          ],
          max_tokens: 20,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3002',
            'X-Title': 'Assistant Médical MVP'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      // Titre par défaut en cas d'erreur
      return `Consultation du ${new Date().toLocaleDateString('fr-FR')}`;
    }
  }

  /**
   * Analyse un document médical et génère un résumé ou une explication
   * @param {string} documentText - Contenu extrait du document
   * @param {string} documentType - Type de document (prescription, analyse, etc.)
   * @param {string} analysisType - Type d'analyse ('summary' ou 'explanation')
   * @param {Object} patientContext - Contexte du patient (âge, genre, etc.)
   * @returns {Object} Réponse avec l'analyse du document
   */
  async analyzeDocument(documentText, documentType, analysisType = 'summary', patientContext = {}) {
    try {
      const startTime = Date.now();
      
      let prompt;
      if (analysisType === 'summary') {
        prompt = `Tu es un assistant médical expert. Génère un résumé concis et compréhensible de ce document médical de type "${documentType}" pour un patient. Utilise un langage simple et accessible.

Document à analyser :
${documentText}

Fournis un résumé structuré avec :
1. **Résumé principal** (2-3 phrases)
2. **Résultats clés** (points importants)
3. **Recommandations** (si mentionnées)
4. **Prochaines étapes** (si applicables)

Reste factuel et ne donne pas de conseils médicaux spécifiques.`;
      } else {
        prompt = `Tu es un assistant médical expert. Explique ce document médical de type "${documentType}" de manière détaillée et compréhensible pour un patient. Utilise un langage accessible, évite le jargon médical complexe.

Document à analyser :
${documentText}

Fournis une explication complète avec :
1. **Contexte** - De quoi parle ce document
2. **Résultats détaillés** - Explication des valeurs et mesures
3. **Signification clinique** - Ce que cela signifie pour la santé
4. **Questions à poser** - Questions utiles pour le médecin

Reste factuel et ne donne pas de conseils médicaux spécifiques.`;
      }

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant médical expert qui aide les patients à comprendre leurs documents médicaux. Réponds toujours en français et inclus toujours un disclaimer médical.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: analysisType === 'summary' ? 800 : 1500,
          temperature: 0.3 // Température basse pour la précision médicale
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Assistant Médical MVP'
          },
          timeout: 30000
        }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const aiResponse = response.data.choices[0]?.message?.content;
      const tokensUsed = response.data.usage?.total_tokens || 0;

      if (!aiResponse) {
        throw new Error('Réponse vide de l\'API');
      }

      return {
        success: true,
        content: aiResponse,
        metadata: {
          model: this.defaultModel,
          tokensUsed: tokensUsed,
          responseTime: responseTime,
          analysisType: analysisType
        }
      };

    } catch (error) {
      console.error('Erreur analyse document OpenRouter:', error.response?.data || error.message);
      
      return {
        success: false,
        content: this.getDocumentAnalysisFallback(documentType, analysisType),
        error: error.message,
        metadata: {
          model: 'fallback',
          tokensUsed: 0,
          responseTime: 0,
          analysisType: analysisType
        }
      };
    }
  }

  /**
   * Réponse de fallback pour l'analyse de documents
   */
  getDocumentAnalysisFallback(documentType, analysisType) {
    const analysisWord = analysisType === 'summary' ? 'résumé' : 'explication';
    
    return `Je suis désolé, je ne peux pas générer de ${analysisWord} pour ce document de type "${documentType}" en raison de difficultés techniques temporaires.

**Recommandations importantes :**
- Consultez votre médecin traitant pour l'interprétation de ce document
- Apportez le document original lors de votre prochaine consultation
- N'hésitez pas à poser des questions à votre professionnel de santé
- En cas d'urgence ou de préoccupation, contactez immédiatement votre médecin

**Service d'urgence :** En cas d'urgence médicale, appelez le 15 (SAMU)

⚠️ **Disclaimer médical :** Cet assistant ne remplace en aucun cas une consultation médicale professionnelle. Seul un professionnel de santé qualifié peut interpréter et expliquer vos documents médicaux de manière appropriée.`;
  }

  /**
   * Vérifie la disponibilité du service OpenRouter
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        modelsAvailable: response.data.data?.length || 0
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new OpenRouterService();