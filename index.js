function displayEntries() {
    let entries = JSON.parse(localStorage.getItem("dictionary")) || [];
    let outputDiv = document.getElementById("dict")
     if (entries.length === 0) {
      return;
    }
    let list = ""
    entries.forEach(word => {
        list = list + "<br>" +  word.word + " - " + word.meaning
    })

    outputDiv.innerHTML = list
}

displayEntries();

function addWord() {
    let word = prompt("New word:");
    if (!word) return;

    let meaning = prompt("Enter the meaning:");
    if (!meaning) return;

    let entries = JSON.parse(localStorage.getItem("dictionary")) || [];
    entries.push({ word: word, meaning: meaning });
    localStorage.setItem("dictionary", JSON.stringify(entries));
    displayEntries();
}