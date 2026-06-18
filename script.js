// Application State
let state = {
  solved: [],       // Array of solved question IDs
  favorites: [],    // Array of favorited question IDs
  recent: [],       // Queue of recently viewed question IDs (max 5)
  currentId: 1,     // Current practice question ID
  drafts: {},       // Map of question ID to draft code written by user
  theme: "dark",    // Current theme
  searchQuery: "",  // Active search query
  filterCategory: "all", // Active category pill filter
  filterDifficulty: null // Active difficulty filter ("easy" | "medium" | null)
};

// Initialize State from LocalStorage
function loadState() {
  const localSolved = localStorage.getItem("j8_solved");
  const localFav = localStorage.getItem("j8_favorites");
  const localRecent = localStorage.getItem("j8_recent");
  const localCurrent = localStorage.getItem("j8_currentId");
  const localDrafts = localStorage.getItem("j8_drafts");
  const localTheme = localStorage.getItem("j8_theme");

  if (localSolved) state.solved = JSON.parse(localSolved);
  if (localFav) state.favorites = JSON.parse(localFav);
  if (localRecent) state.recent = JSON.parse(localRecent);
  if (localCurrent) state.currentId = parseInt(localCurrent, 10);
  if (localDrafts) state.drafts = JSON.parse(localDrafts);
  if (localTheme) {
    state.theme = localTheme;
  } else {
    // Detect OS theme preference default
    state.theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  // Double check currentId ranges
  if (!questions.find(q => q.id === state.currentId)) {
    state.currentId = 1;
  }
}

function saveState() {
  localStorage.setItem("j8_solved", JSON.stringify(state.solved));
  localStorage.setItem("j8_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("j8_recent", JSON.stringify(state.recent));
  localStorage.setItem("j8_currentId", state.currentId.toString());
  localStorage.setItem("j8_drafts", JSON.stringify(state.drafts));
  localStorage.setItem("j8_theme", state.theme);
}

// Custom Java Code Syntax Highlighter
function highlightJavaCode(code) {
  // Escape HTML tags
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const strings = [];
  const comments = [];

  // Replace string literals with placeholders
  html = html.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, (match) => {
    strings.push(`<span class="j-string">${match}</span>`);
    return `___STR_PLACEHOLDER_${strings.length - 1}___`;
  });

  // Replace comments with placeholders
  html = html.replace(/\/\/.*/g, (match) => {
    comments.push(`<span class="j-comment">${match}</span>`);
    return `___COM_PLACEHOLDER_${comments.length - 1}___`;
  });

  // Highlight operators and symbols (:: and ->)
  html = html.replace(/(::|-&gt;)/g, '<span class="j-operator">$1</span>');

  // Highlight Java core control/type keywords
  const keywords = /\b(if|else|new|return|int|char|double|boolean|void)\b/g;
  html = html.replace(keywords, '<span class="j-keyword">$1</span>');

  // Highlight structural types and variables
  const types = /\b(IntStream|Stream|Collectors|Arrays|Comparator|System|out|Function|LocalDate|ChronoUnit|String|Integer|StringBuffer|Character|birthDay|today|set|list|listOfIntegers|listOfStrings|anyList|inputString|inputNumber|inputArray|a|b|list1|list2|str|str1|str2)\b/g;
  html = html.replace(types, '<span class="j-type">$1</span>');

  // Highlight method chain APIs
  const methods = /\b(stream|collect|filter|map|mapToObj|sorted|distinct|limit|skip|forEach|toArray|sum|average|getAsDouble|get|between|iterate|split|toUpperCase|valueOf|isDigit|charAt|noneMatch|rangeClosed|range|joining|partitioningBy|toList|groupingBy|counting|identity|reverseOrder|naturalOrder|comparing|length|contains|println|print|now|of|add|toSet)\b/g;
  html = html.replace(methods, '<span class="j-method">$1</span>');

  // Highlight numbers
  html = html.replace(/\b(\d+)\b/g, '<span class="j-number">$1</span>');

  // Restore comments and strings
  for (let i = 0; i < comments.length; i++) {
    html = html.replace(`___COM_PLACEHOLDER_${i}___`, comments[i]);
  }
  for (let i = 0; i < strings.length; i++) {
    html = html.replace(`___STR_PLACEHOLDER_${i}___`, strings[i]);
  }

  return html;
}

// Reusable Toast Alerts
function showToast(message, type = "success") {
  const toast = document.getElementById("custom-alert-toast");
  const msgText = document.getElementById("custom-alert-msg");
  
  toast.className = `custom-alert ${type}`;
  msgText.textContent = message;
  
  // Animate in
  toast.classList.add("show");
  
  // Reset previous timer if active
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  
  // Animate out
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Confetti Particle Engine
let confettiActive = false;
let confettiParticles = [];
const confettiColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a78bfa", "#3b82f6"];

class ConfettiParticle {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * -canvasHeight - 20;
    this.r = Math.random() * 6 + 5;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.tilt = Math.random() * 10 - 5;
    this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
    this.tiltAngle = 0;
    this.speedY = Math.random() * 3 + 2;
    this.speedX = Math.random() * 2 - 1;
  }
  update(canvasWidth, canvasHeight) {
    this.tiltAngle += this.tiltAngleIncremental;
    this.y += this.speedY;
    this.x += this.speedX;
    this.tilt = Math.sin(this.tiltAngle) * 12;
    return this.y < canvasHeight && this.x > -20 && this.x < canvasWidth + 20;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.lineWidth = this.r;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x + this.tilt + this.r / 2, this.y);
    ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 2);
    ctx.stroke();
  }
}

function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  confettiParticles = [];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push(new ConfettiParticle(canvas.width, canvas.height));
  }
  
  if (!confettiActive) {
    confettiActive = true;
    animateConfetti(canvas, ctx);
  }
}

function animateConfetti(canvas, ctx) {
  if (confettiParticles.length === 0) {
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  confettiParticles = confettiParticles.filter(p => p.update(canvas.width, canvas.height));
  confettiParticles.forEach(p => p.draw(ctx));
  
  requestAnimationFrame(() => animateConfetti(canvas, ctx));
}

window.addEventListener("resize", () => {
  const canvas = document.getElementById("confetti-canvas");
  if (canvas && confettiActive) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// View Switching Manager
function switchToView(viewName) {
  // Hide all panels
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  
  // Show target panel
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Update active states in Sidebar
  document.querySelectorAll(".sidebar-item-link").forEach(link => {
    if (link.getAttribute("data-view") === viewName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Handle post-switch setup
  if (viewName === "home") {
    renderHomeView();
  } else if (viewName === "all-questions") {
    renderAllQuestionsTable();
  } else if (viewName === "practice") {
    renderPracticeQuestion();
  } else if (viewName === "solved") {
    renderSolvedListView();
  } else if (viewName === "progress") {
    renderProgressDashboard();
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// Add viewed question to Recently Viewed list (maintaining limit of 5, unique items)
function addToRecentlyViewed(id) {
  state.recent = state.recent.filter(x => x !== id);
  state.recent.unshift(id);
  if (state.recent.length > 5) {
    state.recent.pop();
  }
  saveState();
}

// Global Progress Calculations
function getProgressStats() {
  const total = questions.length;
  const solved = state.solved.length;
  const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
  return { total, solved, percentage };
}

// Update Global Progress Displays in Top Bar
function updateGlobalProgress() {
  const stats = getProgressStats();
  document.getElementById("topbar-percentage").textContent = `${stats.percentage}%`;
  document.getElementById("topbar-progress-fill").style.width = `${stats.percentage}%`;
}

// -------------------------------------------------------------
// RENDERERS FOR EACH PANEL
// -------------------------------------------------------------

// Render Home View
function renderHomeView() {
  const stats = getProgressStats();
  
  // Welcome Text
  const welcomeTitle = document.getElementById("welcome-title");
  if (stats.percentage === 100) {
    welcomeTitle.innerHTML = "Perfect Score! 🎉";
  } else {
    welcomeTitle.innerHTML = "Master Java 8 Streams";
  }

  // Summary Metrics
  document.getElementById("stats-percentage-text").textContent = `${stats.percentage}%`;
  document.getElementById("stats-circle-percentage").textContent = `${stats.percentage}%`;
  document.getElementById("stats-solved-count").textContent = `${stats.solved}/${stats.total}`;
  document.getElementById("stats-favorites-count").textContent = state.favorites.length;
  document.getElementById("stats-left-count").textContent = stats.total - stats.solved;

  // Circle animation offset calculation (circumference is 2 * PI * r = 2 * 3.14159 * 60 = ~377)
  const offset = 377 - (377 * stats.percentage) / 100;
  document.getElementById("stats-circle-progress").style.strokeDashoffset = offset;

  // Render Recently Viewed lists
  const recentContainer = document.getElementById("home-recent-list");
  recentContainer.innerHTML = "";
  if (state.recent.length === 0) {
    recentContainer.innerHTML = `<li class="item-list-empty">No questions recently viewed.</li>`;
  } else {
    state.recent.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        const li = document.createElement("li");
        li.className = "mini-item-link";
        li.innerHTML = `
          <span class="mini-item-title">${q.id}. ${q.title}</span>
          <span class="mini-item-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
        `;
        li.addEventListener("click", () => {
          state.currentId = q.id;
          saveState();
          switchToView("practice");
        });
        recentContainer.appendChild(li);
      }
    });
  }

  // Render Favorites list
  const favContainer = document.getElementById("home-favorite-list");
  favContainer.innerHTML = "";
  if (state.favorites.length === 0) {
    favContainer.innerHTML = `<li class="item-list-empty">No favorite questions added.</li>`;
  } else {
    state.favorites.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        const li = document.createElement("li");
        li.className = "mini-item-link";
        li.innerHTML = `
          <span class="mini-item-title">${q.id}. ${q.title}</span>
          <span class="mini-item-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
        `;
        li.addEventListener("click", () => {
          state.currentId = q.id;
          saveState();
          switchToView("practice");
        });
        favContainer.appendChild(li);
      }
    });
  }

  // Render Categories Dashboard Cards with Item Counts and Performance
  const categoryGrid = document.getElementById("home-categories-grid");
  categoryGrid.innerHTML = "";
  
  const categoriesList = ["Streams", "Collectors", "Arrays", "Strings", "Numbers", "Sorting", "Miscellaneous"];
  
  // Categorized Icons Mapping
  const icons = {
    Streams: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    Collectors: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    Arrays: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`,
    Strings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
    Numbers: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>`,
    Sorting: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="11" y1="5" x2="21" y2="5"/><line x1="11" y1="9" x2="21" y2="9"/><line x1="11" y1="13" x2="21" y2="13"/><line x1="11" y1="17" x2="21" y2="17"/><rect x="3" y="5" width="4" height="4"/><rect x="3" y="13" width="4" height="4"/></svg>`,
    Miscellaneous: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  categoriesList.forEach(cat => {
    const catQs = questions.filter(q => q.category === cat);
    const catSolved = catQs.filter(q => state.solved.includes(q.id));
    
    const div = document.createElement("div");
    div.className = "category-card";
    div.innerHTML = `
      <div class="category-icon">${icons[cat] || icons.Miscellaneous}</div>
      <div class="category-name">${cat}</div>
      <div class="category-count">${catSolved.length} / ${catQs.length} Mastered</div>
    `;
    div.addEventListener("click", () => {
      state.filterCategory = cat;
      switchToView("all-questions");
      // Activate respective filter pill visually
      document.querySelectorAll("#category-filter-pills .filter-pill").forEach(pill => {
        if (pill.getAttribute("data-category") === cat) {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      });
    });
    categoryGrid.appendChild(div);
  });
}

// Render All Questions Table with Filters and Instant Search
function renderAllQuestionsTable() {
  const tableBody = document.getElementById("questions-table-body");
  tableBody.innerHTML = "";

  // Apply Search and Filters
  const filtered = questions.filter(q => {
    // Search Query (Match title or category)
    const matchesSearch = q.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          q.category.toLowerCase().includes(state.searchQuery.toLowerCase());
    
    // Category Filter
    const matchesCategory = state.filterCategory === "all" || q.category === state.filterCategory;
    
    // Difficulty Filter
    const matchesDifficulty = !state.filterDifficulty || q.difficulty.toLowerCase() === state.filterDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <h3>No questions found</h3>
            <p>Try resetting filters or adjusting search words.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(q => {
    const isSolved = state.solved.includes(q.id);
    const isFavorite = state.favorites.includes(q.id);
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-status">
        ${isSolved 
          ? `<i class="solved"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></i>` 
          : `<i class="unsolved"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></i>`}
      </td>
      <td class="td-id">${q.id}</td>
      <td class="td-title" id="title-lnk-${q.id}">${q.title}</td>
      <td class="td-category">${q.category}</td>
      <td>
        <span class="badge-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
      </td>
      <td class="td-actions">
        <!-- Favorite Star -->
        <button class="btn-icon-action star ${isFavorite ? 'active' : ''}" id="fav-btn-${q.id}" title="${isFavorite ? 'Remove Favorite' : 'Mark Favorite'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <!-- Practice btn -->
        <button class="btn-table-practice" id="prac-btn-${q.id}">Practice</button>
      </td>
    `;

    // Click handlers for dynamically generated items
    tr.querySelector(`#title-lnk-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    tr.querySelector(`#prac-btn-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    tr.querySelector(`#fav-btn-${q.id}`).addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(q.id);
      renderAllQuestionsTable();
    });

    tableBody.appendChild(tr);
  });
}

// Render Question Detail Practice Mode Panel
function renderPracticeQuestion() {
  const q = questions.find(item => item.id === state.currentId);
  if (!q) return;

  // Add this question to Recently Viewed list
  addToRecentlyViewed(q.id);

  // Setup header badges & title
  document.getElementById("practice-q-number").textContent = `Question ${q.id} of ${questions.length}`;
  document.getElementById("practice-q-title").textContent = q.title;
  
  const diffBadge = document.getElementById("practice-q-difficulty");
  diffBadge.textContent = q.difficulty;
  diffBadge.className = `badge-difficulty ${q.difficulty.toLowerCase()}`;

  const catBadge = document.getElementById("practice-q-category");
  catBadge.textContent = q.category;

  // Favorite Star Toggle Display
  const isFav = state.favorites.includes(q.id);
  const favToggleBtn = document.getElementById("practice-favorite-toggle");
  favToggleBtn.classList.toggle("active", isFav);
  favToggleBtn.querySelector("svg").setAttribute("fill", isFav ? "currentColor" : "none");

  // Show user drafts/saved text area code
  const textarea = document.getElementById("practice-user-editor");
  textarea.value = state.drafts[q.id] || "";

  // Hide Java Code block initially
  const drawer = document.getElementById("practice-solution-drawer");
  const toggleBtn = document.getElementById("practice-toggle-solution");
  const toggleText = document.getElementById("solution-toggle-text");
  
  drawer.classList.remove("open");
  drawer.style.maxHeight = null;
  toggleBtn.classList.remove("showing");
  toggleText.textContent = "Show Solution";

  // Setup formatted code inside hidden box
  const codeBlock = document.getElementById("practice-solution-code");
  codeBlock.innerHTML = highlightJavaCode(q.solution);

  // Solved Status display updates
  const isSolved = state.solved.includes(q.id);
  const solvedText = document.getElementById("practice-mark-solved-text");
  const solvedBtn = document.getElementById("practice-mark-solved-btn");

  if (isSolved) {
    solvedText.textContent = "Solved";
    solvedBtn.style.backgroundColor = "var(--accent-success)";
    solvedBtn.querySelector("svg").style.display = "inline-block";
  } else {
    solvedText.textContent = "Mark as Solved";
    // Reset to default button styling
    solvedBtn.style.backgroundColor = "";
    solvedBtn.querySelector("svg").style.display = "inline-block";
  }

  // Navigation disable checks
  document.getElementById("practice-prev-btn").disabled = (q.id === 1);
  document.getElementById("practice-next-btn").disabled = (q.id === questions.length);
}

// Render Solved List View
function renderSolvedListView() {
  const container = document.getElementById("solved-questions-list");
  container.innerHTML = "";

  const solvedQs = questions.filter(q => state.solved.includes(q.id));
  
  // Update Solved stats overview boxes
  document.getElementById("solved-stats-count").textContent = `${solvedQs.length} / ${questions.length}`;
  
  const easySolvedCount = solvedQs.filter(q => q.difficulty === "Easy").length;
  const mediumSolvedCount = solvedQs.filter(q => q.difficulty === "Medium").length;
  document.getElementById("solved-stats-easy").textContent = easySolvedCount;
  document.getElementById("solved-stats-medium").textContent = mediumSolvedCount;

  if (solvedQs.length === 0) {
    container.innerHTML = `
      <div class="table-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h3>No Solved Questions</h3>
        <p>Your solved problems list is empty. Go practice and mark them complete!</p>
      </div>
    `;
    return;
  }

  solvedQs.forEach(q => {
    const card = document.createElement("div");
    card.className = "solved-item-card";
    card.innerHTML = `
      <div class="solved-item-left">
        <span class="solved-check-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        <div class="solved-item-details">
          <span class="solved-item-title" id="solved-title-${q.id}">${q.id}. ${q.title}</span>
          <div class="solved-item-meta">
            <span class="solved-item-category">${q.category}</span>
            <span class="badge-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          </div>
        </div>
      </div>
      <button class="btn-remove-solved" id="unsolve-btn-${q.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Unsolve</span>
      </button>
    `;

    // Click event to practice this question
    card.querySelector(`#solved-title-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    // Unsolve button trigger
    card.querySelector(`#unsolve-btn-${q.id}`).addEventListener("click", () => {
      toggleSolved(q.id);
      renderSolvedListView();
      showToast(`Removed "${q.title}" from solved list.`);
    });

    container.appendChild(card);
  });
}

// Render Progress / Analytics View Page
function renderProgressDashboard() {
  const container = document.getElementById("progress-categories-list");
  container.innerHTML = "";

  const categoriesList = ["Streams", "Collectors", "Arrays", "Strings", "Numbers", "Sorting", "Miscellaneous"];

  categoriesList.forEach(cat => {
    const catQs = questions.filter(q => q.category === cat);
    const catSolved = catQs.filter(q => state.solved.includes(q.id));
    const percent = catQs.length > 0 ? Math.round((catSolved.length / catQs.length) * 100) : 0;

    const row = document.createElement("div");
    row.className = "progress-category-row";
    row.innerHTML = `
      <div class="progress-category-meta">
        <span>${cat}</span>
        <span>${catSolved.length} / ${catQs.length} (${percent}%)</span>
      </div>
      <div class="progress-category-bar-bg">
        <div class="progress-category-bar-fill" style="width: ${percent}%;"></div>
      </div>
    `;
    container.appendChild(row);
  });

  // Calculate difficulty ratios
  const easyTotal = questions.filter(q => q.difficulty === "Easy").length;
  const easySolved = questions.filter(q => q.difficulty === "Easy" && state.solved.includes(q.id)).length;
  const easyPercent = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;
  document.getElementById("progress-easy-ratio").textContent = `${easySolved} / ${easyTotal} (${easyPercent}%)`;

  const mediumTotal = questions.filter(q => q.difficulty === "Medium").length;
  const mediumSolved = questions.filter(q => q.difficulty === "Medium" && state.solved.includes(q.id)).length;
  const mediumPercent = mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0;
  document.getElementById("progress-medium-ratio").textContent = `${mediumSolved} / ${mediumTotal} (${mediumPercent}%)`;
}

// -------------------------------------------------------------
// EVENT ACTIONS & UTILITIES
// -------------------------------------------------------------

// Toggle Favorite Status
function toggleFavorite(id) {
  const idx = state.favorites.indexOf(id);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
    showToast("Removed from favorites.");
  } else {
    state.favorites.push(id);
    showToast("Added to favorites!", "success");
  }
  saveState();
  // Update views
  updateGlobalProgress();
}

// Toggle Solved Status
function toggleSolved(id) {
  const idx = state.solved.indexOf(id);
  if (idx > -1) {
    state.solved.splice(idx, 1);
  } else {
    state.solved.push(id);
    // If all 26 are solved, trigger the confetti!
    if (state.solved.length === questions.length) {
      showToast("Incredible! You solved every single question! 🎉", "success");
      startConfetti();
    } else {
      showToast("Question completed!", "success");
    }
  }
  saveState();
  updateGlobalProgress();
}

// Get Random Unsolved or Alternate Question (Ensuring no immediate repeat if possible)
function getRandomQuestionId() {
  if (questions.length <= 1) return 1;

  // Filter out the current active ID
  const options = questions.filter(q => q.id !== state.currentId);
  
  // Prefer unsolved questions if possible
  const unsolvedOptions = options.filter(q => !state.solved.includes(q.id));
  const pool = unsolvedOptions.length > 0 ? unsolvedOptions : options;

  const randomIdx = Math.floor(Math.random() * pool.length);
  return pool[randomIdx].id;
}

// -------------------------------------------------------------
// USER INPUT & INTERACTION HANDLERS
// -------------------------------------------------------------

// Attach UI Event Listeners
function setupEventListeners() {
  
  // Sidebar view links
  document.querySelectorAll(".sidebar-item-link").forEach(link => {
    link.addEventListener("click", () => {
      switchToView(link.getAttribute("data-view"));
    });
  });

  // Home Screen Start Practicing buttons
  document.getElementById("home-start-btn").addEventListener("click", () => {
    switchToView("practice");
  });

  // Top Bar global progress trigger
  document.getElementById("topbar-progress-trigger").addEventListener("click", () => {
    switchToView("progress");
  });

  // Light/Dark Toggle click
  document.getElementById("theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    saveState();
  });

  // Search input events
  const searchInput = document.getElementById("global-search");
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    // Switch to list view to display matches immediately
    switchToView("all-questions");
    renderAllQuestionsTable();
  });

  // Category filters pills trigger in list page
  document.querySelectorAll("#category-filter-pills .filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#category-filter-pills .filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      
      state.filterCategory = pill.getAttribute("data-category");
      renderAllQuestionsTable();
    });
  });

  // Easy / Medium filter buttons trigger in list page
  const easyBtn = document.getElementById("filter-easy");
  const medBtn = document.getElementById("filter-medium");

  easyBtn.addEventListener("click", () => {
    if (state.filterDifficulty === "easy") {
      state.filterDifficulty = null;
      easyBtn.classList.remove("active-easy");
    } else {
      state.filterDifficulty = "easy";
      easyBtn.classList.add("active-easy");
      medBtn.classList.remove("active-medium");
    }
    renderAllQuestionsTable();
  });

  medBtn.addEventListener("click", () => {
    if (state.filterDifficulty === "medium") {
      state.filterDifficulty = null;
      medBtn.classList.remove("active-medium");
    } else {
      state.filterDifficulty = "medium";
      medBtn.classList.add("active-medium");
      easyBtn.classList.remove("active-easy");
    }
    renderAllQuestionsTable();
  });

  // -------------------------------------------------------------
  // PRACTICE PANEL CONTROLS
  // -------------------------------------------------------------

  // Prev / Next Question Actions
  document.getElementById("practice-prev-btn").addEventListener("click", () => {
    if (state.currentId > 1) {
      state.currentId--;
      saveState();
      renderPracticeQuestion();
    }
  });

  document.getElementById("practice-next-btn").addEventListener("click", () => {
    if (state.currentId < questions.length) {
      state.currentId++;
      saveState();
      renderPracticeQuestion();
    }
  });

  // Random practice btn
  document.getElementById("practice-random-btn").addEventListener("click", () => {
    state.currentId = getRandomQuestionId();
    saveState();
    renderPracticeQuestion();
  });

  // Copy title button
  document.getElementById("practice-copy-title").addEventListener("click", () => {
    const q = questions.find(item => item.id === state.currentId);
    if (q) {
      navigator.clipboard.writeText(`${q.id}. ${q.title}`)
        .then(() => showToast("Copied title to clipboard!"))
        .catch(() => showToast("Failed to copy", "error"));
    }
  });

  // Print question button
  document.getElementById("practice-print-question").addEventListener("click", () => {
    // Open solution drawer before printing so it is fully visible on print page
    const drawer = document.getElementById("practice-solution-drawer");
    const toggleBtn = document.getElementById("practice-toggle-solution");
    const toggleText = document.getElementById("solution-toggle-text");
    
    drawer.classList.add("open");
    drawer.style.maxHeight = "none";
    toggleBtn.classList.add("showing");
    toggleText.textContent = "Hide Solution";
    
    window.print();
  });

  // Favorite Star toggle inside practice view
  document.getElementById("practice-favorite-toggle").addEventListener("click", () => {
    toggleFavorite(state.currentId);
    renderPracticeQuestion();
  });

  // User Code Editor draft save
  const editorArea = document.getElementById("practice-user-editor");
  editorArea.addEventListener("input", (e) => {
    state.drafts[state.currentId] = e.target.value;
    saveState();
  });

  // Show/Hide Solution toggle drawer action
  const solDrawer = document.getElementById("practice-solution-drawer");
  const solToggle = document.getElementById("practice-toggle-solution");
  const solToggleText = document.getElementById("solution-toggle-text");

  solToggle.addEventListener("click", () => {
    const isOpen = solDrawer.classList.contains("open");
    if (isOpen) {
      solDrawer.classList.remove("open");
      solDrawer.style.maxHeight = null;
      solToggle.classList.remove("showing");
      solToggleText.textContent = "Show Solution";
    } else {
      solDrawer.classList.add("open");
      solDrawer.style.maxHeight = solDrawer.scrollHeight + "px";
      solToggle.classList.add("showing");
      solToggleText.textContent = "Hide Solution";
    }
  });

  // Copy Java Code solution
  document.getElementById("practice-copy-solution").addEventListener("click", () => {
    const q = questions.find(item => item.id === state.currentId);
    if (q) {
      navigator.clipboard.writeText(q.solution)
        .then(() => showToast("Copied code to clipboard!"))
        .catch(() => showToast("Failed to copy code", "error"));
    }
  });

  // Mark question solved button
  document.getElementById("practice-mark-solved-btn").addEventListener("click", () => {
    toggleSolved(state.currentId);
    renderPracticeQuestion();
  });

  // Reset progress button in practice view
  document.getElementById("practice-reset-progress-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all practice progress? This deletes your solved status, favorites, and editor drafts!")) {
      clearAllData();
    }
  });

  // -------------------------------------------------------------
  // SOLVED VIEW CONTROLS
  // -------------------------------------------------------------
  document.getElementById("solved-unsolve-all-btn").addEventListener("click", () => {
    if (state.solved.length === 0) return;
    if (confirm("Are you sure you want to unsolve all questions?")) {
      state.solved = [];
      saveState();
      renderSolvedListView();
      updateGlobalProgress();
      showToast("Cleared solved status on all questions.");
    }
  });

  // -------------------------------------------------------------
  // PROGRESS VIEW CONTROLS (IMPORT/EXPORT/CLEAR)
  // -------------------------------------------------------------
  
  // Export JSON backup file
  document.getElementById("progress-export-btn").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        solved: state.solved,
        favorites: state.favorites,
        drafts: state.drafts
      }, null, 2)
    );
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "java8_practice_progress.json");
    dlAnchorElem.click();
    showToast("Progress exported successfully!");
  });

  // Import JSON backup file
  document.getElementById("import-progress-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        
        // Validation check
        if (imported && (Array.isArray(imported.solved) || Array.isArray(imported.favorites) || typeof imported.drafts === "object")) {
          if (Array.isArray(imported.solved)) state.solved = imported.solved.filter(x => typeof x === "number");
          if (Array.isArray(imported.favorites)) state.favorites = imported.favorites.filter(x => typeof x === "number");
          if (imported.drafts && typeof imported.drafts === "object") state.drafts = imported.drafts;
          
          saveState();
          updateGlobalProgress();
          switchToView("progress");
          showToast("Progress successfully imported!", "success");
        } else {
          showToast("Invalid file format", "error");
        }
      } catch (err) {
        showToast("Error parsing file", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = "";
  });

  // Clear all data settings button
  document.getElementById("progress-reset-all-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data in storage? This deletes everything permanently.")) {
      clearAllData();
    }
  });
}

// Full Clear State Utility
function clearAllData() {
  localStorage.clear();
  state.solved = [];
  state.favorites = [];
  state.recent = [];
  state.currentId = 1;
  state.drafts = {};
  state.theme = "dark";
  
  document.documentElement.setAttribute("data-theme", "dark");
  saveState();
  updateGlobalProgress();
  switchToView("home");
  showToast("All progress and data reset successfully.", "success");
}

// -------------------------------------------------------------
// KEYBOARD SHORTCUTS CONTROLLER
// -------------------------------------------------------------
function handleKeyboardShortcuts(e) {
  // If user is focused on input/textarea, bypass shortcut triggers
  const targetTag = document.activeElement.tagName;
  if (targetTag === "TEXTAREA" || targetTag === "INPUT") {
    return;
  }

  const key = e.key.toLowerCase();
  
  if (e.key === "ArrowRight") {
    // Next Question
    if (state.currentId < questions.length) {
      state.currentId++;
      saveState();
      if (document.getElementById("view-practice").classList.contains("active")) {
        renderPracticeQuestion();
      } else {
        switchToView("practice");
      }
      showToast(`Navigated to Question ${state.currentId}`);
    }
  } else if (e.key === "ArrowLeft") {
    // Previous Question
    if (state.currentId > 1) {
      state.currentId--;
      saveState();
      if (document.getElementById("view-practice").classList.contains("active")) {
        renderPracticeQuestion();
      } else {
        switchToView("practice");
      }
      showToast(`Navigated to Question ${state.currentId}`);
    }
  } else if (key === "r") {
    // Random Question
    state.currentId = getRandomQuestionId();
    saveState();
    if (document.getElementById("view-practice").classList.contains("active")) {
      renderPracticeQuestion();
    } else {
      switchToView("practice");
    }
    showToast(`Loading Random Question ${state.currentId}`);
  } else if (key === "s") {
    // Toggle Solution
    if (document.getElementById("view-practice").classList.contains("active")) {
      const solToggle = document.getElementById("practice-toggle-solution");
      if (solToggle) solToggle.click();
    } else {
      switchToView("practice");
      setTimeout(() => {
        const solToggle = document.getElementById("practice-toggle-solution");
        if (solToggle) solToggle.click();
      }, 100);
    }
  } else if (key === "f") {
    // Focus search input
    e.preventDefault();
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  document.documentElement.setAttribute("data-theme", state.theme);
  updateGlobalProgress();
  setupEventListeners();
  
  // Bind Keyboard listener
  window.addEventListener("keydown", handleKeyboardShortcuts);

  // Set default view on page load
  switchToView("home");
});
