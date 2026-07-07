/**
 * Psychotechnic recruitment test — "Programme Jeune Talent 2026".
 * 32 questions across 3 blocks. Block 3 is domain-specific.
 * Shared by the client (rendering + reveal) and the API (authoritative scoring).
 */

export type Domain = "ops" | "com" | "cyber" | "dev";

export interface TQ {
  s: string; // section label
  t: string; // question text
  o: string[]; // options
  c: number; // correct index
  e: string; // explanation
  sec: number; // seconds allowed
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  ops: "Opérations",
  com: "Communication",
  cyber: "IT — Cybersécurité",
  dev: "IT — Développement",
};

export const DOMAIN_OPTIONS: { id: Domain; label: string; sub: string }[] = [
  { id: "ops", label: "Opérations", sub: "Customer Support Officer" },
  { id: "com", label: "Communication & Marketing", sub: "Graphiste · CRM · Social Media" },
  { id: "cyber", label: "Technologie — Cybersécurité", sub: "Analyste Cybersécurité" },
  { id: "dev", label: "Technologie — Développement", sub: "Architecture Logiciel · Développeur" },
];

export const BLOCK_LABELS = [
  "Bloc 1 — Raisonnement logique",
  "Bloc 2 — Personnalité & comportement",
  "Bloc 3 — Aptitudes métier",
];

const B1: TQ[] = [
  { s: "Raisonnement logique", t: "Une suite : chaque terme = somme des deux précédents moins 1. Premiers termes : 3 et 5. Quel est le 5e terme ?", o: ["19", "20", "21", "22"], c: 2, e: "T3=7, T4=11, T5=17. Piège : oublier le -1 à chaque étape.", sec: 30 },
  { s: "Raisonnement logique", t: "Si tous les managers sont des leaders, et que certains leaders sont des créatifs, alors :", o: ["Tous les managers sont créatifs", "Certains managers peuvent être créatifs", "Aucun manager n'est créatif", "Tous les créatifs sont managers"], c: 1, e: "Syllogisme partiel : managers ⊂ leaders, certains leaders ∩ créatifs → certains managers peuvent être créatifs.", sec: 30 },
  { s: "Raisonnement logique", t: "Un robinet remplit un réservoir en 6h. Une fuite le vide en 9h. En combien de temps le réservoir sera-t-il plein ?", o: ["15h", "18h", "12h", "24h"], c: 1, e: "Débit net = 1/6 - 1/9 = 1/18 par heure → 18h. Piège : additionner 6+9=15.", sec: 30 },
  { s: "Raisonnement logique", t: "Dans une salle : 60% français, 40% anglais, 25% les deux. Quel % ne parle aucune des deux ?", o: ["0%", "25%", "15%", "5%"], c: 1, e: "P(F∪A) = 75%. Donc 100-75 = 25% ne parlent aucune des deux.", sec: 30 },
  { s: "Raisonnement logique", t: "Un homme regarde un portrait : 'Je n'ai ni frère ni sœur, mais le père de cet homme est le fils de mon père.' De qui est le portrait ?", o: ["Son oncle", "Son cousin", "Son fils", "Lui-même"], c: 2, e: "Le père du portrait est lui-même → il regarde le portrait de son fils.", sec: 30 },
  { s: "Raisonnement logique", t: "Prix augmenté de 20% puis réduit de 20%. Prix final par rapport au prix initial ?", o: ["Identique", "4% de moins", "4% de plus", "20% de moins"], c: 1, e: "1,20 × 0,80 = 0,96. Piège : +20% puis -20% ne s'annulent pas.", sec: 30 },
  { s: "Raisonnement logique", t: "Suite : 2, 6, 12, 20, 30, ?", o: ["40", "42", "44", "48"], c: 1, e: "Écarts : +4,+6,+8,+10,+12 → 42. Les écarts augmentent de 2.", sec: 30 },
  { s: "Raisonnement logique", t: "Koffi > Ama. Ama < Brice. Brice < Koffi. Qui est le plus petit ?", o: ["Koffi", "Ama", "Brice", "Impossible à déterminer"], c: 1, e: "Koffi > Brice > Ama. Ama est la plus petite.", sec: 30 },
  { s: "Raisonnement logique", t: "100 candidats : 70 réussi l'écrit, 60 l'oral, 20 ont échoué aux deux. Combien ont réussi les deux ?", o: ["30", "40", "50", "60"], c: 2, e: "Réussi au moins une = 80. 80=70+60-x → x=50.", sec: 30 },
  { s: "Raisonnement logique", t: "Code : chaque lettre remplacée par celle +2 dans l'alphabet (Z→B, Y→A). Code de 'IZICHANGE' ?", o: ["KBKEJCPIG", "KBKEJCPIG", "KBKEJCPIG", "LCLEKDQJH"], c: 0, e: "I→K,Z→B,I→K,C→E,H→J,A→C,N→P,G→I,E→G = KBKEJCPIG. A/B/C identiques pour tester la concentration.", sec: 30 },
];

const B2: TQ[] = [
  { s: "Autonomie & décision", t: "Manager absent, décision urgente sur votre projet. Vous :", o: ["Attendez son retour.", "Prenez la décision raisonnée, documentez et informez à son retour.", "Consultez tous vos collègues pour un consensus.", "Repoussez la décision en invoquant l'absence."], c: 1, e: "Agit dans son périmètre, raisonne sous pression, rend compte. A=manque d'initiative · C=perte de temps · D=évitement.", sec: 40 },
  { s: "Autonomie & décision", t: "Tâche d'un collègue ne sera pas finie à temps, deadline client en danger. Vous :", o: ["Informez le manager et attendez.", "Reprenez la tâche sans en parler.", "Discutez avec le collègue, proposez un coup de main, alertez si nécessaire.", "Informez le client directement."], c: 2, e: "Collaboration + communication ascendante + responsabilité partagée. A=passivité · B=micro-management · D=escalade prématurée.", sec: 40 },
  { s: "Rigueur & erreur", t: "Rapport soumis, erreur significative déjà lue par plusieurs personnes. Vous :", o: ["Corrigez en silence.", "Attendez que quelqu'un signale.", "Informez immédiatement, fournissez la version corrigée et expliquez l'origine.", "Signalez uniquement au manager."], c: 2, e: "Transparence proactive = valeur centrale en fintech. C allie responsabilité et résolution active.", sec: 40 },
  { s: "Rigueur & erreur", t: "Trois tâches urgentes simultanées. Que faites-vous en premier ?", o: ["La plus courte d'abord.", "Demandez au manager de choisir.", "Évaluez l'impact business, priorisez et communiquez vos arbitrages.", "Travaillez sur les trois en parallèle."], c: 2, e: "Priorisation par impact business = profil senior. A=court terme · B=abdication · D=dispersion.", sec: 40 },
  { s: "Équipe & communication", t: "En réunion, la solution du manager vous semble sous-optimale. Vous :", o: ["Ne dites rien.", "Exprimez calmement une alternative avec des arguments factuels.", "Attendez la fin pour en parler en privé.", "En parlez aux collègues après."], c: 1, e: "Courage + argumentation factuelle dans le bon cadre. A=conformisme · C=trop prudent · D=contre-productif.", sec: 40 },
  { s: "Équipe & communication", t: "Collègue au style différent, frictions. Votre approche :", o: ["Signalez au manager.", "Adaptez entièrement votre style.", "Proposez un échange structuré pour construire une façon de travailler ensemble.", "Minimisez les interactions."], c: 2, e: "Résolution directe et collaborative. C=maturité · A=escalade · B=perte d'identité · D=évitement.", sec: 40 },
  { s: "Stress & adaptabilité", t: "À J-2, les spécifications changent significativement. Votre première réaction :", o: ["Exprimez votre frustration.", "Réévaluez l'impact et proposez un plan révisé.", "Acceptez sans commenter.", "Demandez un report."], c: 1, e: "Analytique puis proactif. B=résilience structurée · A=émotionnel · C=passivité · D=défensif.", sec: 40 },
  { s: "Stress & adaptabilité", t: "Plusieurs collègues vous sollicitent pendant une tâche complexe. Vous :", o: ["Mettez en pause et gérez dans l'ordre.", "Ignorez jusqu'à la fin.", "Évaluez l'urgence, traitez l'urgente, fixez un délai pour les autres.", "Demandez à tous d'écrire leurs demandes."], c: 2, e: "Priorisation rapide + communication claire. C=intelligence situationnelle · A=dispersion · B=isolement.", sec: 40 },
  { s: "Résultats & initiative", t: "Mission avec objectif clair mais sans méthode imposée. Votre approche naturelle :", o: ["Demandez au manager comment il procéderait.", "Reproduisez ce que vous avez vu faire.", "Proposez votre méthode, validez rapidement, exécutez en ajustant.", "Cherchez la meilleure pratique sur internet."], c: 2, e: "Autonomie + validation rapide + itération. C=efficience · A=dépendance · B=copie · D=perte de temps.", sec: 40 },
  { s: "Résultats & initiative", t: "Fin de journée, tout accompli. Il vous reste 30 min. Vous :", o: ["Partez à l'heure.", "Prenez de l'avance sur la tâche de demain la plus critique.", "Naviguez sur internet.", "Cherchez ce que vous auriez pu faire mieux."], c: 1, e: "Haute performance = anticipe. B=valeur ajoutée naturelle. D=réflexivité, bon second choix.", sec: 40 },
  { s: "Éthique & intégrité", t: "Un collègue contourne une procédure interne sans conséquence visible. Vous :", o: ["N'intervenez pas.", "En parlez à d'autres collègues.", "Signalez au manager/RH de façon factuelle.", "En parlez directement au collègue pour comprendre et l'encourager."], c: 3, e: "D=préserve la relation et donne une chance de correction. C acceptable si D échoue. A,B=évitement.", sec: 40 },
  { s: "Éthique & intégrité", t: "En entretien, on vous demande vos points faibles. Vous :", o: ["'Je suis perfectionniste et j'ai du mal à déléguer.'", "Citez un vrai point de développement avec exemple concret de progrès.", "Dites n'avoir pas de faiblesse majeure.", "Reformulez en domaine à approfondir."], c: 1, e: "B=authenticité + conscience de soi + posture de développement. A,C,D=réponses formatées détectées.", sec: 40 },
];

const B3OPS: TQ[] = [
  { s: "Aptitudes Opérations", t: "Client : 50 000 FCFA envoyés mais non reçus. Votre première action :", o: ["Demander de patienter 24h.", "Demander le N° de transaction et consulter le statut en temps réel.", "Expliquer que ça vient peut-être du destinataire.", "Escalader au service technique."], c: 1, e: "Toujours collecter l'info précise puis vérifier. A=vague · C=préjugé · D=escalade sans diagnostic.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Client étranger en anglais, votre niveau est limité. Vous :", o: ["Répondez en français.", "Utilisez un outil de traduction et répondez simplement en anglais.", "Transférez à un collègue anglophone.", "Demandez d'écrire en français."], c: 1, e: "Effort dans la langue du client = professionnalisme. C acceptable avec explication.", sec: 40 },
  { s: "Aptitudes Opérations", t: "15 tickets, nouveau ticket marqué URGENT par le client. Vous :", o: ["Le traitez immédiatement.", "Évaluez le contenu réel avant de prioriser.", "L'ajoutez en fin de file.", "L'escaladez au manager."], c: 1, e: "Urgence déclarée ≠ urgence réelle. Évaluer avant de prioriser.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Problème résolu, mais 3 incidents similaires en 2 mois dans l'historique. Vous :", o: ["Clôturez le ticket.", "Signalez l'anomalie au manager avec résumé des 3 incidents.", "Demandez au client pourquoi.", "Proposez de changer de service."], c: 1, e: "Détecter les patterns et les remonter = valeur ajoutée. A=vision courte.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Client menace de saisir l'APDP suite à une vérification d'identité. Vous :", o: ["Abandonnez la procédure.", "Expliquez calmement l'obligation légale, citez le cadre et confirmez ses droits.", "Transférez au juridique.", "Demandez une plainte écrite."], c: 1, e: "Connaissance du cadre = assurance sans capitulation. A=manque de rigueur.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Client demande pourquoi sa transaction est bloquée. Vous ne savez pas. Vous :", o: ["Inventez une explication plausible.", "Dites honnêtement que vous vérifiez et rappellerez dans un délai précis.", "Dites que le système est automatique.", "Suggérez de réessayer plus tard."], c: 1, e: "Transparence + engagement de rappel avec délai précis. A=mensonge.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Changement tarifaire public dans 3 jours. Un client vous interroge. Vous :", o: ["Donnez l'information.", "Confirmez qu'il n'y a aucun changement.", "Indiquez ne pas pouvoir commenter des infos non officielles et invitez à suivre les communications officielles.", "Refusez sans explication."], c: 2, e: "Infos internes non publiées = confidentielles. A=faute · B=mensonge · D=impolitesse.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Panne du système 20 min, clients impatients. Vous :", o: ["Attendez silencieusement.", "Informez proactivement, estimez un délai, proposez une alternative.", "Demandez aux clients de rappeler plus tard.", "Escaladez et attendez les instructions."], c: 1, e: "Communication proactive = service client mature. A,D=passivité.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Process interne inefficace crée de la friction. Vous :", o: ["Continuez — ce n'est pas votre rôle.", "En parlez à un collègue.", "Documentez avec exemples et proposez au manager.", "Adaptez le process à votre façon."], c: 2, e: "Amélioration continue = remontée structurée. A=conformisme inerte · D=non-conformité.", sec: 40 },
  { s: "Aptitudes Opérations", t: "Collègue demande à prendre un ticket. Vous êtes à votre limite. Vous :", o: ["Acceptez sans condition.", "Refusez poliment.", "Évaluez votre capacité, exprimez ce que vous pouvez faire et alertez si la charge dépasse les ressources.", "Acceptez mais réduisez la qualité."], c: 2, e: "Évaluation honnête + transparence + remontée systémique. A=surengagement · D=sacrifice qualité.", sec: 40 },
];

const B3COM: TQ[] = [
  { s: "Aptitudes Communication", t: "Post Instagram pour recruter des 18-35 ans. Quelle accroche est la plus efficace ?", o: ["'IZICHANGE — la plateforme de paiement fiable et sécurisée.'", "'Vos virements. Votre rythme. 24h/24 sans frais cachés. Téléchargez maintenant.'", "'Fiers d'annoncer que IZICHANGE est disponible sur toutes les plateformes.'", "'Pour en savoir plus, visitez notre site.'"], c: 1, e: "B=bénéfice direct + CTA clair. A=froid · C=institutionnel · D=sans bénéfice.", sec: 40 },
  { s: "Aptitudes Communication", t: "Taux d'ouverture email : 18% vs 25% sectoriel. Première hypothèse à tester :", o: ["Contenu mauvais.", "L'objet n'est pas assez percutant.", "Liste trop grande.", "Heure d'envoi inadaptée."], c: 1, e: "L'objet est la première chose vue. Mauvais objet = faible taux avant même lecture.", sec: 40 },
  { s: "Aptitudes Communication", t: "Commentaire négatif public Facebook, transaction non reçue. Vous :", o: ["Supprimez le commentaire.", "Répondez publiquement, reconnaissez la frustration, invitez en privé avec le N° de transaction.", "Répondez avec tous les détails techniques.", "Ignorez."], c: 1, e: "Reconnaissance publique + invitation au privé = best practice. A=désastreux · C=violation confidentialité.", sec: 40 },
  { s: "Aptitudes Communication", t: "CRM 5 000 contacts. Campagne réactivation inactifs 6 mois. Quel filtre en priorité ?", o: ["Contacts avec email valide.", "Contacts : dernière transaction > 6 mois ET ayant une transaction historique.", "Contacts ayant ouvert un email dans les 6 derniers mois.", "Contacts avec profil complet."], c: 1, e: "Réactivation = clients actifs mais dormants. B combine les deux critères.", sec: 40 },
  { s: "Aptitudes Communication", t: "Campagne notoriété LinkedIn. Quel indicateur est le plus pertinent ?", o: ["Nombre de clics.", "Taux de conversion en abonnés payants.", "Portée organique et taux d'engagement.", "Coût par acquisition."], c: 2, e: "Notoriété = portée + engagement. A,B=conversion · D=paid.", sec: 40 },
  { s: "Aptitudes Communication", t: "Visuel pour une promotion sur les réseaux sociaux. Quelle approche ?", o: ["Très chargé avec tous les détails.", "Épuré : un message fort, un chiffre clé, un CTA visible.", "Photo de stock avec logo.", "Format PDF."], c: 1, e: "Un visuel = un message = un CTA. B=principe fondamental. A=surcharge · D=inadapté.", sec: 40 },
  { s: "Aptitudes Communication", t: "Posts jeudi 18h-20h : +40% d'engagement. Que faites-vous ?", o: ["Publiez tout le jeudi 18h-20h.", "Concentrez les posts à fort enjeu, testez d'autres créneaux et ajustez selon les données.", "Ignorez — le contenu prime.", "Attendez la validation manager."], c: 1, e: "Data-driven = tester, confirmer, optimiser. B=démarche scientifique · A=rigide.", sec: 40 },
  { s: "Aptitudes Communication", t: "Email de prospection B2B pour des PME. Quelle structure ?", o: ["Présentation complète, fonctionnalités, tarifs.", "Accroche sur un problème PME, solution, bénéfice clé, CTA simple.", "Email long pour montrer la crédibilité.", "Logo et lien uniquement."], c: 1, e: "Problème → solution → bénéfice → CTA. Court, ciblé, orienté client.", sec: 40 },
  { s: "Aptitudes Communication", t: "Collaborateur publie des infos confidentielles sur son profil. Vous :", o: ["Commentez publiquement.", "Contactez immédiatement en privé et signalez selon la gravité.", "Signalez à la plateforme.", "Attendez de voir."], c: 1, e: "Discrète + rapide + escalade selon gravité. B=proportionné.", sec: 40 },
  { s: "Aptitudes Communication", t: "Taux de conversion landing pages : 1,2% vs 3,5%. Hypothèse prioritaire :", o: ["Budget insuffisant.", "La landing page — proposition de valeur, CTA, temps de chargement.", "Qualité des visuels publicitaires.", "Choix des plateformes."], c: 1, e: "Faible conversion post-clic → landing page. A,C=trafic entrant.", sec: 40 },
];

const B3CY: TQ[] = [
  { s: "IT — Commun", t: "Collègue demande vos identifiants pour une action urgente. Vous :", o: ["Partagez — collègue de confiance.", "Refusez et proposez un accès temporaire via le manager ou l'admin.", "Partagez mais demandez de ne pas mémoriser.", "Créez un compte temporaire."], c: 1, e: "Partage d'identifiants = violation fondamentale. B=seule réponse conforme.", sec: 40 },
  { s: "IT — Commun", t: "Faille de sécurité mineure, sans impact actuel. Vous :", o: ["Attendez la réunion technique.", "La corrigez vous-même.", "La documentez, signalez immédiatement et suivez le process.", "Gardez l'information."], c: 2, e: "Toute faille doit être documentée et remontée via le process formel. C=bonne pratique DevSecOps.", sec: 40 },
  { s: "IT — Commun", t: "Estimation demandée sans analyse des specs. Vous :", o: ["Estimation rapide.", "Refusez d'estimer.", "Fourchette large en précisant que vous affinerez après analyse.", "Déléguez."], c: 2, e: "Honnêteté + engagement d'affinage. A=précision sans base · B=rigidité.", sec: 40 },
  { s: "IT — Commun", t: "Bug bloquant en staging à J-1. Votre première action :", o: ["Déployez et corrigez après.", "Alertez immédiatement, documentez et évaluez si un hotfix est faisable.", "Travaillez toute la nuit sans en parler.", "Informez le client sans consulter l'équipe."], c: 1, e: "Alert immédiate + diagnostic + décision collective.", sec: 40 },
  { s: "IT — Commun", t: "Solution rapide (dette technique) vs propre (2x plus longue) pour une démo dans 5 jours. Vous :", o: ["Solution rapide.", "Solution propre.", "Solution rapide en documentant la dette avec plan de remédiation.", "Demandez au client de reporter."], c: 2, e: "Pragmatisme mature : livrer + tracer + planifier.", sec: 40 },
  { s: "IT — Cybersécurité", t: "Logs : tentatives SSH échouées répétées depuis une même IP étrangère. Votre diagnostic :", o: ["Bug dans le logging.", "Scan réseau sans intention malveillante.", "Attaque par force brute — bloquez l'IP, renforcez la politique SSH et alertez.", "Accès légitime mal configuré."], c: 2, e: "Tentatives répétées SSH depuis IP externe = signature brute force. C=réponse correcte.", sec: 40 },
  { s: "IT — Cybersécurité", t: "Email de 'support@izichange-secure.com' demandant le mot de passe de l'utilisateur. Votre analyse :", o: ["Probablement légitime.", "Phishing — domaine différent du domaine officiel, aucune entreprise légitime ne demande un mot de passe par email.", "Vérifier si l'utilisateur a un problème de compte.", "Faux positif antispam."], c: 1, e: "Deux signaux : domaine suspect (typosquatting) + demande de mot de passe par email.", sec: 40 },
  { s: "IT — Cybersécurité", t: "Pentest sur le système d'un partenaire. Votre première étape :", o: ["Commencez le scan immédiatement.", "Exigez une autorisation écrite signée.", "Demandez les credentials admin.", "Demandez quelles vulnérabilités il soupçonne."], c: 1, e: "Pentest sans autorisation écrite = illégal. B est non-négociable.", sec: 40 },
  { s: "IT — Cybersécurité", t: "SQL ou NoSQL pour les transactions financières IZICHANGE ?", o: ["NoSQL — plus performant.", "SQL — garanties ACID pour l'intégrité financière.", "Les deux.", "NoSQL — plus flexible."], c: 1, e: "Données financières = ACID obligatoire. SQL par défaut.", sec: 40 },
  { s: "IT — Cybersécurité", t: "Code passe les tests unitaires mais échoue en intégration. Cause la plus probable :", o: ["Bug dans le framework de tests.", "Problème dans les interactions entre composants — interface, contrat API, configuration.", "Tests unitaires inadaptés.", "Problème de performance."], c: 1, e: "Tests unitaires = composants isolés. Intégration échoue = interactions entre composants.", sec: 40 },
];

const B3DEV: TQ[] = [
  { s: "IT — Commun", t: "Collègue demande vos identifiants pour une action urgente. Vous :", o: ["Partagez.", "Refusez et proposez un accès temporaire via le manager ou l'admin.", "Partagez mais sans mémoriser.", "Créez un compte temporaire."], c: 1, e: "Partage d'identifiants = violation fondamentale.", sec: 40 },
  { s: "IT — Commun", t: "Faille de sécurité mineure, sans impact actuel. Vous :", o: ["Attendez la réunion.", "La corrigez vous-même.", "La documentez, signalez immédiatement et suivez le process.", "Gardez l'information."], c: 2, e: "Toute faille doit être documentée et remontée.", sec: 40 },
  { s: "IT — Commun", t: "Estimation sans analyse des specs. Vous :", o: ["Estimation rapide.", "Refusez.", "Fourchette large, affinerez après analyse.", "Déléguez."], c: 2, e: "Honnêteté + engagement d'affinage.", sec: 40 },
  { s: "IT — Commun", t: "Bug bloquant en staging à J-1. Votre première action :", o: ["Déployez et corrigez après.", "Alertez immédiatement, documentez, évaluez si hotfix faisable.", "Travaillez toute la nuit sans en parler.", "Informez le client sans consulter l'équipe."], c: 1, e: "Alert immédiate + diagnostic + décision collective.", sec: 40 },
  { s: "IT — Commun", t: "Solution rapide (dette) vs propre (2x plus longue) pour une démo dans 5 jours. Vous :", o: ["Solution rapide.", "Solution propre.", "Solution rapide + documentation de la dette avec plan de remédiation.", "Reporter la démo."], c: 2, e: "Pragmatisme : livrer + tracer + planifier.", sec: 40 },
  { s: "IT — Développeur", t: "SQL ou NoSQL pour les transactions financières IZICHANGE ?", o: ["NoSQL — plus performant.", "SQL — garanties ACID pour l'intégrité financière.", "Les deux.", "NoSQL — plus flexible."], c: 1, e: "Données financières = ACID. SQL par défaut.", sec: 40 },
  { s: "IT — Développeur", t: "Code passe les tests unitaires mais échoue en intégration. Cause la plus probable :", o: ["Bug dans le framework.", "Problème dans les interactions entre composants — interface, contrat API, configuration.", "Tests inadaptés.", "Performance."], c: 1, e: "Tests unitaires = isolés. Intégration = interactions.", sec: 40 },
  { s: "IT — Développeur", t: "Ajouter une fonctionnalité dans un code legacy non documenté. Vous :", o: ["Ajoutez directement.", "Refusez sans documentation.", "Ajoutez des tests minimaux sur le code touché, documentez et signalez la dette.", "Demandez à un autre développeur."], c: 2, e: "Scout rule : laisser le code mieux. Tests minimaux + documentation = professionnalisme.", sec: 40 },
  { s: "IT — Développeur", t: "PR avec code fonctionnel mais peu lisible, sans commentaires. Votre code review :", o: ["Approuvez — ça fonctionne.", "Refusez catégoriquement.", "Approuvez conditionnellement avec demande d'améliorations avant merge.", "Corrigez vous-même et mergez."], c: 2, e: "Code review = qualité ET transmission. C=feedback constructif.", sec: 40 },
  { s: "IT — Développeur", t: "Faille de sécurité dans un module utilisé par toute l'application. Votre démarche :", o: ["Corrigez discrètement.", "Documentez, alertez immédiatement le responsable sécurité et le lead tech, proposez un patch.", "Attendez une réunion planifiée.", "Créez une issue et attendez."], c: 1, e: "Faille critique = escalade immédiate + patch + process formel.", sec: 40 },
];

const B3: Record<Domain, TQ[]> = { ops: B3OPS, com: B3COM, cyber: B3CY, dev: B3DEV };

export function buildTest(domain: Domain): TQ[] {
  return [...B1, ...B2, ...B3[domain]];
}

export function statusFor(total: number, max: number): string {
  const pct = Math.round((total / max) * 100);
  return pct >= 70 ? "Admis" : pct >= 60 ? "Réserve" : "Non retenu";
}

export interface TestScore {
  block1: number;
  block2: number;
  block3: number;
  total: number;
  max: number;
  status: string;
  pct: number;
}

/** Authoritative scoring from submitted answer indices. */
export function scoreTest(domain: Domain, answers: (number | null)[]): TestScore {
  const qs = buildTest(domain);
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  for (let i = 0; i < 10; i++) if (answers[i] === qs[i].c) b1++;
  for (let i = 10; i < 22; i++) if (answers[i] === qs[i].c) b2++;
  for (let i = 22; i < qs.length; i++) if (answers[i] === qs[i].c) b3++;
  const total = b1 + b2 + b3;
  const max = qs.length;
  return { block1: b1, block2: b2, block3: b3, total, max, status: statusFor(total, max), pct: Math.round((total / max) * 100) };
}

export function isDomain(v: unknown): v is Domain {
  return v === "ops" || v === "com" || v === "cyber" || v === "dev";
}
