# 🔒 Configuration de Sécurité - BadHabit Tracker

## ⚠️ IMPORTANT - À faire IMMÉDIATEMENT

### 1. Corriger la clé Supabase (CRITIQUE)

Votre `.env.local` utilise actuellement une **service_role key** au lieu d'une **anon key**. C'est une vulnérabilité critique.

#### Étapes pour corriger:

1. **Allez dans votre Supabase Dashboard**
   - URL: https://app.supabase.com/project/rfcyxeujktcwqsyiorso/settings/api

2. **Copiez la bonne clé**
   - Cherchez la section "Project API keys"
   - Copiez la clé `anon` `public` (PAS la `service_role`)
   - Elle devrait contenir `"role":"anon"` dans le JWT

3. **Remplacez dans .env.local**
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY="votre_vraie_anon_key_ici"
   ```

4. **Vérifiez que c'est la bonne clé**
   ```bash
   # Décodez le JWT pour vérifier le role
   echo "votre_key" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .role
   # Doit afficher: "anon"
   ```

### 2. Régénérer les secrets exposés

Comme le `.env.local` a été commité, tous les secrets sont compromis:

#### a. Régénérer CRON_SECRET
```bash
openssl rand -hex 32
# Copiez le résultat dans .env.local
```

#### b. Régénérer les clés VAPID
```bash
npx web-push generate-vapid-keys
# Copiez les clés publique et privée dans .env.local
```

#### c. Régénérer AI_API_KEY
- Contactez votre fournisseur d'API IA pour une nouvelle clé
- Révoquez l'ancienne clé exposée

### 3. Configurer les variables d'environnement Vercel

Une fois les secrets régénérés localement:

1. Allez dans Vercel Dashboard > Votre Projet > Settings > Environment Variables
2. Ajoutez TOUTES les variables de `.env.local`
3. Configurez-les pour les environnements: Production, Preview, Development
4. Re-déployez l'application

### 4. Nettoyer l'historique Git (si le repo est public)

⚠️ **Seulement si votre repo est public ou partagé**

```bash
# Sauvegarder d'abord
git branch backup-before-cleanup

# Supprimer .env.local de l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer le push (ATTENTION: destructif)
git push origin --force --all
git push origin --force --tags
```

## ✅ Checklist de sécurité

- [ ] Clé anon (pas service_role) dans NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] CRON_SECRET régénéré
- [ ] Clés VAPID régénérées
- [ ] AI_API_KEY régénérée et ancienne révoquée
- [ ] Variables ajoutées dans Vercel
- [ ] .env.local supprimé de Git (si nécessaire)
- [ ] Application re-déployée sur Vercel

## 📝 Fichiers à ne JAMAIS commiter

Vérifiez que `.gitignore` contient:
```
.env*
*.pem
*.key
```

## 🆘 Besoin d'aide?

Si vous avez des questions sur ces étapes, consultez:
- [Documentation Supabase sur les clés API](https://supabase.com/docs/guides/api/api-keys)
- [Documentation Vercel Environment Variables](https://vercel.com/docs/environment-variables)
