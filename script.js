// Firebase ayarlarını buraya gir
const firebaseConfig = {
  apiKey: "AIzaSyAOWoR2vmyn_VxSnLJWBQXXhSb3GapeTas",
  authDomain: "mesajlar-99680.firebaseapp.com",
  databaseURL: "https://mesajlar-99680-default-rtdb.firebaseio.com",
  projectId: "mesajlar-99680",
  storageBucket: "mesajlar-99680.firebasestorage.app",
  messagingSenderId: "72389173543",
  appId: "1:72389173543:web:4270a610b27cedbc844902"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = "";
let currentGroup = "";

// --- GİRİŞ / KAYIT ---
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Tüm alanları doldur!");

  db.ref("users/" + user).once("value", (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      if (data.password === pass) {
        username = user;
        showGroupScreen();
      } else {
        alert("Yanlış şifre!");
      }
    } else {
      alert("Böyle bir kullanıcı yok!");
    }
  });
}

function register() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Tüm alanları doldur!");

  db.ref("users/" + user).once("value", (snap) => {
    if (snap.exists()) {
      alert("Bu kullanıcı zaten var!");
    } else {
      db.ref("users/" + user).set({ password: pass });
      alert("Kayıt başarılı! Giriş yapabilirsin.");
    }
  });
}

function logout() {
  username = "";
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("group-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "none";
}

// --- GRUPLAR ---
function showGroupScreen() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("group-screen").style.display = "block";
  loadGroups();
}

function loadGroups() {
  const listDiv = document.getElementById("group-list");
  listDiv.innerHTML = "";
  db.ref("groups").once("value", (snap) => {
    snap.forEach((child) => {
      const groupName = child.key;
      const btn = document.createElement("button");
      btn.textContent = groupName;
      btn.onclick = () => enterGroup(groupName);
      listDiv.appendChild(btn);
    });
  });
}

function createGroup() {
  const name = document.getElementById("newGroupName").value.trim();
  if (!name) return alert("Grup adı gir!");
  db.ref("groups/" + name).set({
    members: { [username]: true },
  });
  document.getElementById("newGroupName").value = "";
  loadGroups();
}

function enterGroup(groupName) {
  currentGroup = groupName;
  document.getElementById("group-title").textContent = "Grup: " + groupName;
  document.getElementById("group-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "block";
  loadMessages();
}

function backToGroups() {
  document.getElementById("chat-screen").style.display = "none";
  document.getElementById("group-screen").style.display = "block";
  db.ref("groups/" + currentGroup + "/messages").off(); // dinlemeyi kapat
}

// --- MESAJLAR ---
function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg === "") return;
  db.ref(`groups/${currentGroup}/messages`).push({
    user: username,
    text: msg
  });
  document.getElementById("messageInput").value = "";
}

function loadMessages() {
  const msgBox = document.getElementById("messages");
  msgBox.innerHTML = "";

  db.ref(`groups/${currentGroup}/messages`).on("child_added", (snap) => {
    const data = snap.val();
    const msgDiv = document.createElement("div");

    // Link kontrolü
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const match = data.text.match(urlPattern);
    if (match) {
      const link = match[0];
      msgDiv.innerHTML = `<strong>${data.user}:</strong> ${data.text}
      <br><button onclick="window.open('${link}', '_blank')">🔗 Aç</button>`;
    } else {
      msgDiv.textContent = `${data.user}: ${data.text}`;
    }

    msgBox.appendChild(msgDiv);
    msgBox.scrollTop = msgBox.scrollHeight;
  });
}
