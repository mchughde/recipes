# My Recipes App — Maintenance Guide

## The App
- **Live URL (iPhone & any device):** https://mchughde.github.io/recipes
- **GitHub repository:** https://github.com/mchughde/recipes
- **Local Mac URL (development only):** http://localhost:3721 (requires serve.py running)

---

## ⚠️ The Most Important Things to Understand

### Clearing website data will wipe your recipes
If you ever go to **Settings → Safari → Clear History and Website Data** on your iPhone (or clear browsing data on your Mac), all your recipes may be permanently deleted from that device. This cannot be undone.

**Exception:** If you have added the app to your iPhone home screen as a shortcut, your recipes are protected from Safari data clearing. They will survive.

**The only full protection is a current backup saved in Google Drive.**

Export a backup every time you add or change anything — this is essential.

### Photos must always be URLs — never uploaded from your device
If you upload a photo from your photo library, it is stored in the browser cache and **will be lost** if website data is cleared. It also **will not sync** to other devices.

Always use a photo URL — a direct link to an image on a recipe website. These are permanent and survive any browser clearing.

**How to get a photo URL:**
1. Find the photo on any recipe website
2. Long-press the photo on iPhone (or right-click on Mac)
3. Select **Copy Image Address** (Safari) or **Copy Image Link** (Chrome)
4. Paste into a new browser tab — if you see just the photo with nothing around it, it's a valid URL
5. Paste that URL into the recipe's **"Or paste an image URL below"** field

---

## Categories

Recipes are organised into 8 categories, shown in this order on the home screen:

**Soups · Pasta · Chicken · Meat · Seafood · Light Meals · Desserts & Slices · Other**

Each category has a default photo. You can change any category photo by tapping **Edit photos** on the home screen.

---

## Recipe Fields

Each recipe can include:

| Field | Required? | Notes |
|-------|-----------|-------|
| Title | Yes | |
| Category | Yes | Defaults to Other if not changed |
| Prep time | Optional | e.g. 20 mins |
| Cook time | Optional | e.g. 40 mins |
| Serves | Optional | e.g. 4 |
| Photo | Optional | URL only — do not upload from your library |
| Ingredients | Yes | One per line |
| Method | Yes | One step per line |

Prep time, cook time and serves are displayed as a strip of chips on the recipe detail screen, and are included when you export a recipe as a text file or PDF.

---

## Where Things Are Stored

| What | Where |
|------|-------|
| App code files | Google Drive → Recipes → RecipeApp (and mirrored on GitHub) |
| JSON backup | Google Drive → Recipes → Recipes backup |
| Individual recipe .txt files (zip) | Google Drive → Recipes → Recipes backup |
| Recipes themselves | Browser localStorage on each device |
| Photos | Hosted on recipe websites — stored as URLs only |

---

## Adding or Editing a Recipe

### Three ways to add a recipe:

**1. Import from a URL**
Paste the link to any recipe website and tap the arrow button. Works well on most recipe sites. Some sites (like Coles) load their content in a way the app can't read — you'll see an amber warning if this happens, and you'll need to use the paste method instead.

**2. Paste recipe text**
Copy the recipe text from a website, book, or handwritten card (using Live Text or Google Lens) and paste it into the text box. Tap **Parse into ingredients & method** — the app will fill in the ingredients, method, and make a guess at the category. You will need to type the title yourself.

**3. Fill in manually**
Type everything directly into the form fields.

---

### After adding or editing a recipe:
1. Save the recipe
2. For photos, **always use a URL** — do not upload from your photo library
3. **Export a backup immediately** (home screen → Export backup)
4. Save both files to **Google Drive → Recipes → Recipes backup:**
   - `my-recipes-backup-[date].json` — for restoring recipes in the app
   - `my-recipes-export-[date].zip` — individual .txt files, one per recipe, for reference

---

## Exporting Individual Recipes

From any recipe detail screen, you can export that single recipe:
- **Text** — saves a plain .txt file
- **PDF** — opens a print-formatted version you can save as PDF

These exports include prep time, cook time and serves if they have been filled in.

---

## Keeping iPhone and Mac in Sync

The iPhone and Mac have **completely separate** recipe collections — they do not sync automatically.

**The iPhone is the primary device.** Make recipe changes there wherever possible.

The Mac is used for app development and maintenance with Claude, or when it's easier to add/edit on a larger screen.

### iPhone → Mac (after making changes on iPhone)
1. Export backup on iPhone
2. Save to Google Drive
3. On Mac, open the app → Import backup → **Replace all**

### Mac → iPhone (after making changes on Mac)
1. Export backup on Mac
2. Save to Google Drive
3. On iPhone, open the app → Import backup → **Replace all**

---

## Restoring from Backup

If you ever lose your recipes:

1. Open the app at https://mchughde.github.io/recipes
2. Tap **Import backup** on the home screen
3. Navigate to your most recent JSON file in **Google Drive → Recipes → Recipes backup**
4. Select it
5. Choose **Replace all**
6. All recipes and category photos are restored instantly
7. Photos display correctly because they are stored as URLs, not files

---

## Making Changes to the App Code

When you update the app (new features, bug fixes — done with Claude on the Mac):

1. Changes are made to files in: `Google Drive → Recipes → RecipeApp`
2. Upload changed files to GitHub:
   - Go to https://github.com/mchughde/recipes
   - Click **Add file → Upload files**
   - Drag in the changed files and click **Commit changes**
3. Wait 1-2 minutes for GitHub to deploy
4. On iPhone, close the Safari tab completely and reopen the app
5. If the app hasn't updated, clear Safari data — but **export a backup first!**

---

## If Something Goes Wrong

- **Recipes disappeared** → Import your most recent JSON backup from Google Drive
- **Photos not showing** → Paste the photo URL into a browser tab to check it still works. If broken, find a new URL from the original recipe website
- **App not updating after a code change** → Export backup first, clear Safari website data, then import backup
- **Need help** → Start a new session with Claude and say *"I'm working on my Recipe App — please read the CLAUDE.md file"*. Claude will have full context immediately.
