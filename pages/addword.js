document.addEventListener("DOMContentLoaded", () => {
    const wordInput = document.getElementById("newWordInput");
    const meaningInput = document.getElementById("newMeaningInput");
    const submitBtn = document.getElementById("submitWordBtn");

    const api = "https://english-app-api-ntyi.onrender.com";
    const token = localStorage.getItem("token");

    if(!token) window.location.href = "../login.html"

    function validateFormInputs() {
        const wordValue = wordInput.value.trim();
        const meaningValue = meaningInput.value.trim();

        if (wordValue !== "" && meaningValue !== "") {
            submitBtn.disabled = false;
            submitBtn.classList.remove("disabled");
            submitBtn.classList.add("active");
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.remove("active");
            submitBtn.classList.add("disabled");
        }
    }

    if (wordInput && meaningInput) {
        wordInput.addEventListener("input", validateFormInputs);
        meaningInput.addEventListener("input", validateFormInputs);
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const wordValue = wordInput.value.trim();
            const meaningValue = meaningInput.value.trim();

            if (!wordValue || !meaningValue) return;
            if (!token) {
                window.location.href = "../login.html";
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `Saving... <i class="fa-solid fa-spinner fa-spin"></i>`;

                const response = await fetch(`${api}/words`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        word: wordValue,
                        meaning: meaningValue
                    })
                });

                if (!response.ok) {
                    throw new Error("Server rejected the request.");
                }

                const result = await response.json();
                console.log("Success saving word:", result);

                wordInput.value = "";
                meaningInput.value = "";
                
                submitBtn.innerHTML = `Saved! <i class="fa-solid fa-check"></i>`;
                submitBtn.style.backgroundColor = "#10b981";
                submitBtn.style.color = "#ffffff";

                setTimeout(() => {
                    submitBtn.style.backgroundColor = "";
                    submitBtn.style.color = "";
                    validateFormInputs(); 
                    
                    window.location.href = "mydictionary.html";
                }, 2000);

            } catch (err) {
                console.error("Database storage error details:", err);
                alert("Failed to save word to MongoDB. Please try again.");
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Save Word <i class="fa-solid fa-arrow-right"></i>`;
            }
        });
    }
});