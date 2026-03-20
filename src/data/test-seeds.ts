// src/data/test-seeds.ts
// Real item data extracted from Flutter WAIS-IV implementations
// Used to pre-populate test_configurations via the admin UI or direct Supabase insert

import type {
  PartialScoringConfig,
  DichotomicConfig,
  TimeBonusConfig,
  DigitSpanConfig,
  SpeedConfig,
  WaisTestConfig,
} from '@/types/scoring'
import type { CompositeIndex } from '@/types'

const DEFAULT_THRESHOLDS = {
  very_low:  [0, 6]   as [number, number],
  low:       [7, 9]   as [number, number],
  average:   [10, 12] as [number, number],
  high:      [13, 15] as [number, number],
  very_high: [16, 99] as [number, number],
}

// ============================================================
// SIMILITUDES — 21 items, scoring partiel 0/1/2
// ============================================================

export const SIMILITUDES_SEED: PartialScoringConfig = {
  type: 'partial',
  name: 'Similitudes',
  index: 'ICV' as CompositeIndex,
  notes: 'Mesure l\'abstraction conceptuelle et le raisonnement verbal. Discontinuation : 3 zéros consécutifs.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    // Niveau 1 : Concret (items 1-4)
    { id: 'sim_01', label: 'Orange / Banane', level: 1, theta: -1.5,
      score_2_criteria: 'Catégorie sémantique correcte (fruits)',
      score_1_criteria: 'Caractéristique physique ou fonctionnelle commune',
      keywords_2: ['fruits', 'aliments naturels'],
      keywords_1: ['on les mange', 'comestibles', 'sucrées', 'peau', 'arbres', 'nourriture'] },
    { id: 'sim_02', label: 'Chien / Chat', level: 1, theta: -1.3,
      score_2_criteria: 'Animaux / animaux domestiques / mammifères',
      score_1_criteria: 'Caractéristique physique (4 pattes, fourrure) ou fonctionnelle',
      keywords_2: ['animaux', 'animaux domestiques', 'mammifères', 'animaux de compagnie'],
      keywords_1: ['quatre pattes', 'maison', 'fourrure', 'compagnons', 'mignons'] },
    { id: 'sim_03', label: 'Chaussure / Chapeau', level: 1, theta: -1.1,
      score_2_criteria: 'Vêtements / articles vestimentaires',
      score_1_criteria: 'Usage (on les porte, on les met)',
      keywords_2: ['vêtements', 'habits', 'articles vestimentaires', 'accessoires vestimentaires'],
      keywords_1: ['on les porte', 'protègent', 'on les met', 'couvrent'] },
    { id: 'sim_04', label: 'Table / Chaise', level: 1, theta: -0.9,
      score_2_criteria: 'Meubles / mobilier',
      score_1_criteria: 'Usage domestique commun',
      keywords_2: ['meubles', 'mobilier', 'objets de maison'],
      keywords_1: ['manger', 'bois', 'asseoir', 'maison'] },

    // Niveau 2 : Fonctionnel (items 5-10)
    { id: 'sim_05', label: 'Marteau / Tournevis', level: 2, theta: -0.7,
      score_2_criteria: 'Outils / instruments de travail',
      score_1_criteria: 'Usage (réparer, construire)',
      keywords_2: ['outils', 'instruments de travail', 'équipement de bricolage'],
      keywords_1: ['réparer', 'construire', 'main', 'bricolage'] },
    { id: 'sim_06', label: 'Crayon / Stylo', level: 2, theta: -0.5,
      score_2_criteria: 'Instruments d\'écriture / outils pour écrire',
      score_1_criteria: 'Usage (écrire, dessiner)',
      keywords_2: ['instruments d\'écriture', 'outils d\'écriture', 'fournitures scolaires'],
      keywords_1: ['écrire', 'marque', 'dessiner', 'encre', 'graphite'] },
    { id: 'sim_07', label: 'Voiture / Train', level: 2, theta: -0.3,
      score_2_criteria: 'Moyens de transport / véhicules',
      score_1_criteria: 'Usage (déplacer, voyager)',
      keywords_2: ['moyens de transport', 'véhicules', 'transports', 'moyens de déplacement'],
      keywords_1: ['déplacent', 'voyager', 'roues', 'endroit'] },
    { id: 'sim_08', label: 'Fourchette / Cuillère', level: 2, theta: -0.1,
      score_2_criteria: 'Couverts / ustensiles de cuisine',
      score_1_criteria: 'Usage (manger, prendre la nourriture)',
      keywords_2: ['couverts', 'ustensiles de cuisine', 'instruments pour manger'],
      keywords_1: ['manger', 'nourriture', 'métal', 'table'] },
    { id: 'sim_09', label: 'Montre / Horloge', level: 2, theta: 0.1,
      score_2_criteria: 'Instruments de mesure du temps',
      score_1_criteria: 'Indiquent l\'heure',
      keywords_2: ['instruments de mesure du temps', 'instruments horaires'],
      keywords_1: ['heure', 'temps', 'aiguilles', 'retard'] },
    { id: 'sim_10', label: 'Téléphone / Radio', level: 2, theta: 0.3,
      score_2_criteria: 'Moyens de communication / appareils de communication',
      score_1_criteria: 'Transmettent des sons / sont électroniques',
      keywords_2: ['moyens de communication', 'appareils de communication', 'technologies de communication'],
      keywords_1: ['sons', 'électroniques', 'messages'] },

    // Niveau 3 : Catégoriel (items 11-16)
    { id: 'sim_11', label: 'Poème / Statue', level: 3, theta: 0.5,
      score_2_criteria: 'Œuvres d\'art / créations artistiques',
      score_1_criteria: 'On les admire / faites par des artistes',
      keywords_2: ['œuvres d\'art', 'formes d\'art', 'créations artistiques', 'art'],
      keywords_1: ['admire', 'artistes', 'belles', 'exprimer'] },
    { id: 'sim_12', label: 'Médecin / Enseignant', level: 3, theta: 0.7,
      score_2_criteria: 'Professions / métiers / carrières',
      score_1_criteria: 'Ils aident / ils travaillent avec les autres',
      keywords_2: ['professions', 'métiers', 'emplois', 'carrières professionnelles'],
      keywords_1: ['aident', 'étudié', 'services', 'autres'] },
    { id: 'sim_13', label: 'Joie / Tristesse', level: 3, theta: 0.9,
      score_2_criteria: 'Émotions / sentiments / états émotionnels',
      score_1_criteria: 'On les ressent',
      keywords_2: ['émotions', 'sentiments', 'états émotionnels', 'affects'],
      keywords_1: ['ressent', 'humeurs', 'changent', 'éprouve'] },
    { id: 'sim_14', label: 'Vue / Ouïe', level: 3, theta: 1.1,
      score_2_criteria: 'Sens / capacités sensorielles',
      score_1_criteria: 'On perçoit avec / sens du corps',
      keywords_2: ['sens', 'sens biologiques', 'capacités sensorielles', 'perceptions sensorielles'],
      keywords_1: ['perçoit', 'détecter', 'informent'] },
    { id: 'sim_15', label: 'Biologie / Physique', level: 3, theta: 1.3,
      score_2_criteria: 'Sciences / disciplines scientifiques',
      score_1_criteria: 'On les étudie / pour comprendre le monde',
      keywords_2: ['sciences', 'disciplines scientifiques', 'domaines scientifiques', 'branches de la science'],
      keywords_1: ['étudie', 'monde', 'expériences', 'matières'] },
    { id: 'sim_16', label: 'Démocratie / Monarchie', level: 3, theta: 1.5,
      score_2_criteria: 'Systèmes politiques / formes de gouvernement',
      score_1_criteria: 'Façons de diriger un pays / systèmes de pouvoir',
      keywords_2: ['systèmes politiques', 'formes de gouvernement', 'régimes politiques'],
      keywords_1: ['pays', 'société', 'pouvoir', 'gouverner'] },

    // Niveau 4 : Abstrait (items 17-21)
    { id: 'sim_17', label: 'Liberté / Justice', level: 4, theta: 1.7,
      score_2_criteria: 'Valeurs / principes moraux / idéaux / droits fondamentaux',
      score_1_criteria: 'Importantes pour la société / principes',
      keywords_2: ['valeurs', 'principes moraux', 'idéaux', 'valeurs démocratiques', 'droits fondamentaux'],
      keywords_1: ['société', 'défend', 'principes', 'bonnes'] },
    { id: 'sim_18', label: 'Sagesse / Intelligence', level: 4, theta: 1.9,
      score_2_criteria: 'Capacités intellectuelles / qualités mentales / aptitudes cognitives',
      score_1_criteria: 'Aident à penser / qualités positives',
      keywords_2: ['capacités intellectuelles', 'qualités mentales', 'aptitudes cognitives', 'facultés de l\'esprit'],
      keywords_1: ['penser', 'problèmes', 'qualités', 'intelligent'] },
    { id: 'sim_19', label: 'Passé / Futur', level: 4, theta: 2.1,
      score_2_criteria: 'Périodes temporelles / dimensions du temps',
      score_1_criteria: 'Moments différents / parties du temps',
      keywords_2: ['périodes temporelles', 'dimensions du temps', 'époques', 'temps'],
      keywords_1: ['moments', 'parties', 'passe'] },
    { id: 'sim_20', label: 'Vérité / Beauté', level: 4, theta: 2.3,
      score_2_criteria: 'Concepts philosophiques / idéaux abstraits / concepts universels',
      score_1_criteria: 'Choses qu\'on recherche / importantes pour l\'humanité',
      keywords_2: ['concepts philosophiques', 'idéaux abstraits', 'valeurs esthétiques et épistémiques', 'concepts universels'],
      keywords_1: ['recherche', 'humanité', 'subjectives', 'abstraites'] },
    { id: 'sim_21', label: 'Pensée / Imagination', level: 4, theta: 2.5,
      score_2_criteria: 'Processus mentaux / fonctions cognitives / activités de l\'esprit',
      score_1_criteria: 'Dans la tête / activités mentales',
      keywords_2: ['processus mentaux', 'fonctions cognitives', 'activités de l\'esprit', 'capacités intellectuelles'],
      keywords_1: ['tête', 'idées', 'mentales', 'cerveau'] },
  ],
  discontinuation_rule: { consecutive_zeros: 3 },
}

// ============================================================
// VOCABULAIRE — 30 items, scoring partiel 0/1/2 (pas de discontinuation)
// ============================================================

export const VOCABULAIRE_SEED: PartialScoringConfig = {
  type: 'partial',
  name: 'Vocabulaire',
  index: 'ICV' as CompositeIndex,
  notes: 'Mesure la connaissance lexicale et la compréhension verbale. Pas de règle de discontinuation.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    // Niveau 1 : Très facile — Top 1000 (items 1-5)
    { id: 'voc_01', label: 'Table', level: 1, theta: -2.0,
      score_2_criteria: 'Définition complète mentionnant le plateau + la fonction',
      score_1_criteria: 'Désignation partielle (meuble, sert à manger)',
      keywords_2: ['meuble', 'plateau', 'horizontal', 'poser'],
      keywords_1: ['meuble', 'manger', 'plat', 'pieds'] },
    { id: 'voc_02', label: 'Chat', level: 1, theta: -1.8,
      score_2_criteria: 'Animal domestique félin / petit mammifère carnivore',
      score_1_criteria: 'Animal / animal de compagnie sans précision taxonomique',
      keywords_2: ['félin', 'domestique', 'mammifère', 'carnivore'],
      keywords_1: ['animal', 'compagnie', 'miaule', 'poils'] },
    { id: 'voc_03', label: 'Livre', level: 1, theta: -1.6,
      score_2_criteria: 'Ensemble de pages reliées / ouvrage imprimé',
      score_1_criteria: 'Pour lire / ça a des pages',
      keywords_2: ['pages', 'reliées', 'ouvrage', 'imprimé', 'publication'],
      keywords_1: ['lire', 'pages', 'texte'] },
    { id: 'voc_04', label: 'Courir', level: 1, theta: -1.4,
      score_2_criteria: 'Se déplacer rapidement en utilisant ses jambes',
      score_1_criteria: 'Marcher vite / aller vite',
      keywords_2: ['déplacer', 'rapidement', 'jambes', 'vitesse'],
      keywords_1: ['vite', 'marcher', 'bouger'] },
    { id: 'voc_05', label: 'Froid', level: 1, theta: -1.2,
      score_2_criteria: 'Sensation de basse température / manque de chaleur',
      score_1_criteria: 'Pas chaud / température basse',
      keywords_2: ['basse température', 'manque de chaleur', 'faible chaleur'],
      keywords_1: ['chaud', 'température', 'geler'] },

    // Niveau 2 : Facile — Top 5000 (items 6-12)
    { id: 'voc_06', label: 'Montagne', level: 2, theta: -1.0,
      score_2_criteria: 'Relief terrestre élevé / grande élévation naturelle du terrain',
      score_1_criteria: 'C\'est haut / ça monte',
      keywords_2: ['relief', 'élevé', 'élévation', 'terrain', 'naturelle'],
      keywords_1: ['haut', 'monte', 'sommet', 'grande'] },
    { id: 'voc_07', label: 'Genereux', level: 2, theta: -0.8,
      score_2_criteria: 'Qualité de qui donne beaucoup / disposition à aider les autres sans attendre de retour',
      score_1_criteria: 'Qui donne / gentil',
      keywords_2: ['donne', 'beaucoup', 'aider', 'retour', 'partage'],
      keywords_1: ['donne', 'gentil', 'aide'] },
    { id: 'voc_08', label: 'Éphémère', level: 2, theta: -0.5,
      score_2_criteria: 'Qui dure très peu de temps / passager, fugace',
      score_1_criteria: 'Court / qui passe vite',
      keywords_2: ['dure peu', 'passager', 'fugace', 'temporaire', 'court'],
      keywords_1: ['court', 'passe vite', 'pas longtemps'] },
    { id: 'voc_09', label: 'Forêt', level: 2, theta: -0.3,
      score_2_criteria: 'Grande étendue boisée / espace naturel avec de nombreux arbres',
      score_1_criteria: 'Plein d\'arbres / bois',
      keywords_2: ['étendue boisée', 'arbres', 'espace naturel', 'boisé'],
      keywords_1: ['arbres', 'bois', 'nature'] },
    { id: 'voc_10', label: 'Timide', level: 2, theta: -0.1,
      score_2_criteria: 'Manque d\'assurance en présence des autres / crainte du contact social',
      score_1_criteria: 'Qui n\'ose pas / peur des gens',
      keywords_2: ['assurance', 'contact social', 'gêne', 'réservé'],
      keywords_1: ['ose pas', 'peur', 'rencontrer', 'discret'] },
    { id: 'voc_11', label: 'Récupérer', level: 2, theta: 0.1,
      score_2_criteria: 'Retrouver quelque chose ou regagner un état antérieur',
      score_1_criteria: 'Reprendre / retrouver',
      keywords_2: ['retrouver', 'regagner', 'récupérer', 'recouvrer'],
      keywords_1: ['reprendre', 'retrouver', 'prendre'] },
    { id: 'voc_12', label: 'Obstacle', level: 2, theta: 0.3,
      score_2_criteria: 'Ce qui s\'oppose au passage ou à la réalisation d\'une action',
      score_1_criteria: 'Ce qui gêne / problème',
      keywords_2: ['s\'oppose', 'passage', 'réalisation', 'empêche'],
      keywords_1: ['gêne', 'problème', 'bloque', 'difficile'] },

    // Niveau 3 : Moyen (items 13-20)
    { id: 'voc_13', label: 'Altruiste', level: 3, theta: 0.5,
      score_2_criteria: 'Qui se soucie du bien des autres avant son propre intérêt',
      score_1_criteria: 'Qui pense aux autres / désintéressé',
      keywords_2: ['bien des autres', 'intérêt propre', 'désintéressé', 'autrui'],
      keywords_1: ['autres', 'pense', 'désintéressé'] },
    { id: 'voc_14', label: 'Résilience', level: 3, theta: 0.7,
      score_2_criteria: 'Capacité à surmonter les épreuves et à se reconstruire après un traumatisme',
      score_1_criteria: 'Résister / se relever',
      keywords_2: ['surmonter', 'épreuves', 'reconstruire', 'traumatisme', 'rebondir'],
      keywords_1: ['résister', 'relever', 'difficultés'] },
    { id: 'voc_15', label: 'Abstrait', level: 3, theta: 0.9,
      score_2_criteria: 'Qui n\'a pas de réalité concrète / qui relève de la pensée pure sans rapport direct avec la réalité matérielle',
      score_1_criteria: 'Non concret / dans la tête',
      keywords_2: ['réalité concrète', 'pensée pure', 'matérielle', 'idée'],
      keywords_1: ['concret', 'tête', 'idée'] },
    { id: 'voc_16', label: 'Inertie', level: 3, theta: 1.1,
      score_2_criteria: 'Tendance à rester dans un état de repos ou de mouvement uniforme / résistance au changement',
      score_1_criteria: 'Ne pas bouger / résister',
      keywords_2: ['repos', 'mouvement uniforme', 'résistance', 'changement'],
      keywords_1: ['bouger', 'résister', 'rester'] },
    { id: 'voc_17', label: 'Pragmatique', level: 3, theta: 1.3,
      score_2_criteria: 'Qui privilégie l\'efficacité pratique sur les principes théoriques',
      score_1_criteria: 'Pratique / concret',
      keywords_2: ['efficacité', 'pratique', 'théoriques', 'concret', 'réaliste'],
      keywords_1: ['pratique', 'concret', 'résultats'] },
    { id: 'voc_18', label: 'Ambivalence', level: 3, theta: 1.5,
      score_2_criteria: 'État dans lequel on éprouve simultanément deux sentiments ou attitudes contradictoires',
      score_1_criteria: 'Deux sentiments à la fois / indécis',
      keywords_2: ['simultanément', 'contradictoires', 'sentiments', 'attitudes'],
      keywords_1: ['deux', 'sentiments', 'indécis', 'à la fois'] },
    { id: 'voc_19', label: 'Paradoxe', level: 3, theta: 1.7,
      score_2_criteria: 'Affirmation qui semble contradictoire mais qui peut être vraie / raisonnement menant à une contradiction',
      score_1_criteria: 'Contradiction / contraire',
      keywords_2: ['contradictoire', 'vraie', 'raisonnement', 'contradiction', 'absurde'],
      keywords_1: ['contradiction', 'contraire', 'bizarre'] },
    { id: 'voc_20', label: 'Catharsis', level: 3, theta: 1.9,
      score_2_criteria: 'Purification émotionnelle / libération des tensions par l\'expression des émotions',
      score_1_criteria: 'Soulagement / purification',
      keywords_2: ['purification', 'émotions', 'libération', 'tensions', 'expression'],
      keywords_1: ['soulagement', 'purification', 'émotions'] },

    // Niveau 4 : Difficile (items 21-27)
    { id: 'voc_21', label: 'Épistémologie', level: 4, theta: 2.1,
      score_2_criteria: 'Branche de la philosophie qui étudie la nature et les fondements de la connaissance',
      score_1_criteria: 'Étude de la connaissance / philosophie',
      keywords_2: ['philosophie', 'connaissance', 'fondements', 'nature', 'savoir'],
      keywords_1: ['connaissance', 'philosophie', 'savoir'] },
    { id: 'voc_22', label: 'Heuristique', level: 4, theta: 2.2,
      score_2_criteria: 'Méthode qui cherche des solutions par approximations successives / règle empirique',
      score_1_criteria: 'Méthode / essai-erreur',
      keywords_2: ['méthode', 'approximations', 'solutions', 'empirique'],
      keywords_1: ['méthode', 'essai', 'solution'] },
    { id: 'voc_23', label: 'Apathique', level: 4, theta: 2.3,
      score_2_criteria: 'Qui manque d\'énergie, d\'intérêt ou d\'émotion / indifférent',
      score_1_criteria: 'Sans énergie / indifférent',
      keywords_2: ['énergie', 'intérêt', 'émotion', 'indifférent', 'passif'],
      keywords_1: ['sans', 'énergie', 'indifférent'] },
    { id: 'voc_24', label: 'Paradigme', level: 4, theta: 2.4,
      score_2_criteria: 'Modèle théorique dominant dans un domaine / cadre de référence intellectuel',
      score_1_criteria: 'Modèle / référence',
      keywords_2: ['modèle', 'théorique', 'dominant', 'cadre', 'référence'],
      keywords_1: ['modèle', 'référence', 'théorie'] },
    { id: 'voc_25', label: 'Tautologie', level: 4, theta: 2.5,
      score_2_criteria: 'Répétition de la même idée en d\'autres termes / vérité logique nécessaire',
      score_1_criteria: 'Répétition / redondance',
      keywords_2: ['répétition', 'idée', 'termes', 'logique', 'nécessaire'],
      keywords_1: ['répétition', 'même chose', 'redondant'] },
    { id: 'voc_26', label: 'Dichotomie', level: 4, theta: 2.6,
      score_2_criteria: 'Division en deux parties opposées / opposition binaire',
      score_1_criteria: 'Division en deux / opposition',
      keywords_2: ['division', 'deux', 'opposées', 'binaire'],
      keywords_1: ['deux', 'division', 'opposés'] },
    { id: 'voc_27', label: 'Sophisme', level: 4, theta: 2.7,
      score_2_criteria: 'Raisonnement faux présenté comme valide / argument fallacieux',
      score_1_criteria: 'Faux raisonnement / tromperie',
      keywords_2: ['raisonnement faux', 'valide', 'fallacieux', 'tromper'],
      keywords_1: ['faux', 'raisonnement', 'tromper'] },

    // Niveau 5 : Très difficile (items 28-30)
    { id: 'voc_28', label: 'Ontologie', level: 5, theta: 2.9,
      score_2_criteria: 'Branche de la philosophie qui étudie l\'être en tant qu\'être et ses propriétés fondamentales',
      score_1_criteria: 'Étude de l\'existence / philosophie',
      keywords_2: ['philosophie', 'être', 'existence', 'propriétés fondamentales'],
      keywords_1: ['existence', 'philosophie', 'être'] },
    { id: 'voc_29', label: 'Syncrétisme', level: 5, theta: 3.1,
      score_2_criteria: 'Fusion de plusieurs doctrines ou croyances en un système composite',
      score_1_criteria: 'Mélange / fusion',
      keywords_2: ['fusion', 'doctrines', 'croyances', 'composite', 'mélange'],
      keywords_1: ['mélange', 'fusion', 'différents'] },
    { id: 'voc_30', label: 'Eschatologie', level: 5, theta: 3.3,
      score_2_criteria: 'Doctrine relative aux fins dernières de l\'homme et du monde / théologie de la fin des temps',
      score_1_criteria: 'Fin du monde / théologie',
      keywords_2: ['fins dernières', 'homme', 'monde', 'théologie', 'temps'],
      keywords_1: ['fin', 'monde', 'religion'] },
  ],
  discontinuation_rule: { consecutive_zeros: 0 },  // pas de discontinuation
}

// ============================================================
// INFORMATION — 28 items QCM, scoring dichotomique 0/1
// ============================================================

export const INFORMATION_SEED: DichotomicConfig = {
  type: 'dichotomic',
  name: 'Information',
  index: 'ICV' as CompositeIndex,
  notes: 'Mesure les connaissances générales à long terme. QCM 4 choix.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    // Sciences naturelles (6 items)
    { id: 'inf_01', label: 'Combien de pattes a une araignée ?', level: 1, theta: -1.5, correct_answer: '8', domain: 'Sciences naturelles' },
    { id: 'inf_02', label: 'Quel organe pompe le sang dans le corps humain ?', level: 1, theta: -1.2, correct_answer: 'Le cœur', domain: 'Sciences naturelles' },
    { id: 'inf_03', label: 'Combien d\'os compte le corps humain adulte ?', level: 2, theta: 0.5, correct_answer: '206', domain: 'Sciences naturelles' },
    { id: 'inf_04', label: 'Quelle planète est la plus proche du Soleil ?', level: 2, theta: 0.8, correct_answer: 'Mercure', domain: 'Sciences naturelles' },
    { id: 'inf_05', label: 'Quel est le symbole chimique de l\'or ?', level: 3, theta: 1.5, correct_answer: 'Au', domain: 'Sciences naturelles' },
    { id: 'inf_06', label: 'Quelle est la vitesse de la lumière dans le vide ?', level: 3, theta: 2.0, correct_answer: '300 000 km/s', domain: 'Sciences naturelles' },
    // Histoire/Géographie (7 items)
    { id: 'inf_07', label: 'Quelle est la capitale de la France ?', level: 1, theta: -1.8, correct_answer: 'Paris', domain: 'Histoire/Géographie' },
    { id: 'inf_08', label: 'Sur quel continent se trouve l\'Égypte ?', level: 1, theta: -1.3, correct_answer: 'Afrique', domain: 'Histoire/Géographie' },
    { id: 'inf_09', label: 'Quelle est la capitale de l\'Italie ?', level: 2, theta: -0.5, correct_answer: 'Rome', domain: 'Histoire/Géographie' },
    { id: 'inf_10', label: 'En quelle année Christophe Colomb a-t-il découvert l\'Amérique ?', level: 2, theta: 0.3, correct_answer: '1492', domain: 'Histoire/Géographie' },
    { id: 'inf_11', label: 'Quel océan sépare l\'Amérique de l\'Europe ?', level: 2, theta: 0.6, correct_answer: 'Océan Atlantique', domain: 'Histoire/Géographie' },
    { id: 'inf_12', label: 'Quelle est la capitale de l\'Australie ?', level: 3, theta: 1.8, correct_answer: 'Canberra', domain: 'Histoire/Géographie' },
    { id: 'inf_13', label: 'Quel traité a mis fin à la Première Guerre mondiale ?', level: 3, theta: 2.2, correct_answer: 'Traité de Versailles', domain: 'Histoire/Géographie' },
    // Culture générale (6 items)
    { id: 'inf_14', label: 'Combien de jours compte une semaine ?', level: 1, theta: -2.0, correct_answer: '7', domain: 'Culture générale' },
    { id: 'inf_15', label: 'Quelle couleur obtient-on en mélangeant le bleu et le jaune ?', level: 1, theta: -1.6, correct_answer: 'Vert', domain: 'Culture générale' },
    { id: 'inf_16', label: 'Qui a peint la Joconde ?', level: 2, theta: 0.0, correct_answer: 'Léonard de Vinci', domain: 'Culture générale' },
    { id: 'inf_17', label: 'Quel instrument mesure la température ?', level: 2, theta: 0.4, correct_answer: 'Thermomètre', domain: 'Culture générale' },
    { id: 'inf_18', label: 'Quelle est la monnaie officielle du Japon ?', level: 3, theta: 1.6, correct_answer: 'Yen', domain: 'Culture générale' },
    { id: 'inf_19', label: 'Combien de cordes possède une guitare classique ?', level: 3, theta: 1.9, correct_answer: '6', domain: 'Culture générale' },
    // Mathématiques/Logique (5 items)
    { id: 'inf_20', label: 'Combien de jours compte une année normale (non bissextile) ?', level: 1, theta: -1.4, correct_answer: '365', domain: 'Mathématiques/Logique' },
    { id: 'inf_21', label: 'Combien font 12 × 12 ?', level: 1, theta: -0.8, correct_answer: '144', domain: 'Mathématiques/Logique' },
    { id: 'inf_22', label: 'Combien de minutes y a-t-il dans 2 heures ?', level: 2, theta: 0.2, correct_answer: '120', domain: 'Mathématiques/Logique' },
    { id: 'inf_23', label: 'Quelle est la valeur de π arrondie à deux décimales ?', level: 2, theta: 0.9, correct_answer: '3.14', domain: 'Mathématiques/Logique' },
    { id: 'inf_24', label: 'Combien de degrés compte un angle droit ?', level: 3, theta: 1.3, correct_answer: '90°', domain: 'Mathématiques/Logique' },
    // Arts/Littérature (4 items)
    { id: 'inf_25', label: 'Qui a écrit "Roméo et Juliette" ?', level: 2, theta: 0.7, correct_answer: 'Shakespeare', domain: 'Arts/Littérature' },
    { id: 'inf_26', label: 'Quel compositeur a écrit "La 9e Symphonie" ?', level: 2, theta: 1.1, correct_answer: 'Beethoven', domain: 'Arts/Littérature' },
    { id: 'inf_27', label: 'Qui a écrit "Hamlet" ?', level: 3, theta: 2.1, correct_answer: 'Shakespeare', domain: 'Arts/Littérature' },
    { id: 'inf_28', label: 'Quel peintre est connu pour ses "Tournesols" ?', level: 3, theta: 2.4, correct_answer: 'Vincent van Gogh', domain: 'Arts/Littérature' },
  ],
  discontinuation_rule: null,
}

// ============================================================
// CUBES — 14 items, scoring avec bonus temps
// Items 1-2: exemples; 3-5: 2×2 simple (30s); 6-9: 3×3 modéré (60s); 10-14: 3×3 complexe (120s)
// ============================================================

export const CUBES_SEED: TimeBonusConfig = {
  type: 'time_bonus',
  name: 'Cubes',
  index: 'IRP' as CompositeIndex,
  notes: 'Construction de patterns avec des cubes rouge/blanc. Discontinuation : 3 échecs consécutifs. Bonus temps sur items 6-14.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    // Exemples (pas de score)
    { id: 'cub_01', label: 'Exemple 1 (2×2 simple)', level: 0, base_score: 0, time_limit_s: 999, bonus_thresholds: [] },
    { id: 'cub_02', label: 'Exemple 2 (2×2 simple)', level: 0, base_score: 0, time_limit_s: 999, bonus_thresholds: [] },
    // 2×2 simple (items 3-5)
    { id: 'cub_03', label: 'Item 3 (2×2 rouge/blanc)', level: 1, base_score: 4, time_limit_s: 30, bonus_thresholds: [] },
    { id: 'cub_04', label: 'Item 4 (2×2 rouge/blanc)', level: 1, base_score: 4, time_limit_s: 30, bonus_thresholds: [] },
    { id: 'cub_05', label: 'Item 5 (2×2 rouge/blanc)', level: 1, base_score: 4, time_limit_s: 30, bonus_thresholds: [] },
    // 3×3 modéré — bonus temps (items 6-9)
    { id: 'cub_06', label: 'Item 6 (3×3 avec diagonales)', level: 2, base_score: 4, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 30, bonus: 3 }, { max_seconds: 45, bonus: 2 }, { max_seconds: 60, bonus: 1 }] },
    { id: 'cub_07', label: 'Item 7 (3×3 avec diagonales)', level: 2, base_score: 4, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 30, bonus: 3 }, { max_seconds: 45, bonus: 2 }, { max_seconds: 60, bonus: 1 }] },
    { id: 'cub_08', label: 'Item 8 (3×3 avec diagonales)', level: 2, base_score: 4, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 30, bonus: 3 }, { max_seconds: 45, bonus: 2 }, { max_seconds: 60, bonus: 1 }] },
    { id: 'cub_09', label: 'Item 9 (3×3 avec diagonales)', level: 2, base_score: 4, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 30, bonus: 3 }, { max_seconds: 45, bonus: 2 }, { max_seconds: 60, bonus: 1 }] },
    // 3×3 complexe — bonus temps (items 10-14)
    { id: 'cub_10', label: 'Item 10 (3×3 complexe)', level: 3, base_score: 4, time_limit_s: 120,
      bonus_thresholds: [{ max_seconds: 60, bonus: 3 }, { max_seconds: 90, bonus: 2 }, { max_seconds: 120, bonus: 1 }] },
    { id: 'cub_11', label: 'Item 11 (3×3 complexe)', level: 3, base_score: 4, time_limit_s: 120,
      bonus_thresholds: [{ max_seconds: 60, bonus: 3 }, { max_seconds: 90, bonus: 2 }, { max_seconds: 120, bonus: 1 }] },
    { id: 'cub_12', label: 'Item 12 (3×3 complexe)', level: 3, base_score: 4, time_limit_s: 120,
      bonus_thresholds: [{ max_seconds: 60, bonus: 3 }, { max_seconds: 90, bonus: 2 }, { max_seconds: 120, bonus: 1 }] },
    { id: 'cub_13', label: 'Item 13 (3×3 complexe)', level: 3, base_score: 4, time_limit_s: 120,
      bonus_thresholds: [{ max_seconds: 60, bonus: 3 }, { max_seconds: 90, bonus: 2 }, { max_seconds: 120, bonus: 1 }] },
    { id: 'cub_14', label: 'Item 14 (3×3 complexe)', level: 3, base_score: 4, time_limit_s: 120,
      bonus_thresholds: [{ max_seconds: 60, bonus: 3 }, { max_seconds: 90, bonus: 2 }, { max_seconds: 120, bonus: 1 }] },
  ],
  discontinuation_rule: { consecutive_fails: 3 },
}

// ============================================================
// MATRICES — 26 items dichotomiques, IRT-based
// ============================================================

export const MATRICES_SEED: DichotomicConfig = {
  type: 'dichotomic',
  name: 'Matrices',
  index: 'IRP' as CompositeIndex,
  notes: 'Raisonnement non-verbal par analogies visuelles. Progression IRT. Pas de discontinuation officielle.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: Array.from({ length: 26 }, (_, i) => ({
    id: `mat_${String(i + 1).padStart(2, '0')}`,
    label: `Item ${i + 1}`,
    level: Math.ceil((i + 1) / 5.2),
    theta: parseFloat((-2.0 + i * 0.16).toFixed(2)),
  })),
  discontinuation_rule: null,
}

// ============================================================
// BALANCES — 27 items dichotomiques, IRT-based
// ============================================================

export const BALANCES_SEED: DichotomicConfig = {
  type: 'dichotomic',
  name: 'Balances',
  index: 'IRP' as CompositeIndex,
  notes: 'Raisonnement quantitatif avec des balances. Progression IRT theta.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: Array.from({ length: 27 }, (_, i) => ({
    id: `bal_${String(i + 1).padStart(2, '0')}`,
    label: `Item ${i + 1}`,
    level: Math.ceil((i + 1) / 5.4),
    theta: parseFloat((-2.0 + i * 0.15).toFixed(2)),
  })),
  discontinuation_rule: null,
}

// ============================================================
// PUZZLES VISUELS — 26 items dichotomiques
// ============================================================

export const PUZZLES_VISUELS_SEED: DichotomicConfig = {
  type: 'dichotomic',
  name: 'Puzzles Visuels',
  index: 'IRP' as CompositeIndex,
  notes: 'Sélection de 3 pièces pour compléter une figure. 4 niveaux de complexité.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: Array.from({ length: 26 }, (_, i) => ({
    id: `puz_${String(i + 1).padStart(2, '0')}`,
    label: `Item ${i + 1}`,
    level: Math.ceil((i + 1) / 6.5),
    theta: parseFloat((-2.0 + i * 0.16).toFixed(2)),
  })),
  discontinuation_rule: null,
}

// ============================================================
// MÉMOIRE IMAGES — 12 items (6 niveaux × 2 essais), discontinuation 2 échecs/niveau
// ============================================================

export const MEMOIRE_IMAGES_SEED: DichotomicConfig = {
  type: 'dichotomic',
  name: 'Mémoire Images',
  index: 'IMT' as CompositeIndex,
  notes: 'Rappel d\'images en séquence. 6 niveaux de complexité (2 essais chacun). Discontinuation : 2 échecs par niveau.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    { id: 'mi_01', label: 'Niveau 1 — Essai 1 (1 image)', level: 1, theta: -2.0 },
    { id: 'mi_02', label: 'Niveau 1 — Essai 2 (1 image)', level: 1, theta: -2.0 },
    { id: 'mi_03', label: 'Niveau 2 — Essai 1 (2 images)', level: 2, theta: -1.2 },
    { id: 'mi_04', label: 'Niveau 2 — Essai 2 (2 images)', level: 2, theta: -1.2 },
    { id: 'mi_05', label: 'Niveau 3 — Essai 1 (3 images)', level: 3, theta: -0.4 },
    { id: 'mi_06', label: 'Niveau 3 — Essai 2 (3 images)', level: 3, theta: -0.4 },
    { id: 'mi_07', label: 'Niveau 4 — Essai 1 (4 images)', level: 4, theta: 0.4 },
    { id: 'mi_08', label: 'Niveau 4 — Essai 2 (4 images)', level: 4, theta: 0.4 },
    { id: 'mi_09', label: 'Niveau 5 — Essai 1 (5 images)', level: 5, theta: 1.2 },
    { id: 'mi_10', label: 'Niveau 5 — Essai 2 (5 images)', level: 5, theta: 1.2 },
    { id: 'mi_11', label: 'Niveau 6 — Essai 1 (6 images)', level: 6, theta: 2.0 },
    { id: 'mi_12', label: 'Niveau 6 — Essai 2 (6 images)', level: 6, theta: 2.0 },
  ],
  discontinuation_rule: { consecutive_fails: 2 },
}

// ============================================================
// EMPAN CHIFFRES — 46 items, 3 parties
// ============================================================

export const EMPAN_CHIFFRES_SEED: DigitSpanConfig = {
  type: 'span',
  name: 'Empan Chiffres',
  index: 'IMT' as CompositeIndex,
  notes: '3 parties : Empan Direct (2-9 chiffres), Empan Inverse (2-8), Séquençage (2-9). Discontinuation : 2 échecs à la même longueur.',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  parts: {
    forward: [
      { length: 2, sequences: [['5','8'],['6','3']], theta: -2.0 },
      { length: 3, sequences: [['5','8','2'],['6','9','4']], theta: -1.5 },
      { length: 4, sequences: [['7','2','8','6'],['4','9','3','1']], theta: -1.0 },
      { length: 5, sequences: [['3','8','2','9','5'],['7','1','4','9','3']], theta: -0.5 },
      { length: 6, sequences: [['5','9','1','7','4','2'],['4','1','7','9','3','8']], theta: 0.0 },
      { length: 7, sequences: [['5','8','2','9','1','6','4'],['3','9','2','4','8','7','1']], theta: 0.5 },
      { length: 8, sequences: [['5','9','1','7','4','2','8','3'],['3','8','2','9','5','1','7','4']], theta: 1.0 },
      { length: 9, sequences: [['2','7','5','8','6','3','1','9','4'],['7','1','3','9','4','2','5','6','8']], theta: 1.5 },
    ],
    backward: [
      { length: 2, sequences: [['2','4'],['5','7']], theta: -1.5 },
      { length: 3, sequences: [['6','2','9'],['4','1','5']], theta: -1.0 },
      { length: 4, sequences: [['3','9','1','6'],['7','4','2','8']], theta: -0.5 },
      { length: 5, sequences: [['1','5','2','8','6'],['6','1','9','4','7']], theta: 0.0 },
      { length: 6, sequences: [['5','3','9','4','1','8'],['7','2','4','8','5','9']], theta: 0.5 },
      { length: 7, sequences: [['8','1','2','9','3','6','5'],['4','7','3','9','1','2','8']], theta: 1.0 },
      { length: 8, sequences: [['9','4','3','7','6','2','5','8'],['7','2','8','1','9','6','5','3']], theta: 1.5 },
    ],
    sequencing: [
      { length: 2, sequences: [['8','3'],['5','1']], theta: -1.5 },
      { length: 3, sequences: [['7','2','9'],['4','8','1']], theta: -1.0 },
      { length: 4, sequences: [['7','2','8','6'],['5','9','1','3']], theta: -0.5 },
      { length: 5, sequences: [['6','1','9','4','7'],['3','8','2','9','5']], theta: 0.0 },
      { length: 6, sequences: [['5','9','1','7','4','2'],['8','3','6','1','9','4']], theta: 0.5 },
      { length: 7, sequences: [['4','7','3','9','1','2','8'],['6','1','8','4','3','9','5']], theta: 1.0 },
      { length: 8, sequences: [['9','4','3','7','6','2','5','8'],['5','8','1','3','9','6','2','7']], theta: 1.5 },
      { length: 9, sequences: [['2','7','5','8','6','3','1','9','4'],['7','1','3','9','4','2','5','6','8']], theta: 2.0 },
    ],
  },
  discontinuation_rule: { fails_per_length: 2 },
}

// ============================================================
// ARITHMÉTIQUE — 22 items avec bonus temps
// ============================================================

export const ARITHMETIQUE_SEED: TimeBonusConfig = {
  type: 'time_bonus',
  name: 'Arithmétique',
  index: 'IMT' as CompositeIndex,
  notes: 'Résolution mentale sous contrainte de temps. Bonus temps sur items 13-22 (difficiles).',
  thresholds: DEFAULT_THRESHOLDS,
  weight: 1.0,
  items: [
    // Facile — pas de bonus (items 1-4)
    { id: 'ari_01', label: 'Si vous avez 3 pommes et que j\'en ajoute 2, combien en avez-vous ?', level: 1, base_score: 1, time_limit_s: 15, bonus_thresholds: [] },
    { id: 'ari_02', label: 'Combien font 8 plus 7 ?', level: 1, base_score: 1, time_limit_s: 15, bonus_thresholds: [] },
    { id: 'ari_03', label: 'Si vous avez 12 euros et que vous dépensez 5 euros, combien vous reste-t-il ?', level: 1, base_score: 1, time_limit_s: 20, bonus_thresholds: [] },
    { id: 'ari_04', label: 'Combien font 20 moins 8 ?', level: 1, base_score: 1, time_limit_s: 15, bonus_thresholds: [] },
    // Moyen — pas de bonus (items 5-12)
    { id: 'ari_05', label: 'Combien coûtent 4 cahiers à 3 euros pièce ?', level: 2, base_score: 1, time_limit_s: 25, bonus_thresholds: [] },
    { id: 'ari_06', label: 'Combien font 6 fois 7 ?', level: 2, base_score: 1, time_limit_s: 20, bonus_thresholds: [] },
    { id: 'ari_07', label: 'Si vous divisez 24 cookies entre 6 enfants, combien chacun en reçoit-il ?', level: 2, base_score: 1, time_limit_s: 25, bonus_thresholds: [] },
    { id: 'ari_08', label: 'Combien font 9 fois 8 ?', level: 2, base_score: 1, time_limit_s: 25, bonus_thresholds: [] },
    { id: 'ari_09', label: 'Une douzaine d\'œufs coûte 6 euros. Combien coûtent 2 douzaines ?', level: 2, base_score: 1, time_limit_s: 30, bonus_thresholds: [] },
    { id: 'ari_10', label: 'Combien font 56 divisé par 8 ?', level: 2, base_score: 1, time_limit_s: 25, bonus_thresholds: [] },
    { id: 'ari_11', label: 'Si un livre coûte 15 euros et que vous en achetez 3, combien payez-vous ?', level: 2, base_score: 1, time_limit_s: 30, bonus_thresholds: [] },
    { id: 'ari_12', label: 'Combien font 12 fois 11 ?', level: 2, base_score: 1, time_limit_s: 30, bonus_thresholds: [] },
    // Difficile — avec bonus temps (items 13-18)
    { id: 'ari_13', label: 'Jean a 24 euros. Il dépense un tiers. Combien lui reste-t-il ?', level: 3, base_score: 1, time_limit_s: 40,
      bonus_thresholds: [{ max_seconds: 25, bonus: 1 }] },
    { id: 'ari_14', label: 'Si 3 stylos coûtent 9 euros, combien coûtent 5 stylos ?', level: 3, base_score: 1, time_limit_s: 40,
      bonus_thresholds: [{ max_seconds: 25, bonus: 1 }] },
    { id: 'ari_15', label: 'Marie achète 4 livres à 12€. Elle paie avec 100€. Combien reçoit-elle en monnaie ?', level: 3, base_score: 1, time_limit_s: 45,
      bonus_thresholds: [{ max_seconds: 30, bonus: 1 }] },
    { id: 'ari_16', label: 'Un train parcourt 120 km en 2 heures. Quelle est sa vitesse moyenne ?', level: 3, base_score: 1, time_limit_s: 40,
      bonus_thresholds: [{ max_seconds: 25, bonus: 1 }] },
    { id: 'ari_17', label: 'Sophie a 48 bonbons. Elle en donne la moitié puis mange un quart du reste. Combien lui en reste-t-il ?', level: 3, base_score: 1, time_limit_s: 50,
      bonus_thresholds: [{ max_seconds: 35, bonus: 1 }] },
    { id: 'ari_18', label: 'Un rectangle mesure 8m × 5m. Quelle est son aire ?', level: 3, base_score: 1, time_limit_s: 35,
      bonus_thresholds: [{ max_seconds: 20, bonus: 1 }] },
    // Très difficile — avec bonus temps (items 19-22)
    { id: 'ari_19', label: 'Quel est 10% de 50 ?', level: 4, base_score: 1, time_limit_s: 45,
      bonus_thresholds: [{ max_seconds: 30, bonus: 1 }] },
    { id: 'ari_20', label: 'Quel est 25% de 80 ?', level: 4, base_score: 1, time_limit_s: 50,
      bonus_thresholds: [{ max_seconds: 35, bonus: 1 }] },
    { id: 'ari_21', label: 'Un article coûte 60€. Son prix augmente de 20%. Quel est son nouveau prix ?', level: 4, base_score: 1, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 40, bonus: 1 }] },
    { id: 'ari_22', label: '5 ouvriers construisent un mur en 12 jours. Combien de jours pour 3 ouvriers ?', level: 4, base_score: 1, time_limit_s: 60,
      bonus_thresholds: [{ max_seconds: 45, bonus: 1 }] },
  ],
  discontinuation_rule: { consecutive_fails: 3 },
}

// ============================================================
// CODE — 135 cases, 120 secondes
// ============================================================

export const CODE_SEED: SpeedConfig = {
  type: 'speed',
  name: 'Code',
  index: 'IVT' as CompositeIndex,
  notes: 'Correspondance chiffre→symbole. 1 point par case correctement remplie. Max 135 points en 120 secondes.',
  thresholds: {
    very_low:  [0, 25]  as [number, number],
    low:       [26, 45] as [number, number],
    average:   [46, 65] as [number, number],
    high:      [66, 85] as [number, number],
    very_high: [86, 135] as [number, number],
  },
  weight: 1.0,
  time_limit_s: 120,
  total_items: 135,
  training_items: 7,
}

// ============================================================
// RECHERCHE SYMBOLES — 60 items OUI/NON, 120 secondes
// ============================================================

export const RECHERCHE_SYMBOLES_SEED: SpeedConfig = {
  type: 'speed',
  name: 'Recherche Symboles',
  index: 'IVT' as CompositeIndex,
  notes: 'Déterminer si un symbole cible est présent dans un groupe de symboles. 60 items en 120 secondes.',
  thresholds: {
    very_low:  [0, 10]  as [number, number],
    low:       [11, 20] as [number, number],
    average:   [21, 30] as [number, number],
    high:      [31, 40] as [number, number],
    very_high: [41, 60] as [number, number],
  },
  weight: 1.0,
  time_limit_s: 120,
  total_items: 60,
  training_items: 6,
}

// ============================================================
// MAP: test_id → seed config
// ============================================================

export const TEST_SEEDS: Record<string, WaisTestConfig> = {
  similitudes:        SIMILITUDES_SEED,
  vocabulaire:        VOCABULAIRE_SEED,
  information:        INFORMATION_SEED,
  cubes:              CUBES_SEED,
  matrices:           MATRICES_SEED,
  balances:           BALANCES_SEED,
  puzzles_visuels:    PUZZLES_VISUELS_SEED,
  empan_chiffres:     EMPAN_CHIFFRES_SEED,
  arithmetique:       ARITHMETIQUE_SEED,
  memoire_images:     MEMOIRE_IMAGES_SEED,
  code:               CODE_SEED,
  recherche_symboles: RECHERCHE_SYMBOLES_SEED,
}
