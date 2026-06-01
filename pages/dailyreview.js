document.addEventListener("DOMContentLoaded", () => {
    const api = "https://english-app-api-ntyi.onrender.com";
    const token = localStorage.getItem("token");

    const questionArea = document.getElementById("questionArea");
    const quizActionBtn = document.getElementById("quizActionBtn");
    const quizProgress = document.getElementById("quizProgress");
    const actionRow = document.getElementById("actionRow");
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');

    let quizQuestions = [];
    let currentQuestionIndex = 0;
    let selectedOptionElement = null;
    let selectedAnswerText = "";
    let isAnswerSubmitted = false;

    if (!token) { window.location.href = "../login.html"; return; }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileMenu.open) profileMenu.close(); else profileMenu.show();
        });
        window.addEventListener('click', () => { if (profileMenu.open) profileMenu.close(); });
    }

    function getTodayString() {
        const d = new Date();
        return `review-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    async function initializeReviewEngine() {
        const d = new Date();
        const todayStr = `review-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

        let storedDate = localStorage.getItem("review_date");
        let storedHistory = localStorage.getItem("review_history_session");

        try {
            const res = await fetch(`${api}/user/progress`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const userData = await res.json();
                if (userData.review_date === todayStr && userData.review_history_session?.length > 0) {
                    storedDate = userData.review_date;
                    storedHistory = JSON.stringify(userData.review_history_session);

                    localStorage.setItem("review_date", storedDate);
                    localStorage.setItem("review_history_session", storedHistory);
                }
            }
        } catch (err) { console.warn("Could not poll cloud sync profiles:", err); }

        if (storedDate === todayStr && storedHistory) {
            quizQuestions = JSON.parse(storedHistory);
            renderPersistentReviewMode();
            return;
        }

        try {
            const response = await fetch(`${api}/quiz-words`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to load review datasets.");
            const dataPool = await response.json();

            let learningWordsPool = dataPool.filter(w => w.status === 'learning');

            if (learningWordsPool.length === 0) {
                quizProgress.textContent = "0/0 Complete";
                actionRow.style.display = "none";
                questionArea.innerHTML = `
                    <div style="text-align: center; padding: 30px 0;">
                        <div style="font-size: 48px; margin-bottom: 16px;">😅</div>
                        <h3 style="font-size: 20px; font-weight:700; color:#0f172a; margin:0 0 8px 0;">No words to review!</h3>
                        <p style="color:#64748b; font-size:15px; max-width:420px; margin:0 auto 20px auto;">You don't have any words marked as "learning". Complete your DailyStudy first to populate this list.</p>
                        <button onclick="window.location.href='dailystudy.html'" class="form-action-btn btn-secondary" style="background:#00e59b; color:#000; border:none;">Go to DailyStudy</button>
                    </div>`;
                return;
            }

            learningWordsPool.sort(() => 0.5 - Math.random());
            const reviewWords = learningWordsPool.slice(0, Math.min(10, learningWordsPool.length));

            const backupResponse = await fetch(`${api}/words`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const backupWords = await backupResponse.json();

            quizQuestions = reviewWords.map(targetWord => {
                const alternateMeanings = backupWords
                    .filter(w => w._id !== targetWord._id)
                    .map(w => w.meaning);

                const uniqueDistractors = [...new Set(alternateMeanings)].sort(() => 0.5 - Math.random());
                const selectedDistractors = uniqueDistractors.slice(0, 2);
                const completeChoices = [targetWord.meaning, ...selectedDistractors].sort(() => 0.5 - Math.random());

                return {
                    wordId: targetWord._id,
                    wordText: targetWord.word,
                    correctMeaning: targetWord.meaning,
                    options: completeChoices,
                    userSelectedAnswer: null
                };
            });

            currentQuestionIndex = 0;
            displayActiveQuestion();

        } catch (err) {
            console.error(err);
            questionArea.innerHTML = `<p style="text-align:center; color:#ef4444;">Error building your review session.</p>`;
        }
    }

    function displayActiveQuestion() {
        isAnswerSubmitted = false;
        selectedOptionElement = null;
        selectedAnswerText = "";

        quizActionBtn.disabled = true;
        quizActionBtn.classList.remove("active");
        quizActionBtn.classList.add("disabled");
        quizActionBtn.innerHTML = `Submit Answer <i class="fa-solid fa-arrow-right"></i>`;

        const q = quizQuestions[currentQuestionIndex];
        quizProgress.textContent = `Review ${currentQuestionIndex + 1}/${quizQuestions.length}`;

        let optionsMarkup = q.options.map(opt => `
            <div class="quiz-option-row" data-answer="${escapeHtml(opt)}">
                <div class="quiz-radio-circle"></div>
                <span class="quiz-option-text">${escapeHtml(opt)}</span>
            </div>
        `).join('');

        questionArea.innerHTML = `
            <div style="margin-bottom: 24px;">
                <p class="field-label" style="color:#d97706; margin-bottom: 8px;">REINFORCE YOUR MEMORY</p>
                <h1 style="font-size: 34px; font-weight: 800; color: #0f172a; margin: 0;">${escapeHtml(q.wordText)}</h1>
            </div>
            <div class="quiz-options-container" style="display: flex; flex-direction: column; gap: 14px;">
                ${optionsMarkup}
            </div>
        `;

        document.querySelectorAll(".quiz-option-row").forEach(row => {
            row.addEventListener("click", () => {
                if (isAnswerSubmitted) return;
                document.querySelectorAll(".quiz-option-row").forEach(r => r.classList.remove("selected"));
                row.classList.add("selected");
                selectedOptionElement = row;
                selectedAnswerText = row.getAttribute("data-answer");

                quizActionBtn.disabled = false;
                quizActionBtn.classList.remove("disabled");
                quizActionBtn.classList.add("active");
            });
        });
    }

    if (quizActionBtn) {
        quizActionBtn.addEventListener("click", async () => {
            const q = quizQuestions[currentQuestionIndex];

            if (!isAnswerSubmitted) {
                isAnswerSubmitted = true;
                q.userSelectedAnswer = selectedAnswerText;

                quizActionBtn.disabled = true;
                quizActionBtn.innerHTML = `Saving... <i class="fa-solid fa-spinner fa-spin"></i>`;

                const isCorrectAnswer = (selectedAnswerText === q.correctMeaning);

                try {
                    const updateResponse = await fetch(`${api}/quiz-result`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            wordId: q.wordId,
                            correct: isCorrectAnswer
                        })
                    });

                    if (updateResponse.ok) {
                        const result = await updateResponse.json();
                        console.log(`Backend Updated - Streak: ${result.streak}, Status: ${result.status}`);
                    }
                } catch (err) {
                    console.error("Database tracking sync failure:", err);
                }

                document.querySelectorAll(".quiz-option-row").forEach(row => {
                    const ans = row.getAttribute("data-answer");
                    if (ans === q.correctMeaning) row.classList.add("correct");
                    else if (row === selectedOptionElement) row.classList.add("wrong");
                });

                quizActionBtn.disabled = false;
                quizActionBtn.innerHTML = `Next Question <i class="fa-solid fa-arrow-right"></i>`;

            } else {
                currentQuestionIndex++;
                if (currentQuestionIndex < quizQuestions.length) {
                    displayActiveQuestion();
                } else {

                    const targetDateStr = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

                    localStorage.setItem("review_date", `review-${targetDateStr}`);
                    localStorage.setItem("review_history_session", JSON.stringify(quizQuestions));

                    try {
                        quizActionBtn.disabled = true;
                        quizActionBtn.innerHTML = `Syncing Progress... <i class="fa-solid fa-spinner fa-spin"></i>`;

                        const syncResponse = await fetch(`${api}/user/sync-quiz`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                type: "review", 
                                dateString: `review-${targetDateStr}`,
                                historySession: quizQuestions
                            })
                        });

                        if (syncResponse.ok) {
                            const syncData = await syncResponse.json();
                            console.log("Cloud Backup Verified! User Streak Score:", syncData.streak);
                        }
                    } catch (e) {
                        console.error("Backup sync failed, saved locally instead.", e);
                    }

                    renderPersistentReviewMode();
                }
            }
        });
    }

    function renderPersistentReviewMode() {
        quizProgress.textContent = "Review Sheet Complete";
        actionRow.style.display = "flex";
        quizActionBtn.disabled = false;
        quizActionBtn.classList.remove("disabled");
        quizActionBtn.classList.add("active");
        quizActionBtn.innerHTML = `Back to Dashboard <i class="fa-solid fa-house"></i>`;
        quizActionBtn.onclick = () => { window.location.href = "../index.html"; };

        let completeReviewHtml = `
            <div style="margin-bottom: 24px; background:#fbeee9; padding:16px; border-radius:16px; border:1px solid #ff6b35;">
                <h4 style="margin:0 0 4px 0; color:#ff6b35; font-weight:700;">DailyReview Finished!</h4>
                <p style="margin:0; color:black; font-size:14px;">You have processed up to 10 learning words today. Here is your summary.</p>
            </div>
        `;

        quizQuestions.forEach((q, index) => {
            let choiceRowsHtml = q.options.map(opt => {
                let trackingClass = "";
                if (opt === q.correctMeaning) trackingClass = "correct";
                else if (opt === q.userSelectedAnswer && q.userSelectedAnswer !== q.correctMeaning) trackingClass = "wrong";

                return `
                    <div class="quiz-option-row review-only ${trackingClass}">
                        <div class="quiz-radio-circle"></div>
                        <span class="quiz-option-text">${escapeHtml(opt)}</span>
                    </div>
                `;
            }).join('');

            completeReviewHtml += `
                <div style="margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px dashed #e2e8f0;">
                    <span class="field-label" style="color:#ff6b35; font-weight:700;">REVIEW #${index + 1}</span>
                    <h2 style="font-size: 26px; font-weight:800; color:#0f172a; margin:4px 0 16px 0;">${escapeHtml(q.wordText)}</h2>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${choiceRowsHtml}
                    </div>
                </div>
            `;
        });

        questionArea.innerHTML = completeReviewHtml;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    initializeReviewEngine();
});

if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (profileMenu.open) profileMenu.close(); else profileMenu.show();
    });

    profileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    window.addEventListener('click', () => { 
        if (profileMenu.open) profileMenu.close(); 
    });
}