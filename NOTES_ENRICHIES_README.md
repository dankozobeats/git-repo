# 📝 Système de Notes Enrichies - Guide d'Utilisation

## 🎯 Qu'est-ce que c'est ?

Un système complet de **notes enrichies** pour vos habitudes, avec :

- ✍️ **Éditeur de texte riche** (gras, italique, titres, listes, citations, liens)
- 🎬 **Support des embeds** (YouTube, TikTok, Vimeo, Spotify, articles web)
- 📌 **Épinglage de notes** prioritaires
- 💾 **Sauvegarde automatique** avec Ctrl/Cmd + S
- 🚀 **Chargement lazy** pour des performances optimales

## 📋 Installation

### 1️⃣ Exécuter la Migration SQL

**IMPORTANT** : Vous devez d'abord créer les tables dans Supabase.

1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur **SQL Editor** dans le menu
4. Ouvrez le fichier `/migrations/010_create_habit_notes_enriched.sql`
5. Copiez tout le contenu
6. Collez dans l'éditeur SQL de Supabase
7. Cliquez sur **Run** (ou Ctrl+Enter)

✅ Vous devriez voir un message de succès !

### 2️⃣ Vérifier l'Installation

Les dépendances sont déjà installées :
- `@tiptap/react` - Éditeur de texte riche
- `@tiptap/starter-kit` - Extensions de base
- `@tiptap/extension-link` - Support des liens
- `@tiptap/extension-placeholder` - Placeholder
- `unfurl.js` - Extraction de métadonnées web
- `react-player` - Player vidéo universel

## 🚀 Utilisation

### Accéder aux Notes

1. Allez sur une habitude (cliquez sur n'importe quelle carte)
2. Cliquez sur l'onglet **📝 Notes**
3. Vous êtes prêt !

### Créer une Note

1. Cliquez sur **+ Nouvelle note**
2. Entrez un titre
3. Commencez à écrire !

### Fonctionnalités de l'Éditeur

#### Mise en Forme

- **Gras** : Ctrl/Cmd + B ou bouton toolbar
- **Italique** : Ctrl/Cmd + I ou bouton toolbar
- **Titres** : Boutons H1, H2 dans la toolbar
- **Listes** : Boutons liste à puces / numérotée
- **Citation** : Bouton quote
- **Lien** : Bouton lien (Ctrl/Cmd + K)

#### Raccourcis Clavier

- `Cmd/Ctrl + S` : Sauvegarder
- `Cmd/Ctrl + B` : Gras
- `Cmd/Ctrl + I` : Italique
- `Cmd/Ctrl + K` : Insérer un lien

### Épingler une Note

Cliquez sur l'icône 📌 pour épingler une note en haut de la liste.

### Supprimer une Note

Cliquez sur l'icône 🗑️ et confirmez la suppression.

## 🎬 Ajouter des Vidéos et Articles (À venir)

### YouTube

```markdown
1. Collez un lien YouTube dans votre note
2. L'API détecte automatiquement la vidéo
3. Une prévisualisation s'affiche avec miniature
4. Cliquez pour lire directement dans la note
```

### TikTok

```markdown
1. Collez un lien TikTok
2. La vidéo s'intègre automatiquement
3. Lisez sans quitter l'application
```

### Articles Web

```markdown
1. Collez n'importe quel lien web
2. Une card de prévisualisation s'affiche
3. Voir le titre, description et image
4. Cliquez pour ouvrir
```

## 🏗️ Architecture Technique

### Structure de Données

```typescript
{
  id: "uuid",
  habit_id: "uuid",
  title: "Ma note",
  blocks: [
    {
      type: "paragraph",
      content: { text: "Mon texte..." }
    },
    {
      type: "heading",
      content: { text: "Titre", level: 1 }
    }
  ],
  is_pinned: false,
  media_metadata: { /* Cache des embeds */ },
  created_at: "2026-01-12",
  updated_at: "2026-01-12"
}
```

### Performance

1. **Chargement Initial** : Seulement les métadonnées (titres, dates)
2. **Lazy Loading** : Contenu chargé au clic sur une note
3. **Cache** : Les embeds sont cachés pour éviter les requêtes répétées
4. **Index Texte Plein** : Recherche ultra-rapide dans les notes

## 📁 Fichiers Créés

### Backend
- `migrations/010_create_habit_notes_enriched.sql` - Migration SQL
- `app/api/notes/embed-preview/route.ts` - API embeds
- `types/notes.ts` - Types TypeScript

### Frontend
- `lib/notes/useHabitNotes.ts` - Hook React
- `components/notes/NoteEditor.tsx` - Éditeur Tiptap
- `components/notes/HabitNotesPanel.tsx` - Panneau de gestion
- `components/notes/NotesBadge.tsx` - Badge pour les cartes
- `app/habits/[id]/tabs/NotesTab.tsx` - Onglet Notes

### Intégrations
- `app/habits/[id]/HabitDetailClient.tsx` - Modifié
- `app/habits/[id]/HabitDetailHeader.tsx` - Modifié

## 🔮 Prochaines Étapes (Phase 2)

### Fonctionnalités Avancées

1. **Transformation en Tâches**
   - Convertir une vidéo/article en tâche à faire
   - Tracker si vous avez regardé/lu
   - Cocher quand terminé

2. **Composants de Rendu des Blocks**
   - EmbedBlock avec React Player
   - LinkPreviewBlock avec unfurl
   - Support images/GIFs

3. **Recherche Full-Text**
   - Rechercher dans toutes vos notes
   - Highlighting des résultats
   - Filtres par habitude

4. **Export/Import**
   - Exporter en Markdown
   - Exporter en PDF
   - Importer depuis Notion

## 🐛 Dépannage

### "Table habit_notes doesn't exist"
➡️ Vous n'avez pas exécuté la migration SQL. Voir étape 1️⃣ ci-dessus.

### "Cannot find module '@tiptap/react'"
➡️ Exécutez `npm install` pour installer les dépendances.

### L'éditeur ne s'affiche pas
➡️ Vérifiez la console du navigateur pour les erreurs.
➡️ Assurez-vous d'avoir exécuté la migration.

### Les notes ne se sauvegardent pas
➡️ Vérifiez que vous êtes authentifié.
➡️ Regardez les erreurs dans la console réseau (F12 > Network).

## 💡 Conseils d'Utilisation

### Pour un Entraînement Sportif
```
Titre: Programme Semaine 1
- Lundi: Cardio 30min
- Mercredi: Musculation haut du corps
- Vendredi: HIIT

[Lien YouTube: Tutoriel exercices]
```

### Pour Arrêter une Mauvaise Habitude
```
Titre: Stratégies anti-café
1. Boire de l'eau dès le réveil
2. Remplacer par du thé vert
3. Activité physique le matin

[Article: Les méfaits du café]
[Vidéo TikTok: Morning routine sans café]
```

### Pour Apprendre
```
Titre: Ressources React
- Documentation officielle
- [Cours Udemy: React avancé]
- [Article: Best practices 2026]

À faire:
☐ Finir le cours Udemy
☐ Lire l'article sur les hooks
☐ Pratiquer avec un projet
```

## 🤝 Contribution

Des idées pour améliorer le système ?
Ouvrez une issue sur GitHub ou contactez-moi !

---

**Créé avec ❤️ par Claude Code**
Version 1.0 - Janvier 2026
