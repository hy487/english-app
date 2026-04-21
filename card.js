function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function loadCards() {
    let entries = JSON.parse(localStorage.getItem("dictionary")) || [];
    let container = document.getElementById("card-holder");

    if (entries.length === 0) {
      container.textContent = "No words available.";
      return;
    }

    // Shuffle entries
    entries = shuffle(entries);

    let html = "";

    entries.forEach((entry, index) => {
      html += `
        <div class="card">
          <h3>${entry.word.toUpperCase()}</h3>
          <a onclick="toggleMeaning(${index})">
            meaning
          </a>
          <div id="meaning-${index}" class="meaning">
            ${entry.meaning}
          </div>
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

  // Load cards when page loads
  loadCards();