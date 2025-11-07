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
  username = document.getElementById("username").value;
  if (!username) return alert("Kullanıcı adı gir!");
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-screen").style.display = "block";
}

function sendMessage() {
  const msg = document.getElementById("messageInput").value;
  if (msg.trim() === "") return;
  db.ref("messages").push({
    user: username,
    text: msg
  });
  document.getElementById("messageInput").value = "";
}

db.ref("messages").on("child_added", (snapshot) => {
  const data = snapshot.val();
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${data.user}: ${data.text}`;
  document.getElementById("messages").appendChild(msgDiv);
});
