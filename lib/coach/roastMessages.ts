const badHabitRoasts = [
  "Encore un craquage ? Tu tiens la constance dans le mauvais sens.",
  "Tu gères tes pulsions comme un incendie : tu souffles dessus.",
  "On devrait comptabiliser tes craquages sur ton CV.",
  "Tu dis stop, ton corps entend encore.",
  "Tu es plus accro à tes excuses qu'à l'habitude.",
  "Chaque craquage est une masterclass d'auto-sabotage.",
  "Tu fais des tours de piste autour de tes mauvaises décisions.",
  "La volonté arrive, mais toi tu pars déjà.",
  "Tu maîtrises l'art de retomber plus vite que tu te relèves.",
  "Si l'abandon était un sport, tu serais médaillé.",
  "Tu cherches la discipline mais tu demandes l'addition.",
  "Ton auto-contrôle a pris des vacances sans retour.",
  "Tu réponds toujours présent à tes pires envies.",
  "Tu traites tes objectifs comme des notifications : ignorer.",
  "Chaque craquage est une lettre d'amour à ton chaos.",
  "Tu as une routine : craquer, regretter, recommencer.",
  "Tu veux progresser mais tu sponsorises la régression.",
  "Ton cerveau sait dire non, mais tu préfères la version beta.",
  "Tu confonds soulagement immédiat et sabotage programmé.",
  "Même tes mauvaises habitudes ont besoin de repos, laisse-les souffler.",
  "Tu prends des notes pour refaire exactement les mêmes erreurs.",
  "Ton autopilote est réglé sur « crash ».",
  "Toujours prêt à craquer, jamais prêt à changer.",
  "Trop de craquages, pas assez de remords utiles.",
  "Tu défies la gravité : chaque chute est plus rapide.",
  "Tu pourrais faire un TED Talk sur comment ne pas résister.",
  "Tu transformes les drapeaux rouges en décoration murale.",
  "Ton excuse préférée ? « J'en avais besoin ». Non.",
  "Tu joues au pyromane avec ton self-control.",
  "Ta détermination a le sommeil profond.",
] as const

const goodHabitRoasts = [
  "Tu progresses, lentement. Très lentement. Mais ça bouge.",
  "Une victoire ? Super. On en reparle quand tu recommences demain.",
  "Tu l'as fait aujourd'hui. Reste juste demain, et tous les autres jours.",
  "Tu valides l'habitude, pas encore la légende.",
  "Tu avances, mais tu gardes le frein à main serré.",
  "Cette victoire compte, même si personne n'était là pour applaudir.",
  "Continue, ça commence presque à sembler sérieux.",
  "Pas mal. Pour un humain distrait.",
  "Tu viens de prouver que tu sais faire mieux que procrastiner.",
  "C'est validé, mais ne recycle pas cette gloire pendant une semaine.",
  "Bravo, tu as réussi… le minimum syndical.",
  "Habitude cochée. Tu peux arrêter de jouer la victime aujourd'hui.",
  "Tu vois ? Quand tu fais, ça marche. Incroyable.",
  "Tu as bougé ? J'appelle la presse.",
  "Une case cochée, un ego gonflé. Garde le rythme.",
  "Tu deviens presque fiable. Presque.",
  "Bien joué, mais calme-toi, ce n’est pas encore une statue.",
  "Tu viens de gagner un ticket pour recommencer demain.",
  "C'est mieux que rien. Et rien, c'est ton habitude préférée.",
  "Habitude validée, excuses invalidées.",
] as const

const coachMilitaryRoasts = [
  "Debout soldat. Tes objectifs n'attendent pas.",
  "Respire, charge, exécute. Pas de débat.",
  "La fatigue est un mensonge confortable. Bouge.",
  "Tu veux du résultat ? Paye en sueur.",
  "Arrête le bavardage interne et attaque la mission.",
  "Ton confort n'a jamais gagné de bataille.",
  "Discipline avant dopamine.",
  "On avance, pas d'option retour.",
  "Fais le travail ou accepte d'échouer publiquement.",
  "Lève-toi, personne ne viendra sauver ta motivation.",
  "Transforme tes plaintes en répétitions.",
  "Tu dis que c'est dur ? Bon signe, continue.",
  "Zéro excuses. Tu livres ou tu recommences.",
  "Tu parles trop, agis plus.",
  "Chaque minute d'hésitation nourrit ton ennemi.",
  "Ce n'est pas négociable : tu exécutes.",
  "Le doute est viré. La discipline prend le poste.",
  "Sueur aujourd'hui, liberté demain.",
  "La flemme est une mutinerie. Rétablis l'ordre.",
  "Cible verrouillée, passe à l'impact.",
] as const

const autoDerisionRoasts = [
  "Tu procrastines tellement que même ta flemme a honte.",
  "Ton futur toi t'écrit pour dire qu'il est fatigué de rattraper tes bêtises.",
  "Tu gères ton potentiel comme un abonnement oublié.",
  "Ton talent principal ? L'auto-sabotage créatif.",
  "Tu veux des résultats mais tu commandes toujours du « plus tard ».",
  "Tu crois que réfléchir à agir, c'est agir. Spoiler : non.",
  "Ton agenda est vide mais tu dis que tu n'as pas le temps.",
  "Tu confonds repos mérité et fuite organisée.",
  "Ton cerveau a de bonnes idées, toi tu préfères Netflix.",
  "Tu as une to-do list pour la poussière.",
  "Tu collectionnes les débuts comme des timbres.",
  "Tu es en retard sur des projets qui n'ont même pas commencé.",
  "Tu veux changer mais tu remplis ta journée de scroll.",
  "Tu rêves grand, tu agis petit, tu te plains fort.",
  "Ton énergie arrive quand tout est fini.",
  "Tu fais des plans complexes pour éviter une action simple.",
  "Tu cherches des hacks au lieu de démarrer.",
  "Tu demandes des conseils juste pour ne pas les appliquer.",
  "Ton besoin de contrôle masque surtout ton inaction.",
  "Tu te fatigues rien qu'en y pensant.",
  "Tu es si lent que la tortue t'a bloqué sur Insta.",
  "Tu vis dans ta tête, sans payer le loyer.",
  "Tu repousses tellement que tu dois un remboursement au temps.",
  "Tu joues au stratège mais tu oublies d'exécuter.",
  "Ton ambition mérite un propriétaire plus sérieux.",
] as const

const routineRoasts = [
  "Nouvelle journée. Essaie de ne pas la rater.",
  "Matin gris, excuses faciles. Résiste.",
  "Midi arrive. Tu as fait autre chose que scroller ?",
  "Après-midi : parfait moment pour refaire les mêmes erreurs ou pas.",
  "Soirée : fais le bilan avant que le regret le fasse.",
  "Nuit en approche. Range tes regrets avec tes écrans.",
  "Lever difficile ? Normal, tu portes tes habitudes.",
  "Respire. Planifie. Arrête les drames.",
  "Chaque matin te donne un joker. Arrête de le brûler.",
  "Pause café ne rime pas avec pause cerveau.",
  "Tu parles d'une routine, on dirait un freestyle.",
  "Besoin d'un nouveau départ ? Il vient toutes les 24h.",
  "Matin calme, esprit clair. Fais-en quelque chose.",
  "L'après-midi teste ta constance. Reste droit.",
  "Soirée = audit rapide : tu as vécu ou subi ta journée ?",
  "Ton lit ne résout pas tes habitudes. Il les cache.",
  "Le soleil se lève. Toi aussi, idéalement.",
  "Midi : hydrate ton cerveau, pas tes doutes.",
  "16h : c'est là que tu te trahis d'habitude.",
  "20h : éteins les excuses avant les lumières.",
  "Chaque fin de journée te juge silencieusement.",
  "Matin sans intention = journée poubelle.",
  "Soir sans plan = lendemain identique.",
  "Ton calendrier connaît mieux tes priorités que toi.",
  "La journée ne t'attaque pas, tu l'abandonnes.",
] as const

const allRoasts = [
  ...badHabitRoasts,
  ...goodHabitRoasts,
  ...coachMilitaryRoasts,
  ...autoDerisionRoasts,
  ...routineRoasts,
] as const

const randomFrom = (pool: readonly string[]): string => pool[Math.floor(Math.random() * pool.length)]

export const roastCollections = {
  badHabitRoasts,
  goodHabitRoasts,
  coachMilitaryRoasts,
  autoDerisionRoasts,
  routineRoasts,
}

export function getRandomMessage(): string {
  return randomFrom(allRoasts)
}

export function getRandomFromCollection(collection: keyof typeof roastCollections) {
  return randomFrom(roastCollections[collection])
}

export type RoastCollectionKey = keyof typeof roastCollections

export {
  badHabitRoasts,
  goodHabitRoasts,
  coachMilitaryRoasts,
  autoDerisionRoasts,
  routineRoasts,
}
