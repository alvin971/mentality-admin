// src/services/claude.service.ts
// Appels au Cloudflare Worker claude-proxy (clé API côté worker, jamais exposée)

const WORKER_URL = import.meta.env.VITE_CLAUDE_WORKER_URL as string | undefined

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  if (!WORKER_URL) {
    throw new Error('VITE_CLAUDE_WORKER_URL non configuré. Ajoutez cette variable dans Cloudflare Pages.')
  }

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erreur Claude API: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ── Suggestions pour un item WAIS ──────────────────────────────────────────

export interface WaisItemForAI {
  testId: string
  itemNumber: number
  stimulus: string
  scoringType: string
  expectedResponses: Array<{ answer: string; score: number; keywords?: string[] }>
  irtA?: number
  irtB?: number
}

export async function getItemSuggestions(
  item: WaisItemForAI,
  context?: string
): Promise<string> {
  const system = `Tu es un expert en neuropsychologie clinique et en psychométrie, spécialisé dans
le WAIS-IV (Wechsler Adult Intelligence Scale). Tu analyses des items de tests cognitifs et
fournis des recommandations cliniques précises en français, basées sur les bonnes pratiques
de cotation du WAIS-IV.`

  const user = `Analyse cet item WAIS-IV et propose des améliorations :

Test : ${item.testId}
Item ${item.itemNumber} : "${item.stimulus}"
Type de scoring : ${item.scoringType}
Réponses attendues actuelles :
${item.expectedResponses.map(r => `  - Score ${r.score} : "${r.answer}"`).join('\n')}
${item.irtA !== undefined ? `Paramètres IRT : a=${item.irtA} (discrimination), b=${item.irtB} (difficulté)` : ''}
${context ? `\nContexte additionnel : ${context}` : ''}

Réponds en JSON avec ce format :
{
  "analysis": "Analyse clinique de l'item",
  "suggested_responses": [{"answer": "...", "score": 0|1|2, "rationale": "..."}],
  "irt_comment": "Commentaire sur les paramètres IRT si disponibles",
  "clinical_notes": "Notes cliniques importantes",
  "improvement": "Suggestions d'amélioration concrètes"
}`

  return callClaude(system, user)
}

// ── Analyse des tables normatives ──────────────────────────────────────────

export async function analyzeNormativeData(
  testId: string,
  ageGroup: string,
  data: Array<{ raw_score: number; scaled_score: number; percentile: number }>
): Promise<string> {
  const system = `Tu es un statisticien spécialisé en psychométrie et en tables normatives WAIS-IV.
Tu identifies les anomalies, incohérences et problèmes dans les données normatives.`

  const user = `Analyse ces données normatives WAIS-IV et identifie les anomalies :

Test : ${testId}
Groupe d'âge : ${ageGroup}
Données (score brut → score normalisé → percentile) :
${data.map(d => `  brut=${d.raw_score} → normalisé=${d.scaled_score} → percentile=${d.percentile}`).join('\n')}

Vérifie :
1. Monotonie croissante (score brut ↑ = score normalisé ↑ = percentile ↑)
2. Cohérence des sauts (pas de sauts anormaux)
3. Plage normale pour ce groupe d'âge
4. Correspondance percentile ↔ score normalisé (10=50e, 7=16e, 13=84e, etc.)

Réponds en JSON : {"anomalies": [...], "recommendations": [...], "overall_quality": "good|fair|poor"}`

  return callClaude(system, user)
}

// ── Suggestion de paramètres IRT ───────────────────────────────────────────

export async function suggestIRTParams(
  testId: string,
  itemNumber: number,
  stimulus: string,
  observations?: string
): Promise<{ a: number; b: number; rationale: string }> {
  const system = `Tu es un expert en Théorie de la Réponse à l'Item (TRI/IRT), spécialisé
dans le modèle 2PL (two-parameter logistic) pour les tests cognitifs adultes.`

  const user = `Estime les paramètres IRT 2PL pour cet item WAIS-IV :

Test : ${testId}, Item ${itemNumber}
Stimulus : "${stimulus}"
${observations ? `Observations cliniques : ${observations}` : ''}

Paramètres à estimer :
- a (discrimination) : généralement entre 0.5 et 2.5, valeur typique ≈ 1.2
- b (difficulté) : en logit, généralement entre -3 et +3

Réponds en JSON : {"a": number, "b": number, "rationale": "explication"}`

  const raw = await callClaude(system, user)
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {}
  return { a: 1.0, b: 0.0, rationale: raw }
}

// ── Note clinique automatique ──────────────────────────────────────────────

export async function generateClinicalNote(
  testId: string,
  itemStimulus: string,
  performanceData: Array<{ correct: boolean; responseTime?: number; response?: string }>
): Promise<string> {
  const system = `Tu es un neuropsychologue clinicien expert en interprétation du WAIS-IV.
Tu génères des notes cliniques concises et pertinentes basées sur les performances aux items.`

  const total = performanceData.length
  const correct = performanceData.filter(p => p.correct).length
  const avgTime = performanceData
    .filter(p => p.responseTime)
    .reduce((s, p) => s + (p.responseTime ?? 0), 0) / (total || 1)

  const user = `Génère une note clinique pour cet item WAIS-IV :

Test : ${testId}
Item : "${itemStimulus}"
Performances sur ${total} passations :
- Taux de réussite : ${Math.round((correct / total) * 100)}%
- Temps moyen de réponse : ${Math.round(avgTime)}ms
${performanceData.slice(0, 5).map(p => `  - ${p.correct ? '✓' : '✗'}${p.response ? ` "${p.response}"` : ''}`).join('\n')}

Génère une note clinique concise (2-3 phrases) en français sur la difficulté et la pertinence de cet item.`

  return callClaude(system, user)
}

// ── Interprétation FSIQ ────────────────────────────────────────────────────

export async function interpretFSIQ(
  fsiq: number,
  indices: { vci?: number; vsi?: number; fri?: number; wmi?: number; psi?: number },
  ageGroup: string
): Promise<string> {
  const system = `Tu es un neuropsychologue clinicien expert en interprétation du profil cognitif WAIS-IV.
Tu fournis des interprétations cliniques nuancées, précises et éthiques en français.`

  const user = `Interprète ce profil WAIS-IV :

FSIQ : ${fsiq}
Groupe d'âge : ${ageGroup}
Indices :
${indices.vci !== undefined ? `- ICV (Compréhension Verbale) : ${indices.vci}` : ''}
${indices.vsi !== undefined ? `- IRP (Raisonnement Perceptif) : ${indices.vsi}` : ''}
${indices.fri !== undefined ? `- IFR (Raisonnement Fluide) : ${indices.fri}` : ''}
${indices.wmi !== undefined ? `- IMT (Mémoire de Travail) : ${indices.wmi}` : ''}
${indices.psi !== undefined ? `- IVT (Vitesse de Traitement) : ${indices.psi}` : ''}

Fournis : 1) Classification globale, 2) Points forts/faibles, 3) Hypothèses cliniques,
4) Recommandations de passation complémentaire.`

  return callClaude(system, user)
}
