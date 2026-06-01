const password = document.getElementById('password');
const username = document.getElementById("account")
const toggleBtn = document.querySelector('.toggle-password');
const API = "https://english-app-api-ntyi.onrender.com"

const loginForm = document.querySelector('.login-form');

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault(); 
    login(); 
});

toggleBtn.addEventListener('click', () => {
  const isPassword = password.getAttribute('type') === 'password';
  password.setAttribute('type', isPassword ? 'text' : 'password');
  
  toggleBtn.style.color = isPassword ? 'var(--text-dark)' : 'var(--text-muted)';
});

async function login(){
    const usernameValue = username.value.trim();
    const passwordValue = password.value;

    if (!usernameValue || !passwordValue) {
        alert("Please fill in all fields");
        return;
    }

    console.log("logged in!")
    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: usernameValue, password: passwordValue })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Login failed");
            return;
        }

        localStorage.setItem("token", data.token);
        window.location.href = "index.html";

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

async function register(event) {
    if (event) event.preventDefault(); 

    const usernameValue = username.value.trim();
    const passwordValue = password.value;

    if (!usernameValue || !passwordValue) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const res = await fetch(`${API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                username: usernameValue, 
                password: passwordValue 
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Registration failed");
            return;
        }

        alert("Registered successfully!");
        window.location.href = "login.html";

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

const registerForm = document.querySelector('.register-form'); 
    registerForm?.addEventListener('submit', register);