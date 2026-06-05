'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'recipes_v2';
const UNSPLASH_W  = 800;

const CATEGORIES = [
  { id: 'pasta',       label: 'Pasta',             icon: '🍝',
    img: 'https://www.recipetineats.com/tachyon/2025/03/Lasagna_6-1.jpg?resize=1200%2C1499&zoom=0.54' },
  { id: 'soups',       label: 'Soups',             icon: '🍲',
    img: 'https://img.taste.com.au/mFCAaPnT/w720-h480-cfill-q80/taste/2016/11/chicken-and-sweet-corn-soup-3787-1.jpeg' },
  { id: 'chicken',     label: 'Chicken',           icon: '🍗',
    img: 'https://img.taste.com.au/rWwpGiw8/w720-h480-cfill-q80/taste/2020/03/apricot-chicken-tray-bake-159131-1.jpg' },
  { id: 'meat',        label: 'Meat',              icon: '🥩',
    img: 'https://img.taste.com.au/SDKrW8yn/w720-h480-cfill-q80/taste/2016/11/roast-lamb-with-honey-mustard-and-thyme-glaze-102875-1.jpeg' },
  { id: 'light-meals', label: 'Light Meals',       icon: '🥗',
    img: 'https://images.immediate.co.uk/production/volatile/sites/30/2022/12/Cheese-and-onion-quiche-183a105.jpg?quality=90&webp=true&resize=900,817' },
  { id: 'desserts',    label: 'Desserts & Slices', icon: '🍰',
    img: 'https://img.bestrecipes.com.au/NDjw3fEX/w720-h480-cfill-q90/br/2020/08/simplicity-chocolate-cake-959446-1.jpg' },
  { id: 'seafood',     label: 'Seafood',           icon: '🐟',
    img: 'https://www.coles.com.au/_next/image?url=https%3A%2F%2Fwww.coles.com.au%2F%2Fcontent%2Fdam%2Fcoles%2Fcusp%2Frecipes-inspiration%2Fwfd%2Fwinter26-wfd%2FRoastedSalmonwithTahiniSauce_3386-480x288.jpg&w=1920&q=90' },
  { id: 'other',       label: 'Other',             icon: '🍴',
    img: 'https://simply-delicious-food.com/wp-content/uploads/2024/11/Cheese-Board6.jpg.webp' },
];

const SAMPLE_RECIPE = {
  id: 'sample-bolognese',
  title: 'Spaghetti Bolognese',
  category: 'pasta',
  image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&fit=crop&q=80',
  ingredients: [
    '400g spaghetti',
    '500g beef mince',
    '1 large onion, finely diced',
    '3 garlic cloves, minced',
    '2 carrots, finely diced',
    '2 celery sticks, finely diced',
    '400g tin crushed tomatoes',
    '2 tbsp tomato paste',
    '125ml red wine',
    '1 tsp dried oregano',
    '1 tsp dried basil',
    'Salt and pepper to taste',
    'Parmesan cheese, to serve',
    'Fresh basil leaves, to garnish',
  ],
  method: [
    'Heat a large heavy-based pan over medium-high heat. Add a drizzle of olive oil, then brown the mince in batches, breaking it up as it cooks. Remove and set aside.',
    'In the same pan, reduce heat to medium. Add the onion, carrot and celery and cook for 8–10 minutes until soft and golden. Add the garlic and cook for a further 2 minutes.',
    'Pour in the red wine and let it bubble for 2–3 minutes, scraping up any browned bits from the bottom of the pan.',
    'Return the mince to the pan. Add the crushed tomatoes, tomato paste, oregano and basil. Season generously with salt and pepper.',
    'Reduce heat to low, cover and simmer for at least 45 minutes (longer is better — up to 2 hours), stirring occasionally. Add a splash of water if it thickens too much.',
    'Cook the spaghetti according to packet instructions until al dente. Reserve a cup of pasta water before draining.',
    'Toss the drained pasta through the Bolognese, adding a splash of pasta water to loosen if needed.',
    'Serve immediately, topped with freshly grated Parmesan and torn basil leaves.',
  ],
  createdAt: Date.now(),
};

// ── State ──────────────────────────────────────────────────────────────────

const navStack = []; // navigation history stack

const state = {
  view: 'home',          // 'home' | 'browse' | 'recipe' | 'add'
  recipes: [],
  currentRecipeId: null,
  browseCategory: 'all',
  browseSort: 'newest',  // 'newest' | 'az'
  searchQuery: '',
  editingId: null,
  pendingImage: null,    // data URL from file input
};

// ── Storage ────────────────────────────────────────────────────────────────

function loadRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.recipes = raw ? JSON.parse(raw) : [];
  } catch {
    state.recipes = [];
  }

  // First-run seed: populate from seeds.js if localStorage is empty
  if (state.recipes.length === 0 && typeof SEED_RECIPES !== 'undefined') {
    state.recipes = [...SEED_RECIPES];
    if (!state.recipes.find(r => r.id === 'sample-bolognese')) {
      state.recipes.unshift(SAMPLE_RECIPE);
    }
    saveRecipes();
  } else if (!state.recipes.find(r => r.id === 'sample-bolognese')) {
    state.recipes.unshift(SAMPLE_RECIPE);
    saveRecipes();
  }
  // Auto-assign photos to any recipe that doesn't have one
  autoAssignPhotos();
}

function autoAssignPhotos() {
  let updated = false;
  state.recipes.forEach(recipe => {
    const missing  = !recipe.image;
    const broken   = recipe.image && recipe.image.includes('source.unsplash.com');
    if (missing || broken) {
      recipe.image = categoryPhoto(recipe);
      updated = true;
    }
  });
  if (updated) saveRecipes();
}

function toggleFavourite(id) {
  const recipe = getRecipe(id);
  if (!recipe) return;
  recipe.favourite = !recipe.favourite;
  recipe.updatedAt = Date.now();
  saveRecipes();
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
}

function getRecipe(id) {
  return state.recipes.find(r => r.id === id);
}

function saveRecipe(recipe) {
  const idx = state.recipes.findIndex(r => r.id === recipe.id);
  if (idx >= 0) {
    state.recipes[idx] = recipe;
  } else {
    state.recipes.unshift(recipe);
  }
  saveRecipes();
}

function deleteRecipe(id) {
  state.recipes = state.recipes.filter(r => r.id !== id);
  saveRecipes();
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigate(view, params = {}) {
  const current = document.getElementById(`view-${state.view}`);
  const next    = document.getElementById(`view-${view}`);
  if (!next) return;

  const goingDeeper = (view !== 'home') && (state.view === 'home' || state.view === 'browse');

  if (goingDeeper) {
    current.classList.add('slide-left');
    current.classList.remove('active');
  } else {
    current.classList.remove('active', 'slide-left');
  }

  navStack.push(state.view);
  state.view = view;

  next.classList.remove('slide-left');
  next.classList.add('active');

  // Apply params
  if (params.category !== undefined) state.browseCategory = params.category;
  if (params.recipeId  !== undefined) state.currentRecipeId = params.recipeId;
  if (params.editingId !== undefined) state.editingId = params.editingId;

  // Render the new view
  renderView(view);
  next.scrollTop = 0;

  // FAB visibility
  const fab = document.getElementById('fab');
  fab.classList.toggle('hidden', view === 'add');
}

function goHome() {
  navStack.length = 0;
  // Reset every view, then activate home cleanly
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'slide-left'));
  document.getElementById('view-home').classList.add('active');
  state.view = 'home';
  renderHome();
  document.getElementById('fab').classList.remove('hidden');
}

function goBack() {
  const prev = navStack.pop() || 'home';
  // Reset all views, then activate the target cleanly
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'slide-left'));
  const target = document.getElementById(`view-${prev}`);
  target.classList.add('active');

  state.view = prev;
  renderView(prev);

  const fab = document.getElementById('fab');
  fab.classList.toggle('hidden', prev === 'add');
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderView(view) {
  switch (view) {
    case 'home':   renderHome();   break;
    case 'browse': renderBrowse(); break;
    case 'recipe': renderRecipe(); break;
    case 'add':    renderAdd();    break;
  }
}

// ── Home ──

function renderHome() {
  const q = state.searchQuery.trim().toLowerCase();
  const el = document.getElementById('view-home');

  if (q) {
    renderSearchResults(el, q);
    return;
  }

  const recent = [...state.recipes].slice(0, 6);

  el.innerHTML = `
    <div class="home-header">
      <p class="greeting">Welcome back</p>
      <h1>What are you cooking today?</h1>
    </div>

    <div class="search-wrap">
      <div class="search-bar">
        <span class="search-icon">${iconSearch()}</span>
        <input id="search-input" type="search" placeholder="Search recipes…"
               value="${escHtml(state.searchQuery)}" autocomplete="off" spellcheck="false">
        <button class="search-clear ${state.searchQuery ? 'visible' : ''}" id="search-clear"
                aria-label="Clear search">${iconX(16)}</button>
      </div>
    </div>

    <div class="section-header">
      <h3>Categories</h3>
      <button class="see-all" id="btn-edit-cats">
        ${catEditMode ? 'Done' : 'Edit photos'}
      </button>
    </div>

    <div class="category-grid ${catEditMode ? 'cat-grid-edit' : ''}">
      ${CATEGORIES.map(cat => {
        const count = state.recipes.filter(r => r.category === cat.id).length;
        const photo = catPhotoFor(cat);
        return `
        <div class="cat-card" data-cat="${cat.id}" data-edit="${catEditMode}">
          <img src="${escHtml(photo)}" alt="${escHtml(cat.label)}"
               onerror="this.style.background='#FEF3C7'">
          <div class="cat-overlay"></div>
          ${catEditMode ? `<div class="cat-edit-btn">${iconCamera(18)}</div>` : ''}
          <div class="cat-info">
            <span class="cat-icon">${cat.icon}</span>
            <div class="cat-name">${escHtml(cat.label)}</div>
            <div class="cat-count">${count} ${count === 1 ? 'recipe' : 'recipes'}</div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="home-actions">
      <button class="btn btn-secondary" id="btn-browse-all">
        ${iconGrid(18)} Browse All
      </button>
      <button class="btn btn-primary" id="btn-add-home">
        ${iconPlus(18)} Add Recipe
      </button>
    </div>

    <div class="backup-bar">
      <button class="backup-btn" id="btn-export">
        ${iconDownload(15)} Export backup
      </button>
      <div class="backup-divider"></div>
      <label class="backup-btn" for="import-file-input">
        ${iconUpload(15)} Import backup
        <input type="file" id="import-file-input" accept=".json" style="display:none">
      </label>
    </div>

    ${(() => {
      const favourites = state.recipes.filter(r => r.favourite);
      const recents    = state.recipes.filter(r => !r.favourite).slice(0, 6);
      return `
        ${favourites.length > 0 ? `
        <div class="section-header">
          <h3>⭐ Favourites</h3>
        </div>
        <div class="recipe-list">
          ${favourites.map(r => recipeCardHTML(r)).join('')}
        </div>` : ''}
        ${recents.length > 0 ? `
        <div class="section-header">
          <h3>${favourites.length > 0 ? 'Recent Recipes' : 'All Recipes'}</h3>
          <button class="see-all" id="btn-see-all">See all</button>
        </div>
        <div class="recipe-list">
          ${recents.map(r => recipeCardHTML(r)).join('')}
        </div>` : ''}`;
    })()}
  `;

  bindHomeEvents(el);
}

function renderSearchResults(el, q) {
  const results = state.recipes.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    (r.ingredients || []).some(i => i.toLowerCase().includes(q))
  );

  el.innerHTML = `
    <div class="home-header" style="padding-bottom:0">
      <h1>Search</h1>
    </div>
    <div class="search-wrap">
      <div class="search-bar">
        <span class="search-icon">${iconSearch()}</span>
        <input id="search-input" type="search" placeholder="Search recipes…"
               value="${escHtml(state.searchQuery)}" autocomplete="off" spellcheck="false">
        <button class="search-clear visible" id="search-clear" aria-label="Clear search">${iconX(16)}</button>
      </div>
    </div>
    <p class="search-results-label">${results.length} result${results.length !== 1 ? 's' : ''} for "${escHtml(q)}"</p>
    <div class="recipe-list" style="padding-top:8px">
      ${results.length
        ? results.map(r => recipeCardHTML(r)).join('')
        : `<div class="empty-state">
             <div class="empty-icon">🔍</div>
             <h3>No recipes found</h3>
             <p>Try a different search term</p>
           </div>`}
    </div>
  `;

  bindHomeEvents(el);
}

function bindHomeEvents(el) {
  // Search
  const input = el.querySelector('#search-input');
  const clear = el.querySelector('#search-clear');

  input?.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    clear?.classList.toggle('visible', !!e.target.value);
    renderHome();
    // Re-focus after re-render
    const newInput = document.querySelector('#view-home #search-input');
    if (newInput) { newInput.focus(); newInput.setSelectionRange(9999,9999); }
  });

  clear?.addEventListener('click', () => {
    state.searchQuery = '';
    renderHome();
    document.querySelector('#view-home #search-input')?.focus();
  });

  // Category edit toggle
  el.querySelector('#btn-edit-cats')?.addEventListener('click', () => {
    catEditMode = !catEditMode;
    renderHome();
  });

  // Category cards
  el.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.edit === 'true') {
        showCatPhotoEditor(card.dataset.cat);
      } else {
        navigate('browse', { category: card.dataset.cat });
      }
    });
  });

  // Buttons
  el.querySelector('#btn-browse-all')?.addEventListener('click', () => navigate('browse', { category: 'all' }));
  el.querySelector('#btn-see-all')?.addEventListener('click', () => navigate('browse', { category: 'all' }));
  el.querySelector('#btn-add-home')?.addEventListener('click', () => navigate('add', { editingId: null }));
  el.querySelector('#btn-export')?.addEventListener('click', exportAllRecipes);
  el.querySelector('#import-file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importAllRecipes(file);
    e.target.value = '';
  });

  // Recipe cards
  el.querySelectorAll('.recipe-card[data-id]').forEach(card => {
    card.addEventListener('click', () => navigate('recipe', { recipeId: card.dataset.id }));
  });
}

// ── Browse ──

function renderBrowse() {
  const cat = state.browseCategory;
  const catObj = CATEGORIES.find(c => c.id === cat);
  const title = cat === 'all' ? 'All Recipes' : (catObj?.label || 'Recipes');

  let recipes = cat === 'all' ? [...state.recipes] : state.recipes.filter(r => r.category === cat);
  if (state.browseSort === 'az') recipes.sort((a, b) => a.title.localeCompare(b.title));
  // 'newest' keeps insertion order (newest first via unshift on add)

  document.getElementById('view-browse').innerHTML = `
    <div class="browse-header">
      <button class="back-btn" id="browse-back" aria-label="Back">${iconChevronLeft()}</button>
      <span class="browse-title">${escHtml(title)}</span>
      <button class="home-btn" id="browse-home" aria-label="Home">${iconHome(18)}</button>
    </div>

    <div class="browse-toolbar">
      <div class="filter-chips">
        <div class="chip ${cat === 'all' ? 'active' : ''}" data-cat="all">All</div>
        ${CATEGORIES.map(c => `
          <div class="chip ${c.id === cat ? 'active' : ''}" data-cat="${c.id}">
            ${c.icon} ${c.label}
          </div>`).join('')}
      </div>
      <div class="sort-wrap">
        <select class="sort-select" id="browse-sort" aria-label="Sort recipes">
          <option value="newest" ${state.browseSort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="az"     ${state.browseSort === 'az'     ? 'selected' : ''}>A – Z</option>
        </select>
      </div>
    </div>

    ${recipes.length > 0 ? `
    <div class="browse-grid">
      ${recipes.map(r => browseCardHTML(r)).join('')}
    </div>` : `
    <div class="empty-state">
      <div class="empty-icon">${catObj?.icon || '🍴'}</div>
      <h3>No ${title.toLowerCase()} yet</h3>
      <p>Add your first recipe to get started</p>
      <button class="btn btn-primary" id="browse-add-btn">${iconPlus(16)} Add Recipe</button>
    </div>`}
  `;

  const el = document.getElementById('view-browse');

  el.querySelector('#browse-back')?.addEventListener('click', goBack);
  el.querySelector('#browse-home')?.addEventListener('click', goHome);
  el.querySelector('#browse-add-btn')?.addEventListener('click', () => navigate('add', { editingId: null }));
  el.querySelector('#browse-sort')?.addEventListener('change', e => {
    state.browseSort = e.target.value;
    renderBrowse();
  });

  el.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.browseCategory = chip.dataset.cat;
      renderBrowse();
    });
  });

  el.querySelectorAll('.browse-recipe-card[data-id]').forEach(card => {
    card.addEventListener('click', () => navigate('recipe', { recipeId: card.dataset.id }));
  });
}

// ── Recipe Detail ──

function renderRecipe() {
  const recipe = getRecipe(state.currentRecipeId);
  if (!recipe) { goBack(); return; }

  const catObj = CATEGORIES.find(c => c.id === recipe.category);
  const isImg  = recipe.image && recipe.image.trim();

  document.getElementById('view-recipe').innerHTML = `
    <div class="recipe-hero-wrap">
      ${isImg
        ? `<img class="recipe-hero" src="${escHtml(recipe.image)}" alt="${escHtml(recipe.title)}"
               onerror="this.outerHTML='<div class=\\'recipe-hero placeholder\\'style=\\'background:var(--accent-light)\\'>${catObj?.icon || '🍴'}</div>'">`
        : `<div class="recipe-hero placeholder" style="background:var(--accent-light);">${catObj?.icon || '🍴'}</div>`}
      <div class="hero-gradient"></div>
      <button class="recipe-back-btn" id="recipe-back" aria-label="Back">${iconChevronLeft()}</button>
      <label class="hero-photo-btn" for="hero-photo-input" title="Change photo">
        ${iconCamera(15)}
        <input type="file" id="hero-photo-input" accept="image/*">
      </label>
      <div class="recipe-actions-top">
        <button class="icon-btn" id="recipe-home" aria-label="Home">${iconHome(17)}</button>
        <button class="icon-btn ${recipe.favourite ? 'icon-btn--starred' : ''}" id="recipe-star" aria-label="${recipe.favourite ? 'Unfavourite' : 'Favourite'}">${recipe.favourite ? iconStarFilled(17) : iconStar(17)}</button>
        <button class="icon-btn" id="recipe-edit" aria-label="Edit recipe">${iconEdit()}</button>
        <button class="icon-btn" id="recipe-delete" aria-label="Delete recipe">${iconTrash()}</button>
      </div>
    </div>

    <div class="recipe-body">
      <div class="recipe-title-row">
        <h1 class="recipe-detail-title">${escHtml(recipe.title)}</h1>
      </div>
      <div class="recipe-meta-row">
        <span class="cat-badge">${catObj?.icon || ''} ${catObj?.label || recipe.category}</span>
      </div>

      <div class="divider"></div>

      <p class="section-label">Ingredients</p>
      <ul class="ingredients-list">
        ${(recipe.ingredients || []).map(i => `<li>${escHtml(i)}</li>`).join('')}
      </ul>

      <div class="divider"></div>

      <p class="section-label">Method</p>
      <div class="method-steps">
        ${(recipe.method || []).map((step, i) => `
          <div class="method-step">
            <div class="step-num">${i + 1}</div>
            <div class="step-text">${escHtml(step)}</div>
          </div>`).join('')}
      </div>

      <div class="export-row">
        <button class="btn btn-secondary btn-sm" id="export-txt">${iconDownload(15)} Text</button>
        <button class="btn btn-secondary btn-sm" id="export-pdf">${iconDownload(15)} PDF</button>
      </div>
    </div>
  `;

  const el = document.getElementById('view-recipe');
  el.querySelector('#recipe-back')?.addEventListener('click', goBack);
  el.querySelector('#recipe-home')?.addEventListener('click', goHome);
  el.querySelector('#recipe-star')?.addEventListener('click', () => {
    toggleFavourite(recipe.id);
    renderRecipe(); // re-render to update star state
  });
  el.querySelector('#recipe-edit')?.addEventListener('click', () => navigate('add', { editingId: recipe.id }));
  el.querySelector('#recipe-delete')?.addEventListener('click', () => confirmDelete(recipe.id));
  el.querySelector('#export-txt')?.addEventListener('click', () => exportText(recipe));
  el.querySelector('#export-pdf')?.addEventListener('click', () => exportPDF(recipe));

  // Tap hero photo to change it
  el.querySelector('#hero-photo-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      recipe.image = ev.target.result;
      recipe.updatedAt = Date.now();
      saveRecipes();
      renderRecipe();
      showToast('Photo updated ✓');
    };
    reader.readAsDataURL(file);
  });
}

// ── Add / Edit Recipe ──

function renderAdd() {
  const editing  = state.editingId ? getRecipe(state.editingId) : null;
  const title    = editing ? 'Edit Recipe' : 'New Recipe';
  state.pendingImage = null;

  document.getElementById('view-add').innerHTML = `
    <div class="form-header">
      <button class="back-btn" id="add-back" aria-label="Cancel">${iconX(18)}</button>
      <h2>${title}</h2>
      <button class="home-btn" id="add-home" aria-label="Home">${iconHome(18)}</button>
    </div>

    <div class="form-body">

      <!-- URL Import (only shown when adding, not editing) -->
      ${!editing ? `
      <div class="url-import-panel">
        <p class="form-label" style="padding:0 0 8px">Import from a URL</p>
        <div class="url-input-row">
          <input id="import-url-input" class="form-input" type="url"
                 placeholder="Paste a recipe link here…"
                 autocomplete="off" autocorrect="off" spellcheck="false">
          <button class="btn-fetch" id="import-fetch-btn" type="button">
            ${iconArrowRight(16)}
          </button>
        </div>
        <div class="import-status hidden" id="import-status"></div>
        <div class="photo-found-preview" id="photo-found-wrap">
          <img class="photo-found-thumb" id="photo-found-thumb" src="" alt="Recipe photo">
          <div class="photo-found-info" id="photo-found-info"></div>
        </div>
      </div>

      <div class="url-import-panel" style="background:var(--surface)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 0 8px">
          <p class="form-label" style="padding:0;margin:0">Paste recipe text here</p>
          <button class="live-text-help-btn" id="live-text-help" type="button" title="How to use Live Text">
            ${iconCamera(16)} How?
          </button>
        </div>
        <textarea id="paste-recipe-input" class="form-input tall"
                  placeholder="Paste the full recipe text here…"
                  style="min-height:160px;font-size:14px"></textarea>
        <button class="btn btn-secondary btn-full" id="parse-paste-btn" type="button" style="margin-top:8px">
          Parse into ingredients &amp; method
        </button>
        <div class="import-status hidden" id="paste-status"></div>
      </div>

      <div class="import-divider"><span>or fill in manually</span></div>
      ` : ''}

      <div class="form-group">
        <label class="form-label" for="f-title">Recipe Title *</label>
        <input id="f-title" class="form-input" type="text" placeholder="e.g. Chicken Tikka Masala"
               value="${escHtml(editing?.title || '')}" autocomplete="off">
      </div>

      <div class="form-group">
        <label class="form-label" for="f-category">Category *</label>
        <select id="f-category" class="form-select">
          ${CATEGORIES.map(c => `
            <option value="${c.id}" ${(editing?.category ?? 'other') === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Photo (optional)</label>
        <div id="image-area">
          ${editing?.image
            ? `<div class="image-preview-wrap">
                 <img class="image-preview" id="preview-img" src="${escHtml(editing.image)}" alt="Preview">
                 <button class="image-preview-remove" id="remove-img" aria-label="Remove image">✕</button>
               </div>`
            : uploadAreaHTML()}
        </div>
        <p class="form-hint">Or paste an image URL below</p>
        <input id="f-image-url" class="form-input" type="url" placeholder="https://…"
               value="${escHtml(editing?.image && !editing.image.startsWith('data:') ? editing.image : '')}">
      </div>

      <div class="form-group">
        <label class="form-label" for="f-ingredients">Ingredients *</label>
        <textarea id="f-ingredients" class="form-input tall"
                  placeholder="One ingredient per line, e.g.&#10;400g spaghetti&#10;500g beef mince&#10;1 onion, diced">${escHtml((editing?.ingredients || []).join('\n'))}</textarea>
        <p class="form-hint">Enter one ingredient per line</p>
      </div>

      <div class="form-group">
        <label class="form-label" for="f-method">Method *</label>
        <textarea id="f-method" class="form-input tall"
                  placeholder="One step per line, e.g.&#10;Heat oil in a large pan over medium heat.&#10;Add onion and cook for 5 minutes.&#10;…">${escHtml((editing?.method || []).join('\n'))}</textarea>
        <p class="form-hint">Enter one step per line</p>
      </div>

    </div>

    <div class="form-submit-row">
      <button class="btn btn-primary btn-full" id="form-submit">
        ${editing ? `${iconCheck(18)} Save Changes` : `${iconPlus(18)} Add Recipe`}
      </button>
    </div>
  `;

  bindAddEvents(editing);
}

function uploadAreaHTML() {
  return `
    <label class="image-upload-area" for="f-image-file" id="upload-label">
      <input id="f-image-file" type="file" accept="image/*">
      <div class="upload-icon">📷</div>
      <div class="upload-label">Tap to choose a photo</div>
      <div class="upload-hint">JPG, PNG or WebP</div>
    </label>`;
}

function bindAddEvents(editing) {
  document.getElementById('add-back')?.addEventListener('click', () => {
    goBack();
  });
  document.getElementById('add-home')?.addEventListener('click', goHome);

  // URL import
  document.getElementById('import-fetch-btn')?.addEventListener('click', importFromURL);
  document.getElementById('import-url-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); importFromURL(); }
  });

  // Live Text help sheet
  document.getElementById('live-text-help')?.addEventListener('click', () => {
    const el = document.createElement('div');
    el.id = 'live-text-sheet';
    el.innerHTML = `
      <div class="cat-editor-backdrop"></div>
      <div class="cat-editor-sheet">
        <div class="cat-editor-handle"></div>
        <h3 class="cat-editor-title">${iconCamera(18)} Copying text from a recipe</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Use whichever tool suits your recipe best, then paste the text into the box.</p>

        <p class="form-label" style="padding:0 0 6px">Option 1 — Live Text (iPhone camera)</p>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Best for: clean printed recipes in good lighting.</p>
        <ol class="live-text-steps" style="margin-bottom:16px">
          <li><span>Open the <strong>Camera</strong> app on your iPhone.</span></li>
          <li><span>Point it at the recipe. Tap the <strong>Live Text icon</strong> (bottom right — lines of text in a box).</span></li>
          <li><span>Tap <strong>Select All</strong>, then <strong>Copy</strong>.</span></li>
          <li><span>Come back here and <strong>paste</strong> into the box above.</span></li>
        </ol>

        <p class="form-label" style="padding:0 0 6px">Option 2 — Google Lens</p>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Best for: handwriting, low light, angled or blurry photos, and decorative fonts.</p>
        <ol class="live-text-steps" style="margin-bottom:16px">
          <li><span>Open the <strong>Google</strong> app (or Google Lens) on your iPhone.</span></li>
          <li><span>Tap the <strong>Lens</strong> icon and point it at the recipe.</span></li>
          <li><span>Tap <strong>Text</strong> at the bottom, then <strong>Select All</strong> and <strong>Copy</strong>.</span></li>
          <li><span>Come back here and <strong>paste</strong> into the box above.</span></li>
        </ol>

        <button class="btn btn-primary btn-full" id="live-text-close">Got it</button>
      </div>`;
    document.getElementById('app').appendChild(el);
    requestAnimationFrame(() => el.querySelector('.cat-editor-sheet').classList.add('open'));
    const close = () => {
      el.querySelector('.cat-editor-sheet').classList.remove('open');
      setTimeout(() => el.remove(), 280);
    };
    el.querySelector('.cat-editor-backdrop').addEventListener('click', close);
    el.querySelector('#live-text-close').addEventListener('click', close);
  });

  // Paste-and-parse
  document.getElementById('parse-paste-btn')?.addEventListener('click', () => {
    const text = document.getElementById('paste-recipe-input')?.value || '';
    const statusEl = document.getElementById('paste-status');
    const show = (type, msg) => {
      if (!statusEl) return;
      statusEl.className = `import-status ${type}`;
      statusEl.innerHTML = `${type === 'success' ? '✓' : '✕'}<span>${escHtml(msg)}</span>`;
    };
    if (!text.trim()) { show('error', 'Paste some recipe text first.'); return; }
    const parsed = parseOCRText(text);
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    // Title is left for the user to fill in — auto-extracted titles from pasted text are unreliable
    setVal('f-ingredients', convertToMetric(parsed.ingredients.join('\n')));
    setVal('f-method',      convertToMetric(parsed.method.join('\n')));
    const catEl2 = document.getElementById('f-category');
    if (catEl2) catEl2.value = guessCategoryFromTitle(parsed.title) || guessCategoryFromTitle(text) || 'other';
    const count = `${parsed.ingredients.length} ingredient${parsed.ingredients.length !== 1 ? 's' : ''}` +
                  (parsed.method.length ? `, ${parsed.method.length} step${parsed.method.length !== 1 ? 's' : ''}` : '');
    show('success', parsed.ingredients.length
      ? `Parsed ${count}. Review and edit below.`
      : 'Text parsed — check the fields below and fill in anything missing.');
  });

  // File upload
  const fileInput = document.getElementById('f-image-file');
  fileInput?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.pendingImage = ev.target.result;
      document.getElementById('image-area').innerHTML = `
        <div class="image-preview-wrap">
          <img class="image-preview" id="preview-img" src="${ev.target.result}" alt="Preview">
          <button class="image-preview-remove" id="remove-img" aria-label="Remove image">✕</button>
        </div>`;
      document.getElementById('remove-img')?.addEventListener('click', clearImagePreview);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('remove-img')?.addEventListener('click', clearImagePreview);

  // Submit
  document.getElementById('form-submit')?.addEventListener('click', () => submitRecipe(editing));
}

function clearImagePreview() {
  state.pendingImage = null;
  document.getElementById('image-area').innerHTML = uploadAreaHTML();
  document.getElementById('f-image-url').value = '';
  const fi = document.getElementById('f-image-file');
  if (fi) fi.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.pendingImage = ev.target.result;
      document.getElementById('image-area').innerHTML = `
        <div class="image-preview-wrap">
          <img class="image-preview" src="${ev.target.result}" alt="Preview">
          <button class="image-preview-remove" id="remove-img" aria-label="Remove">✕</button>
        </div>`;
      document.getElementById('remove-img')?.addEventListener('click', clearImagePreview);
    };
    reader.readAsDataURL(file);
  });
}

function submitRecipe(editing) {
  const titleEl  = document.getElementById('f-title');
  const catEl    = document.getElementById('f-category');
  const ingEl    = document.getElementById('f-ingredients');
  const methEl   = document.getElementById('f-method');
  const imgUrlEl = document.getElementById('f-image-url');

  const title = titleEl?.value.trim();
  if (!title) { titleEl?.focus(); showToast('Please enter a recipe title'); return; }

  const ingredients = (ingEl?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!ingredients.length) { ingEl?.focus(); showToast('Please enter at least one ingredient'); return; }

  const method = (methEl?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!method.length) { methEl?.focus(); showToast('Please enter the method'); return; }

  const image = state.pendingImage || imgUrlEl?.value.trim() || (editing?.image || '');

  const recipe = {
    id:          editing?.id || `r-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    category:    catEl?.value || 'other',
    ingredients,
    method,
    image,
    createdAt:   editing?.createdAt || Date.now(),
    updatedAt:   Date.now(),
  };

  saveRecipe(recipe);
  showToast(editing ? 'Recipe updated ✓' : 'Recipe added ✓');
  navigate('recipe', { recipeId: recipe.id });
}

// ── Delete ─────────────────────────────────────────────────────────────────

function confirmDelete(id) {
  const recipe = getRecipe(id);
  if (!recipe) return;
  if (!confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
  deleteRecipe(id);
  showToast('Recipe deleted');
  state.currentRecipeId = null;
  goHome();
}

// ── URL Import ─────────────────────────────────────────────────────────────

const CORS_PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchHTML(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 500) return text; // sanity check
      }
    } catch { /* try next proxy */ }
  }
  throw new Error('Could not fetch the page. Check the URL and try again.');
}

function findRecipeJSONLD(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      let data = JSON.parse(script.textContent.trim());
      // Unwrap arrays or @graph
      const candidates = [];
      if (Array.isArray(data)) candidates.push(...data);
      else if (data['@graph']) candidates.push(...data['@graph']);
      else candidates.push(data);

      for (const item of candidates) {
        const types = [].concat(item['@type'] || []);
        if (types.some(t => String(t).toLowerCase().includes('recipe'))) return item;
      }
    } catch { /* malformed JSON-LD, skip */ }
  }
  return null;
}

function extractIngredients(data) {
  return (data.recipeIngredient || [])
    .map(s => String(s).trim())
    .filter(Boolean);
}

function extractMethod(data) {
  const raw = data.recipeInstructions || [];
  const steps = [];

  const addStep = item => {
    if (!item) return;
    if (typeof item === 'string') { steps.push(item.trim()); return; }
    if (item['@type'] === 'HowToSection') {
      (item.itemListElement || []).forEach(addStep);
      return;
    }
    const text = (item.text || item.name || '').trim();
    if (text) steps.push(text);
  };

  if (Array.isArray(raw)) raw.forEach(addStep);
  else if (typeof raw === 'string') raw.split(/\n+/).forEach(s => s.trim() && steps.push(s.trim()));

  return steps.filter(Boolean);
}

function extractImage(data, doc) {
  // 1. JSON-LD image field
  let img = data?.image;
  if (img) {
    if (typeof img === 'string') return img;
    if (Array.isArray(img)) img = img[0];
    if (img?.url) return img.url;
    if (typeof img === 'string') return img;
  }
  // 2. og:image meta tag
  const og = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (og && og.startsWith('http')) return og;
  // 3. twitter:image
  const tw = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (tw && tw.startsWith('http')) return tw;
  // 4. First large img tag with an absolute URL (skip icons, logos, avatars)
  const imgs = [...doc.querySelectorAll('img[src]')];
  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (!src || !src.startsWith('http')) continue;
    // Skip tiny images likely to be icons/logos
    const w = parseInt(img.getAttribute('width') || img.getAttribute('data-width') || '0');
    const h = parseInt(img.getAttribute('height') || img.getAttribute('data-height') || '0');
    if ((w && w < 200) || (h && h < 150)) continue;
    // Skip anything that looks like a logo, icon, avatar, or ad
    if (/logo|icon|avatar|sprite|banner|badge|pixel|tracking|ad[_\-]|svg/i.test(src)) continue;
    return src;
  }
  return '';
}

function scrapeHTMLRecipe(doc) {
  const ingRe  = /ingredient/i;
  const methRe = /method|instruction|direction|step|how to/i;

  // Find all headings, then collect list items that follow each heading
  const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];

  let ingredients = [], method = [];

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const text = h.textContent.trim();
    const isIng  = ingRe.test(text);
    const isMeth = methRe.test(text);
    if (!isIng && !isMeth) continue;

    // Collect sibling/descendant list items until next heading of same or higher level
    const items = [];
    let el = h.nextElementSibling;
    while (el) {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) break; // stop at next heading
      // Grab li items inside this element
      const lis = [...el.querySelectorAll('li')];
      if (lis.length) {
        lis.forEach(li => { const t = li.textContent.trim(); if (t) items.push(t); });
      } else if (['p','div','span'].includes(tag)) {
        const t = el.textContent.trim();
        if (t) items.push(t);
      }
      el = el.nextElementSibling;
    }

    if (isIng  && !ingredients.length) ingredients = items;
    if (isMeth && !method.length)      method      = items;
  }

  return { ingredients, method };
}

// ── Category Photo Customisation ───────────────────────────────────────────

const CAT_PHOTOS_KEY = 'cat_photos_v1';
let catEditMode = false;

function getCatPhotos() {
  try { return JSON.parse(localStorage.getItem(CAT_PHOTOS_KEY)) || {}; } catch { return {}; }
}
function setCatPhoto(catId, url) {
  const p = getCatPhotos(); p[catId] = url;
  localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(p));
}
function catPhotoFor(cat) {
  return getCatPhotos()[cat.id] || cat.img;
}

function showCatPhotoEditor(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById('cat-editor')?.remove();

  const el = document.createElement('div');
  el.id = 'cat-editor';
  el.innerHTML = `
    <div class="cat-editor-backdrop"></div>
    <div class="cat-editor-sheet">
      <div class="cat-editor-handle"></div>
      <h3 class="cat-editor-title">${cat.icon} ${cat.label} — Change Photo</h3>
      <img class="cat-editor-preview" id="cat-preview-img"
           src="${escHtml(catPhotoFor(cat))}" alt="preview">
      <label class="btn btn-secondary btn-full" for="cat-file-input" style="margin-top:4px">
        📷 Choose from library
        <input type="file" id="cat-file-input" accept="image/*" style="display:none">
      </label>
      <div class="form-group" style="margin-top:12px">
        <label class="form-label" for="cat-url-input">Or paste an image URL</label>
        <input type="url" id="cat-url-input" class="form-input"
               placeholder="https://…"
               value="${escHtml(!catPhotoFor(cat).startsWith('data:') ? catPhotoFor(cat) : '')}">
      </div>
      <div class="cat-editor-btns">
        <button class="btn btn-secondary" id="cat-cancel">Cancel</button>
        <button class="btn btn-primary"   id="cat-save">Save</button>
      </div>
    </div>`;

  document.getElementById('app').appendChild(el);
  requestAnimationFrame(() => el.querySelector('.cat-editor-sheet').classList.add('open'));

  const close = () => {
    el.querySelector('.cat-editor-sheet').classList.remove('open');
    setTimeout(() => el.remove(), 280);
  };

  el.querySelector('.cat-editor-backdrop').addEventListener('click', close);
  el.querySelector('#cat-cancel').addEventListener('click', close);

  el.querySelector('#cat-file-input').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      el.querySelector('#cat-preview-img').src = ev.target.result;
      el.querySelector('#cat-url-input').value = '';
    };
    reader.readAsDataURL(file);
  });

  el.querySelector('#cat-url-input').addEventListener('input', e => {
    const v = e.target.value.trim();
    if (v) el.querySelector('#cat-preview-img').src = v;
  });

  el.querySelector('#cat-save').addEventListener('click', () => {
    const urlVal  = el.querySelector('#cat-url-input').value.trim();
    const preview = el.querySelector('#cat-preview-img').src;
    const finalUrl = urlVal || preview;
    if (finalUrl) { setCatPhoto(catId, finalUrl); renderHome(); }
    close();
  });
}

// ── Curated pools of verified-working Unsplash photo IDs, organised by category.
// Each ID was confirmed 200 OK before inclusion.
const PHOTO_POOLS = {
  'pasta':       ['1621996346565-e3dbc646d9a9', '1556761223-4c4282c73f77', '1580959375944-abd7e991f971'],
  'soups':       ['1547592180-85f173990554', '1569959220744-ff553533f492'],
  'chicken':     ['1569050467447-ce54b3bbc37d', '1432139509613-5c4255815697', '1585937421612-70a008356fbe'],
  'meat':        ['1529692236671-f1f6cf9683ba', '1546069901-ba9599a7e63c', '1568901346375-23c9450c58cd', '1414235077428-338989a2e8c0'],
  'light-meals': ['1525351484163-7529414344d8', '1565299624946-b28f40a0ae38', '1560717845-968823efbee1', '1533089860892-a7c6f0a88666'],
  'desserts':    ['1488477181946-6428a0291777', '1550617931-e17a7b70dce2'],
  'seafood':     ['1565680018434-b513d5e5fd47', '1559742472-3b8a5f8a5f8a'],
  'other':       ['1504674900247-0877df9cc836', '1565299585323-38d6b0865b47'],
};

function categoryPhoto(recipe) {
  const pool = PHOTO_POOLS[recipe.category] || PHOTO_POOLS['other'];
  // Deterministic pick: hash the recipe title so each recipe always gets the same photo
  let hash = 0;
  for (const ch of recipe.title) hash = (hash * 31 + ch.charCodeAt(0)) & 0xFFFF;
  const id = pool[hash % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=800&fit=crop&q=80`;
}

function unsplashFallback(title, category = 'other') {
  // Kept for URL-import fallback; delegates to verified pool
  return categoryPhoto({ title, category });
}

async function importFromURL() {
  const urlInput  = document.getElementById('import-url-input');
  const fetchBtn  = document.getElementById('import-fetch-btn');
  const statusEl  = document.getElementById('import-status');
  const photoWrap = document.getElementById('photo-found-wrap');

  const url = urlInput?.value.trim();
  if (!url) { urlInput?.focus(); return; }

  // Validate URL roughly
  try { new URL(url); } catch {
    showImportStatus('error', 'That doesn\'t look like a valid URL.');
    return;
  }

  fetchBtn.disabled = true;
  showImportStatus('loading', 'Fetching recipe…');
  photoWrap?.classList.remove('visible');

  try {
    const html   = await fetchHTML(url);
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const ld     = findRecipeJSONLD(doc);

    let title       = '';
    let ingredients = [];
    let method      = [];
    let image       = '';

    if (ld) {
      title       = (ld.name || '').trim();
      ingredients = extractIngredients(ld);
      method      = extractMethod(ld);
      image       = extractImage(ld, doc);
    } else {
      // Fallback: scrape title, image, and try to extract ingredients/method from plain HTML
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
            || doc.querySelector('h1')?.textContent?.trim()
            || doc.querySelector('title')?.textContent?.trim()
            || '';
      image = extractImage(null, doc);
      ({ ingredients, method } = scrapeHTMLRecipe(doc));
    }

    if (!title && !ingredients.length) {
      showImportStatus('error', 'No recipe found on this page. Try a different URL, or add the recipe manually below.');
      fetchBtn.disabled = false;
      return;
    }

    // Auto-pick category from title keywords
    const guessedCat = guessCategoryFromTitle(title);

    // Only use a photo if one was actually found on the page — don't guess from Unsplash

    // Populate form fields — always set, even if empty, so stale values are cleared
    const setField = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    setField('f-title',       title);
    setField('f-ingredients', convertToMetric(ingredients.join('\n')));
    setField('f-method',      convertToMetric(method.join('\n')));
    setField('f-image-url',   image);
    const catEl = document.getElementById('f-category');
    if (catEl) catEl.value = guessedCat || 'other';

    // Scroll the form fields into view so the user can see them
    document.getElementById('f-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show photo preview only when an image was actually found on the page
    if (image && image.startsWith('http') && photoWrap) {
      const thumb = document.getElementById('photo-found-thumb');
      const info  = document.getElementById('photo-found-info');
      if (thumb) thumb.src = image;
      if (info)  info.innerHTML = `<strong>Photo found</strong>You can change this below`;
      photoWrap.classList.add('visible');
    }

    const count = ingredients.length
      ? `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''}, ${method.length} step${method.length !== 1 ? 's' : ''} extracted.`
      : '';

    if (!ingredients.length) {
      showImportStatus('warning', `Title found but couldn't read the recipe content — this site loads dynamically. Copy the recipe text from your browser and paste it in the box below.`);
    } else {
      showImportStatus('success', `Recipe found! ${count} Review and edit below.`);
    }

  } catch (err) {
    showImportStatus('error', err.message || 'Something went wrong. Try again or add manually.');
  } finally {
    fetchBtn.disabled = false;
  }
}

function showImportStatus(type, msg) {
  const el = document.getElementById('import-status');
  if (!el) return;
  el.className = `import-status ${type}`;
  const icons = { loading: '<div class="spinner"></div>', success: '✓', error: '✕' };
  el.innerHTML = `${icons[type] || ''}<span>${escHtml(msg)}</span>`;
}

function guessCategoryFromTitle(title) {
  const t = title.toLowerCase();
  if (/pasta|spaghetti|linguine|fettuccine|penne|rigatoni|lasagne|lasagna|ravioli|gnocchi|macaroni|noodle|carbonara|bolognese|alfredo/.test(t)) return 'pasta';
  if (/soup|broth|chowder|bisque|stock|minestrone|ramen|pho/.test(t)) return 'soups';
  if (/chicken|schnitzel|poultry|rotisserie|tikka|butter chicken/.test(t)) return 'chicken';
  if (/beef|lamb|pork|steak|mince|sausage|meat|roast|curry|taco|nacho|pie|casserole|stew|brisket|meatball|veal|venison|pulled|brisket|rissole|patty|burger|meatloaf|chop|rib|kebab|schnitz/.test(t)) return 'meat';
  if (/cake|cookie|biscuit|brownie|slice|pudding|tart|muffin|scone|pikelet|pancake|dessert|chocolate|sweet|fudge|cheesecake|tiramisu|mousse|crumble|custard|ice cream|gelato|sorbet|waffle|doughnut|donut|slice/.test(t)) return 'desserts';
  if (/fish|salmon|tuna|prawn|shrimp|seafood|mussel|oyster|crab|lobster|calamari|squid|scallop|barramundi|cod|snapper|trout|anchovy|sardine|octopus/.test(t)) return 'seafood';
  if (/salad|wrap|sandwich|toast|fritter|quiche|pizza|rice|fried rice|omelette|omelette|frittata|egg|eggs|scramble|poach|veggie|vegetable|vegetarian|vegan|lentil|bean|tofu|falafel|hummus|tabbouleh|stuffed|zucchini|pumpkin|corn|mushroom/.test(t)) return 'light-meals';
  return '';
}

// ── Imperial to Metric conversion ─────────────────────────────────────────

function convertToMetric(text) {
  return text
    // °F → °C (round to nearest 5 for oven temps)
    .replace(/(\d+(?:\.\d+)?)\s*°?\s*F\b/g, (_, f) => {
      const c = Math.round(((parseFloat(f) - 32) * 5 / 9) / 5) * 5;
      return `${c}°C`;
    })
    // oz → g (1 oz = 28g)
    .replace(/(\d+(?:\.\d+)?)\s*oz\b/gi, (_, n) => `${Math.round(parseFloat(n) * 28)}g`)
    // lbs / pounds → kg (1 lb = 0.45kg), show as g if under 1kg
    .replace(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?)\b/gi, (_, n) => {
      const g = Math.round(parseFloat(n) * 450);
      return g >= 1000 ? `${(g / 1000).toFixed(1).replace(/\.0$/, '')}kg` : `${g}g`;
    })
    // inches → cm (1 inch = 2.54cm)
    .replace(/(\d+(?:\.\d+)?)\s*(inch(?:es)?|")\b/gi, (_, n) => `${Math.round(parseFloat(n) * 2.54)}cm`)
    // fluid oz → ml (1 fl oz = 30ml)
    .replace(/(\d+(?:\.\d+)?)\s*fl\.?\s*oz\b/gi, (_, n) => `${Math.round(parseFloat(n) * 30)}ml`);
}

// ── Paste & Parse ──────────────────────────────────────────────────────────

function parseOCRText(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Headers match loosely — allow trailing colon, extra words, ALL CAPS
  const ingHeader  = l => /^(ingredients?|what you.?ll need|you.?ll need)\b/i.test(l);
  const methHeader = l => /^(method|instructions?|directions?|steps?|how to( make)?|preparation|to (make|cook|prepare))\b/i.test(l);

  const looksLikeIngredient = l =>
    /^[\d½¼¾⅓⅔]/.test(l) ||
    /^\d+\s*(cup|tsp|tbsp|g|kg|ml|l|oz|lb|clove|bunch|can|tin|slice|piece)/i.test(l) ||
    /^(a |an )\w/.test(l) ||
    /\b(cup|tsp|tbsp|tablespoon|teaspoon|gram|kg|ml|litre|liter|oz|pound|lb|clove|bunch|can|tin)\b/i.test(l);

  // Numbered step: "1." "1)" "Step 1" "Step 1:" or long sentence (30+ chars, likely a method step)
  const looksLikeStep = l =>
    /^\d+[\.\)]\s/.test(l) ||
    /^step\s*\d+/i.test(l) ||
    (l.length > 35 && /[,.]/.test(l));

  const stripNum = l => l.replace(/^(step\s*\d+[:\.\s]*|\d+[\.\)]\s*)/i, '').trim();

  let title = [], ingredients = [], method = [], section = 'title';

  for (const line of lines) {
    if (ingHeader(line))  { section = 'ingredients'; continue; }
    if (methHeader(line)) { section = 'method';      continue; }

    if (section === 'title') {
      if (looksLikeIngredient(line))  { section = 'ingredients'; ingredients.push(line); }
      else if (looksLikeStep(line))   { section = 'method'; method.push(stripNum(line)); }
      else                            { title.push(line); }
    } else if (section === 'ingredients') {
      if (looksLikeStep(line))        { section = 'method'; method.push(stripNum(line)); }
      else                            { ingredients.push(line); }
    } else {
      method.push(stripNum(line));
    }
  }

  return {
    title:       title.slice(0, 2).join(' ').trim(),
    ingredients,
    method,
  };
}


// ── Backup: Export & Import all recipes ────────────────────────────────────

function recipeToMarkdown(recipe) {
  const catObj = CATEGORIES.find(c => c.id === recipe.category);
  const lines = [
    recipe.title,
    `Category: ${catObj?.label || recipe.category}`,
    '',
    'INGREDIENTS:',
    ...(recipe.ingredients || []).map(i => `• ${i}`),
    '',
    'METHOD:',
    ...(recipe.method || []).map((s, i) => `${i + 1}. ${s}`),
    '',
    `Exported from My Recipes on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  ];
  return lines.join('\n');
}

async function exportAllRecipes() {
  const date = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

  // Always download the JSON backup first
  const data = { exportedAt: new Date().toISOString(), recipes: state.recipes, catPhotos: getCatPhotos() };
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const jsonUrl  = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = `my-recipes-backup-${date}.json`;
  jsonLink.click();
  URL.revokeObjectURL(jsonUrl);

  // Then generate the Markdown zip using JSZip
  try {
    if (!window.JSZip) {
      await loadJSZip();
    }
    const zip = new JSZip();
    const folder = zip.folder('My Recipes');
    for (const recipe of state.recipes) {
      const filename = recipe.title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') + '.txt';
      folder.file(filename, recipeToMarkdown(recipe));
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl  = URL.createObjectURL(zipBlob);
    const zipLink = document.createElement('a');
    zipLink.href = zipUrl;
    zipLink.download = `my-recipes-export-${date}.zip`;
    zipLink.click();
    URL.revokeObjectURL(zipUrl);
    showToast(`${state.recipes.length} recipes exported ✓`);
  } catch (err) {
    console.error('Zip export failed:', err);
    showToast(`${state.recipes.length} recipes exported (JSON only — zip failed)`);
  }
}

function loadJSZip() {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function importAllRecipes(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const incoming = Array.isArray(data) ? data : (data.recipes || []);
      if (!incoming.length) { showToast('No recipes found in file'); return; }

      // Ask whether to merge or replace
      const el = document.createElement('div');
      el.id = 'import-choice-sheet';
      el.innerHTML = `
        <div class="cat-editor-backdrop"></div>
        <div class="cat-editor-sheet">
          <div class="cat-editor-handle"></div>
          <h3 class="cat-editor-title">Import ${incoming.length} recipes</h3>
          <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">
            How would you like to import?
          </p>
          <button class="btn btn-secondary btn-full" id="import-merge" style="margin-bottom:10px">
            Merge — add new recipes, keep existing
          </button>
          <button class="btn btn-primary btn-full" id="import-replace">
            Replace all — wipe existing and import fresh
          </button>
          <button class="btn btn-secondary btn-full" id="import-cancel" style="margin-top:10px">
            Cancel
          </button>
        </div>`;
      document.getElementById('app').appendChild(el);
      requestAnimationFrame(() => el.querySelector('.cat-editor-sheet').classList.add('open'));

      const close = () => {
        el.querySelector('.cat-editor-sheet').classList.remove('open');
        setTimeout(() => el.remove(), 280);
      };

      el.querySelector('.cat-editor-backdrop').addEventListener('click', close);
      el.querySelector('#import-cancel').addEventListener('click', close);

      el.querySelector('#import-merge').addEventListener('click', () => {
        close();
        let added = 0;
        for (const recipe of incoming) {
          if (!state.recipes.find(r => r.id === recipe.id)) {
            state.recipes.push(recipe);
            added++;
          }
        }
        if (data.catPhotos) localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(data.catPhotos));
        saveRecipes();
        renderHome();
        showToast(`${added} recipes imported ✓`);
      });

      el.querySelector('#import-replace').addEventListener('click', () => {
        close();
        if (!confirm(`This will delete all ${state.recipes.length} existing recipes and replace with the ${incoming.length} from the backup. Are you sure?`)) return;
        state.recipes = incoming;
        if (data.catPhotos) localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(data.catPhotos));
        saveRecipes();
        renderHome();
        showToast(`${incoming.length} recipes imported ✓`);
      });

    } catch {
      showToast('Could not read file — is it a valid backup?');
    }
  };
  reader.readAsText(file);
}

// ── Export ─────────────────────────────────────────────────────────────────

function exportText(recipe) {
  const catObj = CATEGORIES.find(c => c.id === recipe.category);
  const lines = [
    recipe.title,
    `Category: ${catObj?.label || recipe.category}`,
    '',
    'INGREDIENTS:',
    ...recipe.ingredients.map(i => `• ${i}`),
    '',
    'METHOD:',
    ...recipe.method.map((s, i) => `${i + 1}. ${s}`),
    '',
    `Exported from My Recipes on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as text file');
}

function exportPDF(recipe) {
  const catObj = CATEGORIES.find(c => c.id === recipe.category);
  const win = window.open('', '_blank');
  if (!win) { showToast('Allow pop-ups to export PDF'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escHtml(recipe.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 680px; margin: 48px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 32px; font-weight: 700; margin-bottom: 6px; }
  .meta { font-size: 14px; color: #888; margin-bottom: 32px; letter-spacing: 0.5px; text-transform: uppercase; }
  h2 { font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin: 28px 0 16px; }
  ul { list-style: none; }
  ul li { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; }
  ul li::before { content: '•'; color: #f59e0b; font-weight: 700; margin-right: 10px; }
  ol { list-style: none; counter-reset: steps; }
  ol li { counter-increment: steps; display: flex; gap: 14px; margin-bottom: 14px; font-size: 15px; }
  ol li::before { content: counter(steps); background: #f59e0b; color: #fff; font-size: 12px; font-weight: 700; font-family: sans-serif; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .footer { margin-top: 48px; font-size: 12px; color: #ccc; border-top: 1px solid #f0f0f0; padding-top: 16px; }
  img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; margin-bottom: 28px; }
  @media print { body { margin: 24px; } @page { margin: 1.5cm; } }
</style>
</head>
<body>
${recipe.image ? `<img src="${escHtml(recipe.image)}" alt="${escHtml(recipe.title)}">` : ''}
<h1>${escHtml(recipe.title)}</h1>
<p class="meta">${escHtml(catObj?.label || recipe.category)}</p>
<h2>Ingredients</h2>
<ul>${recipe.ingredients.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>
<h2>Method</h2>
<ol>${recipe.method.map(s => `<li><span>${escHtml(s)}</span></li>`).join('')}</ol>
<p class="footer">Exported from My Recipes · ${new Date().toLocaleDateString('en-AU', {day:'numeric',month:'long',year:'numeric'})}</p>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
  win.document.close();
}

// ── Swipe to go back ───────────────────────────────────────────────────────

function initSwipeGesture() {
  let startX = 0, startY = 0;
  const EDGE = 40;   // px from left edge to start swipe
  const MIN  = 72;   // min horizontal distance to trigger

  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (state.view === 'home') return; // nothing to go back to
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (startX < EDGE && dx > MIN && dy < 80) goBack();
  }, { passive: true });
}

// ── Card HTML helpers ──────────────────────────────────────────────────────

function recipeCardHTML(r) {
  const catObj = CATEGORIES.find(c => c.id === r.category);
  const hasImg = r.image && r.image.trim();
  return `
    <div class="recipe-card" data-id="${r.id}">
      ${hasImg
        ? `<img class="recipe-card-thumb" src="${escHtml(r.image)}" alt="${escHtml(r.title)}"
               onerror="this.className='recipe-card-thumb placeholder';this.textContent='${catObj?.icon||'🍴'}';">`
        : `<div class="recipe-card-thumb placeholder">${catObj?.icon || '🍴'}</div>`}
      <div class="recipe-card-info">
        <div class="recipe-card-title">${escHtml(r.title)}</div>
        <div class="recipe-card-meta">
          <span class="cat-badge">${catObj?.icon || ''} ${catObj?.label || r.category}</span>
          ${r.favourite ? `<span class="star-badge">${iconStarFilled(12)}</span>` : ''}
        </div>
      </div>
      <span class="recipe-card-arrow">${iconChevronRight()}</span>
    </div>`;
}

function browseCardHTML(r) {
  const catObj = CATEGORIES.find(c => c.id === r.category);
  const hasImg = r.image && r.image.trim();
  return `
    <div class="browse-recipe-card" data-id="${r.id}">
      ${hasImg
        ? `<img class="browse-recipe-thumb" src="${escHtml(r.image)}" alt="${escHtml(r.title)}"
               onerror="this.className='browse-recipe-thumb placeholder';this.textContent='${catObj?.icon||'🍴'}';">`
        : `<div class="browse-recipe-thumb placeholder">${catObj?.icon || '🍴'}</div>`}
      <div class="browse-recipe-info">
        <div class="browse-recipe-title">${escHtml(r.title)}</div>
        <span class="cat-badge">${catObj?.icon||''} ${catObj?.label||r.category}</span>
      </div>
    </div>`;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Icon helpers (inline SVG) ──────────────────────────────────────────────

const svg = (d, size=20, extra='') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

const iconHome        = (s=18) => svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',s);
const iconArrowRight  = (s=18) => svg('<path d="M5 12h14M12 5l7 7-7 7"/>',s);
const iconCamera      = (s=18) => svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',s);
const iconStar        = (s=18) => svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',s);
const iconStarFilled  = (s=18) => svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/>',s);
const iconSearch   = (s=18) => svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',s);
const iconX        = (s=18) => svg('<path d="M18 6 6 18M6 6l12 12"/>',s);
const iconPlus     = (s=18) => svg('<path d="M12 5v14M5 12h14"/>',s);
const iconChevronLeft  = (s=20) => svg('<path d="M15 18l-6-6 6-6"/>',s);
const iconChevronRight = (s=16) => svg('<path d="M9 18l6-6-6-6"/>',s);
const iconGrid     = (s=18) => svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',s);
const iconEdit     = (s=17) => svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',s);
const iconTrash    = (s=17) => svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',s);
const iconDownload = (s=17) => svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',s);
const iconCheck    = (s=18) => svg('<polyline points="20 6 9 17 4 12"/>',s);
const iconUpload   = (s=18) => svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',s);

// ── Utility ────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Boot ───────────────────────────────────────────────────────────────────

function init() {
  loadRecipes();
  renderHome();
  document.getElementById('view-home').classList.add('active');

  // FAB
  document.getElementById('fab').addEventListener('click', () => {
    navigate('add', { editingId: null });
  });

  // Swipe to go back
  initSwipeGesture();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
}

document.addEventListener('DOMContentLoaded', init);
