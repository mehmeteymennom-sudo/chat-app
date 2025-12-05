// Firebase config
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
const auth = firebase.auth();

let username = "";
let currentGroup = "";

// yasaklı kelimeler
const yasakli = ["amk", "orospu", "siktir", "fuck", "sex", "porno", "allah", "şeytan"];
const isimRegex = /^[a-zA-Z0-9_]+$/;

// auth hazır olma kontrolü (diğer fonksiyonlar bunu bekleyebilir)
let authReadyResolve;
const authReady = new Promise((res) => { authReadyResolve = res; });

// Anonim sign-in (auth != null gerektiren DB kuralları için)
auth.signInAnonymously()
  .then((cred) => {
    console.log("Anonim giriş başarılı. uid:", cred.user && cred.user.uid);
    authReadyResolve();
  })
  .catch(err => {
    console.error("Anonim giriş hatası:", err);
    // Yine de authReady'i çöz; aksi halde bekleyen fonksiyonlar sonsuza kadar bekler.
    authReadyResolve();
  });

auth.onAuthStateChanged(user => {
  console.log("onAuthStateChanged:", user && user.uid);
});

// --- GİRİŞ / KAYIT ---
async function login() {
  await authReady;
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Tüm alanları doldur!");

  console.log("Login denemesi:", user);
  db.ref("users/" + user).once("value")
    .then(snap => {
      if (snap.exists()) {
        if (snap.val().password === pass) {
          username = user;
          console.log("Giriş başarılı:", user);
          showGroupScreen();
        } else {
          console.warn("Yanlış şifre for user:", user);
          alert("Yanlış şifre!");
        }
      } else {
        console.warn("Kullanıcı bulunamadı:", user);
        alert("Kullanıcı bulunamadı!");
      }
    })
    .catch(err => {
      console.error("DB okuma hatası (login):", err);
      alert("Sunucu hatası. Konsolu kontrol et.");
    });
}

async function register() {
  await authReady;
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (!user || !pass) return alert("Tüm alanları doldur!");

  if (user.length < 3 || user.length > 15) return alert("Kullanıcı adı 3-15 karakter olmalı!");
  if (!isimRegex.test(user)) return alert("Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir!");
  const kucukUser = user.toLowerCase();
  if (yasakli.some(kelime => kucukUser.includes(kelime))) return alert("Bu kullanıcı adı uygun değil!");

  console.log("Register denemesi:", user);
  db.ref("users/" + user).once("value")
    .then(snap => {
      if (snap.exists()) {
        alert("Bu kullanıcı zaten var!");
      } else {
        // set işlemini promise ile yapıyoruz
        return db.ref("users/" + user).set({ password: pass });
      }
    })
    .then(() => {
      // eğer set başarılıysa, önceki then null dönebileceği için kontrol et
      console.log("Kayıt başarılı:", user);
      alert("Kayıt başarılı! Giriş yapabilirsin.");
    })
    .catch(err => {
      console.error("DB yazma/okuma hatası (register):", err);
      alert("Kayıt yapılamadı. Konsolu kontrol et.");
    });
}

function logout() {
  username = "";
  currentGroup = "";
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("group-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "none";
}

// --- GRUP / MESAJ fonksiyonları (orijinalinle aynı, sadece hata logu ekledim) ---
function showGroupScreen() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("group-screen").style.display = "block";
  loadGroups();
}

function loadGroups() {
  const listDiv = document.getElementById("group-list");
  listDiv.innerHTML = "";
  db.ref("groups").once("value")
    .then(snap => {
      snap.forEach(child => {
        const groupName = child.key;
        const members = child.val().members || {};
        if (members[username]) {
          const btn = document.createElement("button");
          btn.textContent = groupName;
          btn.onclick = () => enterGroup(groupName);
          listDiv.appendChild(btn);
        }
      });
    })
    .catch(err => {
      console.error("loadGroups hata:", err);
    });
}

function createGroup() {
  const name = document.getElementById("newGroupName").value.trim();
  const memberStr = document.getElementById("memberNames").value.trim();
  if (!name) return alert("Grup adı gir!");
  if (!memberStr) return alert("Üyeleri gir! (virgülle ayır)");

  if (name.length < 3 || name.length > 20) return alert("Grup adı 3-20 karakter olmalı!");
  if (!isimRegex.test(name)) return alert("Grup adı sadece harf, rakam ve alt çizgi içerebilir!");
  const kucukGroup = name.toLowerCase();
  if (yasakli.some(kelime => kucukGroup.includes(kelime))) return alert("Bu grup adı uygun değil!");

  const membersArray = memberStr.split(",").map(m => m.trim()).filter(Boolean);
  const membersObj = {};
  membersArray.forEach(m => membersObj[m] = true);
  membersObj[username] = true;

  db.ref("groups/" + name).set({ members: membersObj })
    .then(() => {
      document.getElementById("newGroupName").value = "";
      document.getElementById("memberNames").value = "";
      alert("Grup oluşturuldu!");
      loadGroups();
    })
    .catch(err => {
      console.error("createGroup hata:", err);
      alert("Grup oluşturulamadı. Konsolu kontrol et.");
    });
}

function enterGroup(name) {
  currentGroup = name;
  document.getElementById("group-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "block";
  document.getElementById("group-title").textContent = "Grup: " + name;
  loadMessages();
}

function backToGroups() {
  document.getElementById("chat-screen").style.display = "none";
  document.getElementById("group-screen").style.display = "block";
  db.ref("groups/" + currentGroup + "/messages").off();
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg === "") return;

  if (username.toLowerCase() === "eymen" && msg.toLowerCase() === "clear") {
    db.ref(`groups/${currentGroup}/messages`).remove()
      .then(() => {
        document.getElementById("messages").innerHTML = "";
        document.getElementById("messageInput").value = "";
      })
      .catch(err => console.error("clear hata:", err));
    return;
  }

  db.ref(`groups/${currentGroup}/messages`).push({
    user: username,
    text: msg
  }).catch(err => {
    console.error("sendMessage hata:", err);
    alert("Mesaj gönderilemedi.");
  });

  document.getElementById("messageInput").value = "";
}

function loadMessages() {
  const box = document.getElementById("messages");
  box.innerHTML = "";
  db.ref(`groups/${currentGroup}/messages`).on("child_added", snap => {
    const data = snap.val();
    if (!data) return;
    const msgDiv = document.createElement("div");
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const match = data.text && data.text.match(urlPattern);
    if (match) {
      const link = match[0];
      msgDiv.innerHTML = `<strong>${data.user}:</strong> ${data.text}<br>
        <button onclick="window.open('${link}', '_blank')">🔗 Aç</button>`;
    } else {
      msgDiv.textContent = `${data.user}: ${data.text}`;
    }
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
  });
}
