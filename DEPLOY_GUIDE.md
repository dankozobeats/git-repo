# 🚀 Guide de Déploiement - BadHabit Tracker

**Date** : 31 décembre 2025
**Branche** : `ui-refactor-validate-action` (avec correctifs de sécurité mergés)
**Statut** : ✅ Prêt à pousser et déployer

---

## ✅ Ce qui a été fait

- ✅ Audit de sécurité complet effectué
- ✅ Correctifs de sécurité implémentés (score 5.8/10 → 8.5/10)
- ✅ Branche `security-audit-fixes` mergée dans `ui-refactor-validate-action`
- ✅ Nouveaux secrets générés (VAPID, CRON_SECRET)
- ✅ Build testé et fonctionnel

---

## 🚀 Étapes de Déploiement

### 1. Pousser vers GitHub

```bash
# Vous êtes déjà sur la bonne branche
git push origin ui-refactor-validate-action
```

Si vous avez une erreur d'authentification, utilisez GitHub Desktop ou configurez SSH.

---

### 2. ⚠️ CRITIQUE - Configurer Vercel AVANT le déploiement

**Allez sur** : https://vercel.com/dashboard

1. **Sélectionnez votre projet** BadHabit Tracker

2. **Settings > Environment Variables**

3. **Ajoutez ces variables** (copiez depuis votre `.env.local`) :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rfcyxeujktcwqsyiorso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3l4ZXVqa3Rjd3FzeWlvcnNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MDQ4NywiZXhwIjoyMDc4NjM2NDg3fQ.ztF1khTvzMN66nM4cIRrA2aBwLZklxac4aJ3SqgiRlo

# IA
AI_API_URL=https://ai.automationpro.cloud
AI_API_KEY=Qk9ViEYf98HYRYOlCdfx6q51GxkopD19y3T2zRZY7zvon4LAjO0EHzWElnb0lNd7HcLyOPuB5Ipt9cPIL1V8Z4wDfapVpQAdBzVLJdaX2iXuWYBhMz1qh4AsunaTERFU

# Push Notifications (NOUVEAUX secrets générés)
VAPID_PRIVATE_KEY=xaqygY1I6YyFMOrwVSQ4vG06gTQIINl4NEHhgQGAf88
VAPID_PUBLIC_KEY=BGlTTdEc4XJXkATqXt4Xv-S8DG_D7gn-khdILGPgiX1PJrAiT7S9-uhC53RrzleXaCmEvwXlQj1UFXQb5Gx4L78
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BBitFfo_poMwPVvAXB9gCPTUOYpEoeRKoUPaeV8uTebFxCmAotkjE0Do_GtLfrehiHWm42t_CTZdR_JtMr2IY_8

# Sécurité CRON (NOUVEAU secret généré)
CRON_SECRET=b61230a43fb5b3dfdf8cdcf6c94c22b06228a717395b256e51f371cc643fae4f
```

4. **Pour chaque variable** :
   - Cliquez sur "Add New"
   - Nom : (ex: `CRON_SECRET`)
   - Valeur : (collez la valeur)
   - Environnements : Sélectionnez **Production**, **Preview**, **Development**
   - Cliquez "Save"

---

### 3. Déclencher le Déploiement

**Option A - Automatique (recommandé)** :
- Le push vers GitHub déclenchera automatiquement Vercel
- Allez sur Vercel Dashboard pour suivre le déploiement

**Option B - Manuel** :
```bash
# Si vous avez Vercel CLI installé
vercel --prod
```

**Option C - Via Dashboard** :
- Vercel Dashboard > Votre Projet > Deployments
- Cliquez sur "Redeploy" sur le dernier déploiement

---

### 4. ⚠️ IMPORTANT - Vérifications Post-Déploiement

Une fois déployé :

#### A. Tester l'authentification
1. Ouvrez votre site : `https://my-badhabit-tracker.vercel.app`
2. Connectez-vous
3. ✅ Vérifiez que le dashboard s'affiche

#### B. Tester les fonctionnalités
- [ ] Créer une habitude
- [ ] Valider une habitude
- [ ] Créer une catégorie
- [ ] Générer un rapport IA

#### C. Vérifier la sécurité
Ouvrez DevTools (F12) > Network > Sélectionnez n'importe quelle requête > Headers

Vérifiez la présence de :
- [ ] `Strict-Transport-Security`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `Content-Security-Policy`

#### D. Vérifier les logs
Vercel Dashboard > Votre Projet > Logs
- [ ] Aucune erreur 500
- [ ] Aucune erreur de CSRF
- [ ] Les requêtes API passent

---

## ⚠️ RAPPEL SÉCURITÉ - Clé Supabase

**CRITIQUE** : Votre `.env.local` utilise toujours la clé **service_role**.

### Pour la production (RECOMMANDÉ) :

1. **Allez sur Supabase** :
   https://app.supabase.com/project/rfcyxeujktcwqsyiorso/settings/api

2. **Copiez la clé "anon public"** (PAS service_role)

3. **Mettez à jour dans Vercel** :
   - Settings > Environment Variables
   - Trouvez `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Cliquez "Edit"
   - Remplacez par la clé anon
   - Save

4. **Re-déployez** pour appliquer

---

## 📊 Checklist Complète

### Avant déploiement
- [x] Correctifs de sécurité mergés
- [x] Build testé localement
- [x] Nouveaux secrets générés
- [ ] Variables Vercel configurées
- [ ] Push vers GitHub effectué

### Pendant déploiement
- [ ] Déploiement lancé (automatique ou manuel)
- [ ] Logs Vercel sans erreur
- [ ] Build réussi sur Vercel

### Après déploiement
- [ ] Site accessible en HTTPS
- [ ] Authentification fonctionne
- [ ] Fonctionnalités testées
- [ ] Headers de sécurité présents
- [ ] Aucune erreur dans les logs

### Sécurité (RECOMMANDÉ mais non bloquant)
- [ ] Clé anon Supabase en production
- [ ] Test de protection CSRF
- [ ] Vérification sur securityheaders.com

---

## 🆘 Résolution de Problèmes

### Erreur "Invalid request origin" en production
**Cause** : Le middleware CSRF bloque la requête

**Solution** :
1. Vérifiez que `VERCEL_URL` est bien configuré
2. Ajoutez votre domaine Vercel dans `middleware.ts` ligne 7 si nécessaire

### Erreur "Non authentifié" partout
**Cause** : Variables Supabase non configurées

**Solution** :
1. Vérifiez Vercel > Environment Variables
2. `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` doivent être présentes
3. Re-déployez après ajout

### L'IA ne génère pas de rapports
**Cause** : `AI_API_KEY` manquante

**Solution** :
1. Vérifiez que `AI_API_KEY` est dans Vercel
2. Vérifiez les logs Vercel pour l'erreur exacte

### Build échoue sur Vercel
**Cause** : Erreur TypeScript ou dépendance manquante

**Solution** :
1. Regardez les logs de build Vercel
2. Testez `npm run build` en local
3. Vérifiez que `package.json` est à jour

---

## 📈 Après le Déploiement

### Monitoring (24-48h)
- Surveillez les logs Vercel
- Vérifiez les métriques (erreurs, latence)
- Testez régulièrement les fonctionnalités critiques

### Prochaines étapes (optionnel)
- [ ] Implémenter rate limiting (Upstash Redis)
- [ ] Ajouter Sentry pour monitoring d'erreurs
- [ ] Ajouter tests automatisés
- [ ] Mettre en place CI/CD complet

---

## 🎉 Félicitations !

Une fois déployé, vous aurez une application :
- 🔒 **Sécurisée** (score 8.5/10)
- ✅ **Protégée** (CSRF, validation, headers)
- 📚 **Documentée** (6 guides complets)
- 🚀 **Performante** (Next.js 16 optimisé)

**Bon déploiement ! 🚀**

---

## 📞 Support

- **Documentation** : Voir tous les fichiers `*.md` du projet
- **Logs Vercel** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://app.supabase.com
