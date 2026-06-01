const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');

profileBtn.addEventListener('click', (event) => {
  event.stopPropagation();

  if (profileMenu.open) {
    profileMenu.close();
  } else {
    profileMenu.show(); 
  }
});

window.addEventListener('click', (event) => {
  if (profileMenu.open && !profileMenu.contains(event.target)) {
    profileMenu.close();
  }
});

let api = "https://english-app-api-ntyi.onrender.com"
const token = localStorage.getItem("token");

if(!token){
    window.location.href = "login.html"
}

function logout() {
  console.log("logout")
  localStorage.removeItem("token");
  window.location.href = "login.html"
}

function redir(link){
  window.location.href = link
}

async function loadUserStreak() {

    if (!token) return;

    try {
        const response = await fetch(`${api}/user/progress`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            
            const currentStreak = userData.streak || 0;
            
            console.log("Current User Streak from DB:", currentStreak);

            const streakElement = document.getElementById("streak-num");
            if (streakElement) {
                streakElement.innerHTML = currentStreak;
            }
        }
    } catch (error) {
        console.error("Error fetching user streak from MongoDB:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadUserStreak);
document.addEventListener("DOMContentLoaded", () => {
    const burgerBtn = document.getElementById("burger");
    const mobileSidebar = document.getElementById("mobileSidebar");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");

    if (burgerBtn && mobileSidebar) {
        burgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileSidebar.showModal(); 
        });
    }

    if (closeSidebarBtn && mobileSidebar) {
        closeSidebarBtn.addEventListener("click", () => {
            mobileSidebar.close();
        });
    }

    if (mobileSidebar) {
        mobileSidebar.addEventListener("click", (e) => {
            const dialogDimensions = mobileSidebar.getBoundingClientRect();
            if (
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom
            ) {
                mobileSidebar.close();
            }
        });
    }
});