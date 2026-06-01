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

    if (!token) { 
        window.location.href = "../login.html"; 
        return; 
    }

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profileMenu.open) profileMenu.close(); else profileMenu.show();
        });
        window.addEventListener('click', () => { if (profileMenu.open) profileMenu.close(); });
    }

    function getTodayString() {
        const d = new Date();
        return `study-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    async function initializeStudyEngine() {
        const todayStr = getTodayString();
        let storedDate = localStorage.getItem("study_date");
        let storedHistory = localStorage.getItem("study_history_session");

        try {
            const progressRes = await fetch(`${api}/user/progress`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (progressRes.ok) {
                const userData = await progressRes.json();
                if (userData.study_date === todayStr && userData.study_history_session?.length > 0) {
                    storedDate = userData.study_date;
                    storedHistory = JSON.stringify(userData.study_history_session);
                    
                    localStorage.setItem("study_date", storedDate);
                    localStorage.setItem("study_history_session", storedHistory);
                }
            }
        } catch (err) { 
            console.warn("Could not query latest cloud status. Using fallback local storage profiles:", err); 
        }

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
            if (!response.ok) throw new Error("Could not acquire custom words array data.");
            const completeDataPool = await response.json();

            let newWordsPool = completeDataPool.filter(w => w.status === 'new' || w.status === undefined);

            if (newWordsPool.length === 0) {
                quizProgress.textContent = "0/0 Complete";
                if (actionRow) actionRow.style.display = "none";
                questionArea.innerHTML = `
                    <div style="text-align: center; padding: 30px 0;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🥰</div>
                        <h3 style="font-size: 20px; font-weight:700; color:#0f172a; margin:0 0 8px 0;">All caught up!</h3>
                        <p style="color:#64748b; font-size:15px; max-width:400px; margin:0 auto 20px auto;">You don't have any words with status "New" left to quiz. Add more words in your dictionary to resume.</p>
                        <button onclick="window.location.href='addwords.html'" class="form-action-btn btn-secondary" style="background:#00e59b; color:#000; border:none;">Add New Words</button>
                    </div>`;
                return;
            }

            newWordsPool.sort(() => 0.5 - Math.random());
            const activeQuizWords = newWordsPool.slice(0, Math.min(5, newWordsPool.length));

            const backupResponse = await fetch(`${api}/words`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const backupWords = await backupResponse.json();

            quizQuestions = activeQuizWords.map(targetWord => {
                const alternativeMeanings = backupWords
                    .filter(w => w._id !== targetWord._id)
                    .map(w => w.meaning);
                
                const uniqueDistractors = [...new Set(alternativeMeanings)].sort(() => 0.5 - Math.random());
                const selectedDistractors = uniqueDistractors.slice(0, 2);
                const combinedShuffledChoices = [targetWord.meaning, ...selectedDistractors].sort(() => 0.5 - Math.random());

                return {
                    wordId: targetWord._id,
                    wordText: targetWord.word,
                    correctMeaning: targetWord.meaning,
                    options: combinedShuffledChoices,
                    userSelectedAnswer: null
                };
            });

            currentQuestionIndex = 0;
            displayActiveQuestion();

        } catch (err) {
            console.error("Initialization process failure state trace:", err);
            questionArea.innerHTML = `<p style="text-align:center; color:#ef4444;">Error building your daily study session.</p>`;
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
        quizProgress.textContent = `Question ${currentQuestionIndex + 1}/${quizQuestions.length}`;

        let optionsMarkup = q.options.map(opt => `
            <div class="quiz-option-row" data-answer="${escapeHtml(opt)}">
                <div class="quiz-radio-circle"></div>
                <span class="quiz-option-text">${escapeHtml(opt)}</span>
            </div>
        `).join('');

        questionArea.innerHTML = `
            <div style="margin-bottom: 24px;">
                <p class="field-label" style="margin-bottom: 8px;">CHOOSE THE CORRECT MEANING</p>
                <h1 style="font-size: 34px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">${escapeHtml(q.wordText)}</h1>
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
                    const postResponse = await fetch(`${api}/quiz-result`, {
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

                    if (postResponse.ok) {
                        const wordResult = await postResponse.json();
                        console.log(`Word updated - Streak: ${wordResult.streak}, Status: ${wordResult.status}`);
                    }
                } catch (err) { 
                    console.error("Database connection dropped during question log submission:", err); 
                }

                document.querySelectorAll(".quiz-option-row").forEach(row => {
                    const ans = row.getAttribute("data-answer");
                    if (ans === q.correctMeaning) {
                        row.classList.add("correct");
                    } else if (row === selectedOptionElement) {
                        row.classList.add("wrong");
                    }
                });

                quizActionBtn.disabled = false;
                quizActionBtn.innerHTML = `Next Question <i class="fa-solid fa-arrow-right"></i>`;

            } else {
                currentQuestionIndex++;
                if (currentQuestionIndex < quizQuestions.length) {
                    displayActiveQuestion();
                } else {
                    const todayStr = getTodayString();
                    
                    localStorage.setItem("study_date", todayStr);
                    localStorage.setItem("study_history_session", JSON.stringify(quizQuestions));

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
                                type: "study", // Explicit selector parameter to instruct backend data processing layout 
                                dateString: todayStr,
                                historySession: quizQuestions
                            })
                        });

                        if (syncResponse.ok) {
                            const cloudData = await syncResponse.json();
                            console.log("Cloud backup successful! Active Login Streak:", cloudData.streak);
                        }
                    } catch (syncErr) {
                        console.error("Network synchronization to database failed. Fallback operational structure preserved offline:", syncErr);
                    }

                    renderPersistentReviewMode();
                }
            }
        });
    }

    function renderPersistentReviewMode() {
        quizProgress.textContent = "Study Complete";
        if (actionRow) actionRow.style.display = "flex";
        
        quizActionBtn.disabled = false;
        quizActionBtn.classList.remove("disabled");
        quizActionBtn.classList.add("active");
        quizActionBtn.innerHTML = `Go to DailyReview <i class="fa-solid fa-clock-rotate-left"></i>`;
        
        quizActionBtn.onclick = () => { 
            window.location.href = "dailyreview.html"; 
        };

        let reviewOverviewHtml = `
            <div style="margin-bottom: 24px; background:#e1faf3; padding:16px; border-radius:16px; border:1px solid #00e59b;">
                <h4 style="margin:0 0 4px 0; color:#065f46; font-weight:700;">Daily Study Complete!</h4>
                <p style="margin:0; color:#0f172a; font-size:14px;">You have studied your 5 new words max for today. Here is your summary.</p>
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

            reviewOverviewHtml += `
                <div style="margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px dashed #e2e8f0;">
                    <span class="field-label" style="color:var(--green); font-weight:700;">NEW WORD #${index + 1}</span>
                    <h2 style="font-size: 26px; font-weight:800; color:#0f172a; margin:4px 0 16px 0;">${escapeHtml(q.wordText)}</h2>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${choiceRowsHtml}
                    </div>
                </div>
            `;
        });

        questionArea.innerHTML = reviewOverviewHtml;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    initializeStudyEngine();
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