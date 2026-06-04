# My Recipes App — Maintenance Guide

## The App
- **Live URL (iPhone & any device):** https://mchughde.github.io/recipes
- **Local Mac URL (development only):** http://localhost:3721 (requires serve.py running)
- **GitHub repository:** https://github.com/mchughde/recipes

---

## ⚠️ The Most Important Things to Understand

### Clearing website data will wipe your recipes
If you ever go to **Settings → Safari → Clear History and Website Data** on your iPhone (or clear browsing data on your Mac), all your recipes will be permanently deleted from that device. This cannot be undone.

**The only protection is a current backup JSON file saved in Google Drive.**

This is why you must export a backup every time you add or change anything.

### Photos must always be URLs — never uploaded from your device
If you tap a recipe photo and upload an image from your photo library, that photo is stored in the browser cache. It **will be lost** if you clear website data, and it **will not sync** to other devices.

Instead, always use a photo URL — a direct link to an image hosted on a recipe website. These are permanent and will never be lost regardless of what happens to your browser data.

**How to get a photo URL:**
1. Find the recipe photo on any website
2. Right-click on the photo
3. Select **Copy Image Address** (Safari) or **Copy Image Link** (Chrome)
4. Paste it into a new browser tab — if you see just the photo with nothing around it, it's a valid URL
5. Use that URL in the recipe's **"Or paste an image URL below"** field

---

## Where Things Are Stored

| What | Where |
|------|-------|
| App code files | Google Drive → Recipes → RecipeApp (and mirrored on GitHub) |
| JSON backup | Google Drive → Recipes → Recipes backup |
| Individual recipe .md files | Obsidian vault in iCloud |
| Recipes themselves | Browser localStorage on each device (iPhone or Mac) |
| Photos | Hosted on recipe websites — stored as URLs only |

---

## Adding or Editing a Recipe

1. Open the app on your iPhone at https://mchughde.github.io/recipes
2. Add or edit the recipe as normal
3. For photos, **always use a URL** — do not upload from your photo library
4. Save the recipe
5. **Export a backup immediately** (home screen → Export backup)
6. Move the **JSON file** to **Google Drive → Recipes → Recipes backup**
7. For Obsidian — export the recipe as **Text** from the recipe detail page and paste it into a new note in your Obsidian vault

---

## Keeping iPhone and Mac in Sync

The iPhone and Mac have **completely separate** recipe collections — they do not sync automatically.

**The iPhone is the primary device.** Make recipe changes there.

The Mac may be used for app development and maintenance with Claude, or if it's easier to add/edit recipes on a larger screen.

### iPhone → Mac (after making changes on iPhone)
1. Export backup on iPhone
2. Save JSON to Google Drive
3. On Mac, open the app → Import backup → **Replace all**

### Mac → iPhone (after making changes on Mac)
1. Export backup on Mac
2. Save JSON to Google Drive
3. On iPhone, open the app → Import backup → **Replace all**

---

## Making Changes to the App Code

When you update the app itself (new features, bug fixes — done with Claude on the Mac):

1. Changes are made to the files in:
   `Google Drive → Recipes → RecipeApp`
2. Upload the changed files to GitHub:
   - Go to https://github.com/mchughde/recipes
   - Click **Add file → Upload files**
   - Drag in the changed files
   - Click **Commit changes**
3. Wait 1-2 minutes for GitHub to deploy
4. On iPhone, close the Safari tab completely and reopen the app
5. If the app hasn't updated, clear Safari data — but **export a backup first!**

---

## Restoring from Backup

If you ever lose your recipes after clearing website data:

1. Open the app at https://mchughde.github.io/recipes
2. Tap **Import backup** on the home screen
3. Navigate to your most recent JSON file in **Google Drive → Recipes → Recipes backup**
4. Select it
5. Choose **Replace all**
6. All recipes and category photos are restored instantly
7. Photos will display correctly because they are stored as URLs, not as files

---

## Backup File Names

Backups are named with the date, e.g.:
- `my-recipes-backup-04-06-2026.json` → save to **Google Drive → Recipes → Recipes backup**
- `my-recipes-obsidian-04-06-2026.zip` → unzip and drop .md files into your **Obsidian vault in iCloud** (export this from Mac — may not download on iPhone)

---

## Obsidian

- Historic recipes are already in your Obsidian vault as .md files in iCloud
- For new recipes, export as **Text** from the individual recipe detail page and paste into a new Obsidian note manually
- For a full export of all recipes, use Export backup on the Mac — the zip file contains one .md file per recipe ready to drop into your Obsidian vault

---

## If Something Goes Wrong

- **Recipes disappeared** → Import your most recent JSON backup from Google Drive
- **Photos not showing** → Check the photo URL still works by pasting it into a browser tab. If it doesn't work the website may have moved the image — find a new URL
- **App not updating after a code change** → Export backup first, then clear Safari website data, then import backup
- **Need help** → Start a new session with Claude and mention the Recipe App — memory files will have the full context
