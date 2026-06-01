const api = "https://english-app-api-ntyi.onrender.com";
const token = localStorage.getItem("token");
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');

if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (profileMenu.open) {
            profileMenu.close();
        } else {
            profileMenu.show();
        }
    });

    window.addEventListener('click', (event) => {
        if (profileMenu.open && !profileMenu.contains(event.target)) {
            profileMenu.close();
        }
    });
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "../login.html";
}


const wordsContainer = document.getElementById('wordsContainer');
const vocabSearch = document.getElementById('vocabSearch');

let localWordsCache = [];
let activeFilter = 'all';
let searchString = '';

if (wordsContainer) {
    if (!token) {
        window.location.href = "../login.html";
    } else {
        fetchUserDictionary();
    }

    if (vocabSearch) {
        vocabSearch.addEventListener('input', (e) => {
            searchString = e.target.value.toLowerCase().trim();
            renderDictionaryRows();
        });
    }
}

async function fetchUserDictionary() {
    try {
        const response = await fetch(`${api}/words`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error("Failed to sync client datasets.");
        }

        localWordsCache = await response.json();
        calculateStatSummaries();
        renderDictionaryRows();

    } catch (err) {
        console.error("Fetch failure error details:", err);
        wordsContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #ef4444;">Error: Could not load vocabulary from backend.</p>`;
    }
}

function calculateStatSummaries() {
    let countAll = localWordsCache.length;
    let countReady = 0;
    let countLearning = 0;
    let countMastered = 0;

    localWordsCache.forEach(item => {
        const status = item.status || 'new';
        if (status === 'new') countReady++;
        else if (status === 'learning') countLearning++;
        else if (status === 'mastered') countMastered++;
    });

    if (document.getElementById('count-all')) document.getElementById('count-all').textContent = countAll;
    if (document.getElementById('count-ready')) document.getElementById('count-ready').textContent = countReady;
    if (document.getElementById('count-learning')) document.getElementById('count-learning').textContent = countLearning;
    if (document.getElementById('count-mastered')) document.getElementById('count-mastered').textContent = countMastered;
}

function setFilter(filterType, element) {
    activeFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    renderDictionaryRows();
}

function renderDictionaryRows() {
    if (!wordsContainer) return;
    wordsContainer.innerHTML = '';

    const processedWords = localWordsCache.filter(item => {
        const itemStatus = item.status || 'new';
        const matchesFilter = (activeFilter === 'all') || (itemStatus === activeFilter);
        const matchesSearch = item.word.toLowerCase().includes(searchString) ||
            item.meaning.toLowerCase().includes(searchString);
        return matchesFilter && matchesSearch;
    });

    if (processedWords.length === 0) {
        wordsContainer.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 40px;">No vocabulary records found matching your selection.</p>`;
        return;
    }

    processedWords.forEach(item => {
        const wordStatus = item.status || 'new';
        const currentStreak = item.streak ?? 0;

        let displayStatus = "NEW WORDS";
        let statusClass = "new";

        if (wordStatus === 'learning') {
            displayStatus = "CURRENTLY LEARNING";
            statusClass = "learning"; 
        } else if (wordStatus === 'mastered') {
            displayStatus = "FULLY MASTERED";
            statusClass = "mastered"; 
        }

        let formattedDate = "Never reviewed";
        if (item.lastQuizzed) {
            const dateObj = new Date(item.lastQuizzed);
            formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
        }

        const dateAdded = item.createdAt ? new Date(item.createdAt) : new Date();
        const formattedAdded = `${dateAdded.getMonth() + 1}/${dateAdded.getDate()}/${dateAdded.getFullYear()}`;

        const cardHtml = `
          <div class="vocab-row-card">
            <div class="col-word">
              <h3>${escapeHtml(item.word)}</h3>
            </div>
            
            <div class="col-meaning">
              <p title="${escapeHtml(item.meaning)}">${escapeHtml(item.meaning)}</p>
            </div>
            
            <div class="col-status">
              <span class="status-badge ${statusClass}">${displayStatus}</span>
            </div>
            
            <div class="col-streak">
              <div class="streak-indicator ${currentStreak > 0 ? 'active' : ''}">
                <i class="fa-solid ${currentStreak > 0 ? 'fa-fire orange-fire' : 'fa-droplet gray-fire'}"></i>
                <span>${currentStreak}</span>
              </div>
            </div>
            
            <div class="col-activity">
              <h4>${formattedDate}</h4>
              <p class="date-sub">Added ${formattedAdded}</p>
            </div>
            
            <div class="col-actions">
              <button class="action-btn delete" onclick="deleteWordFromBackend('${item._id}')">
                  <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
        wordsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

async function deleteWordFromBackend(wordId) {
    if (!confirm("Are you sure you want to permanently delete this word?")) return;

    try {
        const response = await fetch(`${api}/words/${wordId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Server rejected request.");

        localWordsCache = localWordsCache.filter(word => word._id !== wordId);
        calculateStatSummaries();
        renderDictionaryRows();

    } catch (err) {
        console.error("Delete operation error:", err);
        alert("Failed to remove word from server. Please try again.");
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", () => {
    const burgerBtn = document.getElementById("burger");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");

    if (burgerBtn && mobileSidebar) {
        burgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileSidebar.showModal();
        });
    }

    if (closeSidebarBtn && mobileSidebar) {
        closeSidebarBtn.addEventListener("click", () => {
            mobileSidebar.close();
        });
    }

    if (mobileSidebar) {
        mobileSidebar.addEventListener("click", (e) => {
            const dialogDimensions = mobileSidebar.getBoundingClientRect();
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                mobileSidebar.close();
            }
        });
    }
});