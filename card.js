let API = "https://english-app-api-ntyi.onrender.com"

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let currentEntries = [];

async function loadCards() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(`${API}/words`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  if (res.status === 401) {
    logout(); // token expired
    return;
  }

  const entries = await res.json();

  let container = document.getElementById("card-holder");

  if (!entries.length) {
    container.innerHTML = "No words yet";
    return;
  }

  currentEntries = shuffle([...entries]); // keep your logic

  let text = "";

  currentEntries.forEach((entry, index) => {
    let options = getOptions(currentEntries, index);

    let optionsHTML = options.map(option => `
      <a onclick="checkAnswer(${index}, this)" data-answer="${option}">${option}</a>
    `).join("");

    text += `
      <div class="card">
        <h3>${entry.word.toUpperCase()}</h3>
        <div class="options">${optionsHTML}</div>
        <div id="result-${index}" class="result"></div>
      </div>
    `;
  });

  container.innerHTML = text;
}

function getOptions(entries, correctIndex) {
  let options = [entries[correctIndex].meaning];

  // Calculate how many choices we can actually show (max 3)
  let maxChoices = Math.min(entries.length, 3);

  while (options.length < maxChoices) {
    let randomIndex = Math.floor(Math.random() * entries.length);
    let randomMeaning = entries[randomIndex].meaning;

    if (!options.includes(randomMeaning)) {
      options.push(randomMeaning);
    }
  }

  return shuffle(options);
}

function checkAnswer(index, element) {
  let selectedOption = element.dataset.answer;
  let correctAnswer = currentEntries[index].meaning;

  let allOptions = element.parentElement.querySelectorAll("a");
  allOptions.forEach(opt => opt.style.color = "");

  if (selectedOption === correctAnswer) {
    element.style.color = "var(--primary)";
  } else {
    element.style.color = "var(--secondary)";
  }
}

loadCards();