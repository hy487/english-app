let api = "https://english-app-api-ntyi.onrender.com"


const welcomeText = document.getElementById("welcome")
const name = localStorage.getItem("username")
const token = localStorage.getItem("token");

if (token && welcomeText) {
    if(!name){
        alert("Please login again when you're free")
    }
    welcomeText.innerHTML = "Welcome " + name;
}

async function displayEntries() {
    if (!token) return;

    const res = await fetch(api + "/words", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const entries = await res.json();

    let outputDiv = document.getElementById("dict");

    if (!entries.length) {
        return;
    }

    let list = "";
    entries.forEach((word, index) => {
        list += `<div class="word-ctn"><button onclick="remove('${word._id}')">–</button>${word.word}&nbsp;${word.meaning}</div>`;
    });

    if(outputDiv){
        outputDiv.innerHTML = list;
    }
}

displayEntries();

async function addWord() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }
    const word = prompt("New word:");
    if (!word) return;

    const meaning = prompt("Enter the meaning:");
    if (!meaning) return;

    const res = await fetch(api + "/words", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ word, meaning })
    });

    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error("Invalid server response");
    }

    if (res.ok) {
        displayEntries(); // refresh list
    } else {
        alert(data.error);
    }
}

async function remove(id) {
    const token = localStorage.getItem("token");

    await fetch(`${api}/words/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    displayEntries();
}

window.onload = function () {
    const token = localStorage.getItem("token");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (token) {
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline";
    } else {
        if (logoutBtn) logoutBtn.style.display = "none";
    }
};

function logout() {
    localStorage.removeItem("token");
    window.location.href = "https://hy487.github.io/english-app"
    document.getElementById("login-btn").style.display = "inline";
    document.getElementById("logout-btn").style.display = "none";
}