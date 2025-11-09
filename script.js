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

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let username = "";

function login() {
  username = document.getElementById("username").value.trim();
  if (!username) return alert("Kullanıcı adı gir!");
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "block";
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg === "") return;

  // Eğer Eymen "clear" yazdıysa, tüm mesajları sil
  if (username.toLowerCase() === "eymen" && msg.toLowerCase() === "clear") {
    db.ref("messages").remove();
    document.getElementById("messages").innerHTML = "";
    document.getElementById("messageInput").value = "";
    return;
  }

  // Normal mesaj gönder
  db.ref("messages").push({
    user: username,
    text: msg
  });

  document.getElementById("messageInput").value = "";
}

// Yeni mesaj eklendiğinde göster
db.ref("messages").on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msgDiv = document.createElement("div");

  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const match = data.text.match(urlPattern);

  if (match) {
    // Link içeren mesaj
    const link = match[0];
    msgDiv.innerHTML = `
      <strong>${data.user}:</strong> ${data.text}
      <br>
      <button style="margin-top:5px; padding:4px 10px; cursor:pointer;" onclick="window.open('${link}', '_blank')">🔗 Aç</button>
    `;
  } else {
    // Normal mesaj
    msgDiv.textContent = `${data.user}: ${data.text}`;
  }

  document.getElementById("messages").appendChild(msgDiv);
  document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
});

// Mesajlar tamamen silindiğinde ekranı da temizle
db.ref("messages").on("value", (snapshot) => {
  if (!snapshot.exists()) {
    document.getElementById("messages").innerHTML = "";
  }
});
