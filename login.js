const API = "https://english-app-api-ntyi.onrender.com"

// REGISTER
async function register() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    if (!username || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        alert("Registered successfully!");
        window.location.href = "login.html";

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}


// LOGIN
async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username)
        window.location.href = "index.html";

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}