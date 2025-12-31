# ✅ Checklist de Test - Correctifs de Sécurité

## 🏗️ Build et Compilation

- [x] **Build Next.js réussi** - `npm run build` compile sans erreur
  - ✅ 41 routes générées
  - ✅ Aucune erreur TypeScript (ignoré par config)
  - ⚠️  Warning middleware → proxy (normal Next.js 16)

## 🧪 Tests Fonctionnels à Effectuer

### 1. Test du serveur de développement

```bash
# Démarrer le serveur
npm run dev

# Vérifier que l'app démarre sur http://localhost:3000
```

**Checklist**:
- [ ] Page d'accueil se charge
- [ ] Authentification fonctionne
- [ ] Dashboard s'affiche
- [ ] Pas d'erreurs dans la console navigateur

---

### 2. Test de la validation Zod

**Endpoint**: `POST /api/categories`

**Test 1 - Nom vide (doit échouer)**:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=votre_token" \
  -d '{"name": "", "color": "#FF5733"}'

# Résultat attendu: 400 Bad Request
# { "error": "Validation failed", "details": [...] }
```

**Test 2 - Couleur invalide (doit échouer)**:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=votre_token" \
  -d '{"name": "Test", "color": "rouge"}'

# Résultat attendu: 400 Bad Request
# Format de couleur invalide
```

**Test 3 - Données valides (doit réussir)**:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=votre_token" \
  -d '{"name": "Sport", "color": "#FF5733"}'

# Résultat attendu: 200 OK
# { "success": true, "category": {...} }
```

---

### 3. Test de protection CRON_SECRET

**Endpoint**: `GET /api/get-due-reminders`

**Test 1 - Sans token (doit échouer)**:
```bash
curl http://localhost:3000/api/get-due-reminders

# Résultat attendu: 401 Unauthorized
# { "error": "Unauthorized" }
```

**Test 2 - Avec mauvais token (doit échouer)**:
```bash
curl -H "Authorization: Bearer wrong_token" \
  http://localhost:3000/api/get-due-reminders

# Résultat attendu: 401 Unauthorized
```

**Test 3 - Avec bon token (doit réussir)**:
```bash
# Récupérez votre CRON_SECRET depuis .env.local
curl -H "Authorization: Bearer votre_cron_secret" \
  http://localhost:3000/api/get-due-reminders

# Résultat attendu: 200 OK
# { "weekday": 2, "time_local": "14:30", ... }
```

---

### 4. Test de protection CSRF

**Test avec Postman/Insomnia**:

1. Essayez de créer une catégorie **sans** header `Origin`
   - Résultat attendu: **403 Forbidden** (Invalid request origin)

2. Essayez avec `Origin: https://evil.com`
   - Résultat attendu: **403 Forbidden**

3. Essayez avec `Origin: http://localhost:3000`
   - Résultat attendu: **200 OK** (si authentifié)

---

### 5. Test des headers de sécurité

**Dans le navigateur** (DevTools > Network > Sélectionner n'importe quelle requête > Headers):

Vérifiez la présence de:
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy: default-src 'self'; ...`

**Ou via curl**:
```bash
curl -I http://localhost:3000 | grep -E "(Strict-Transport|X-Frame|X-Content|Referrer|Content-Security)"
```

---

### 6. Test de gestion d'erreurs

**En mode développement** (`NODE_ENV=development`):
- [ ] Les erreurs montrent les détails (stack trace)
- [ ] Console.log visible

**En mode production** (`npm run build && npm start`):
- [ ] Les erreurs masquent les détails sensibles
- [ ] Seulement messages génériques exposés

**Test**:
```bash
# Créer une catégorie avec une erreur volontaire
# (ex: ID utilisateur invalide dans le code temporairement)
# Vérifier que l'erreur retournée ne montre pas les détails DB
```

---

### 7. Test des fonctionnalités existantes

**Navigation**:
- [ ] Toutes les pages se chargent
- [ ] Aucune erreur 404 inattendue

**Habitudes**:
- [ ] Créer une habitude
- [ ] Modifier une habitude
- [ ] Supprimer une habitude
- [ ] Valider une habitude (check-in)

**Catégories**:
- [ ] Créer une catégorie
- [ ] Modifier une catégorie
- [ ] Supprimer une catégorie

**IA/Coach**:
- [ ] Générer un rapport IA
- [ ] Analyser les patterns
- [ ] Recevoir un message sarcastique

**Rappels**:
- [ ] Créer un rappel
- [ ] Modifier un rappel
- [ ] Push notifications (si configuré)

---

## 🔍 Tests Visuels

### Console Navigateur
- [ ] Aucune erreur rouge
- [ ] Aucun warning CORS
- [ ] Aucune erreur CSP (Content Security Policy)

### Console Serveur
- [ ] Logs formatés avec contexte `[categories GET]`, etc.
- [ ] Aucune erreur au démarrage
- [ ] CRON_SECRET warnings visible si accès non autorisé

---

## 🚀 Test de Déploiement (Vercel)

### Avant déploiement
- [ ] Toutes les variables d'environnement configurées dans Vercel
- [ ] CRON_SECRET régénéré et configuré
- [ ] VAPID keys régénérées
- [ ] Clé anon Supabase (pas service_role)

### Après déploiement
- [ ] Site accessible en HTTPS
- [ ] Headers de sécurité présents (vérifier avec securityheaders.com)
- [ ] Authentification fonctionne
- [ ] Pas d'erreurs 500 inattendues

---

## 📊 Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Build | ✅ | Succès |
| Dev server | ⏳ | À tester |
| Validation Zod | ⏳ | À tester |
| CRON_SECRET | ⏳ | À tester |
| Protection CSRF | ⏳ | À tester |
| Headers sécurité | ⏳ | À tester |
| Gestion erreurs | ⏳ | À tester |
| Fonctionnalités | ⏳ | À tester |

---

## 🐛 Bugs Trouvés

_Documentez ici les bugs trouvés pendant les tests:_

1.
2.
3.

---

## ✅ Validation Finale

- [ ] Tous les tests passent
- [ ] Aucun bug bloquant
- [ ] Performance acceptable
- [ ] Prêt pour merge

---

**Date**: 31/12/2025
**Testeur**: _Votre nom_
**Branche**: `security-audit-fixes`
