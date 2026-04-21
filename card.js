function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let currentEntries = [];

function loadCards() {
  let entries = JSON.parse(localStorage.getItem("dictionary")) || [];
  let container = document.getElementById("card-holder");

  if (entries.length === 0) return;

  currentEntries = shuffle([...entries]); // copy + shuffle

  let html = "";

  currentEntries.forEach((entry, index) => {
    let options = getOptions(currentEntries, index);

    let optionsHTML = options.map(option => `
      <a onclick="checkAnswer(${index}, '${option.replace(/'/g, "\\'")}', this)">
    ${option}
  </a>
    `).join("");

    html += `
      <div class="card">
        <h3>${entry.word.toUpperCase()}</h3>
        <div class="options">${optionsHTML}</div>
        <div id="result-${index}" class="result"></div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleMeaning(index) {
  let meaningDiv = document.getElementById("meaning-" + index);

  if (meaningDiv.style.display === "none") {
    meaningDiv.style.display = "block";
  } else {
    meaningDiv.style.display = "none";
  }
}

function getOptions(entries, correctIndex) {
  let options = [entries[correctIndex].meaning];

  while (options.length < 3) {
    let randomIndex = Math.floor(Math.random() * entries.length);
    let randomMeaning = entries[randomIndex].meaning;

    if (!options.includes(randomMeaning)) {
      options.push(randomMeaning);
    }
  }

  return shuffle(options);
}

function checkAnswer(index, selectedOption, element) {
  let correctAnswer = currentEntries[index].meaning;

  // reset all options color first (optional but recommended)
  let allOptions = element.parentElement.querySelectorAll("a");
  allOptions.forEach(opt => opt.style.color = "");

  if (selectedOption === correctAnswer) {
    element.style.color = "var(--primary)";
  } else {
    element.style.color = "var(--secondary)";
  }
}

loadCards();