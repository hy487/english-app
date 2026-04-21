console.log(localStorage)

function displayEntries() {
    let entries = JSON.parse(localStorage.getItem("dictionary")) || [];
    let outputDiv = document.getElementById("dict")
     if (entries.length === 0) {
      return;
    }
    let list = ""
    entries.forEach((word, index) => {
        list = list + "<br>" +  word.word + " - " + word.meaning + " " + `<button onclick="remove(${index})">-</button>`
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

function remove(index){
    let entries = JSON.parse(localStorage.getItem("dictionary")) || []
    entries.splice(index, 1);
    localStorage.setItem("dictionary",JSON.stringify(entries))

    displayEntries()
}