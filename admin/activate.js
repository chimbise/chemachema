import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

var firebaseConfig = {
  apiKey: "AIzaSyCVeRF7CM52jidngi4AmMJJ6dnOMhgAxko",
  authDomain: "calc-c6b1c.firebaseapp.com",
  projectId: "calc-c6b1c",
  storageBucket: "calc-c6b1c.firebasestorage.app",
  messagingSenderId: "751714875802",
  appId: "1:751714875802:web:9ffa30b7ee66579c686223",
  measurementId: "G-L3XCXKVY8R",
};

var app = initializeApp(firebaseConfig);
var db = getFirestore();
var usersRef = collection(db, "registered_users");

var ADMIN_PASSWORD = "admin786";

var isInIframe = window.parent !== window;

var adminLogin = document.getElementById("adminLogin");
var adminDashboard = document.getElementById("adminDashboard");
var adminPassword = document.getElementById("adminPassword");
var adminLoginBtn = document.getElementById("adminLoginBtn");
var adminLoginMsg = document.getElementById("adminLoginMsg");

var activatePhone = document.getElementById("activatePhone");
var activateDays = document.getElementById("activateDays");
var activateBtn = document.getElementById("activateBtn");
var deactivateBtn = document.getElementById("deactivateBtn");
var activateMsg = document.getElementById("activateMsg");
var refreshUsersBtn = document.getElementById("refreshUsersBtn");
var userTableContainer = document.getElementById("userTableContainer");
var allUsers = [];
var filterPhone = document.getElementById("filterPhone");
var filterStatus = document.getElementById("filterStatus");

function getFutureExpiryDate(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function showMsg(el, msg, isError) {
  el.textContent = msg;
  el.style.color = isError ? "#ce2f43" : "#1e9f61";
}

if (isInIframe) {
  adminLogin.setAttribute("hidden", "");
  adminDashboard.removeAttribute("hidden");
  loadUsers();
}

adminLoginBtn.addEventListener("click", function () {
  var entered = adminPassword.value.trim();
  if (entered === ADMIN_PASSWORD) {
    adminLogin.setAttribute("hidden", "");
    adminDashboard.removeAttribute("hidden");
    loadUsers();
  } else {
    showMsg(adminLoginMsg, "Incorrect password", true);
  }
});

adminPassword.addEventListener("keydown", function (e) {
  if ("Enter" === e.key) adminLoginBtn.click();
});

activateBtn.addEventListener("click", async function () {
  var phone = activatePhone.value.trim();
  if (!phone) {
    showMsg(activateMsg, "Enter a phone number", true);
    return;
  }
  activateBtn.disabled = true;
  deactivateBtn.disabled = true;
  try {
    var q = query(usersRef, where("phoneNumber", "==", phone));
    var snapshot = await getDocs(q);
    if (snapshot.empty) {
      showMsg(activateMsg, "Phone number not found. Register the user in Firebase first.", true);
      return;
    }
    var days = Number(activateDays.value);
    var expiryDate = getFutureExpiryDate(days);
    snapshot.forEach(async function (userDoc) {
      await setDoc(
        doc(db, "registered_users", userDoc.id),
        { sub: expiryDate },
        { merge: true }
      );
    });
    showMsg(activateMsg, "Activated " + phone + " until " + expiryDate, false);
    loadUsers();
  } catch (err) {
    showMsg(activateMsg, "Error: " + err.message, true);
  } finally {
    activateBtn.disabled = false;
    deactivateBtn.disabled = false;
  }
});

deactivateBtn.addEventListener("click", async function () {
  var phone = activatePhone.value.trim();
  if (!phone) {
    showMsg(activateMsg, "Enter a phone number", true);
    return;
  }
  deactivateBtn.disabled = true;
  activateBtn.disabled = true;
  try {
    var q = query(usersRef, where("phoneNumber", "==", phone));
    var snapshot = await getDocs(q);
    if (snapshot.empty) {
      showMsg(activateMsg, "Phone number not found.", true);
      return;
    }
    snapshot.forEach(async function (userDoc) {
      await setDoc(
        doc(db, "registered_users", userDoc.id),
        { sub: "false" },
        { merge: true }
      );
    });
    showMsg(activateMsg, "Deactivated " + phone, false);
    loadUsers();
  } catch (err) {
    showMsg(activateMsg, "Error: " + err.message, true);
  } finally {
    activateBtn.disabled = false;
    deactivateBtn.disabled = false;
  }
});

refreshUsersBtn.addEventListener("click", loadUsers);

document.getElementById("adminBackBtn").addEventListener("click", function () {
  window.parent.postMessage({ action: "closeAdmin" }, "*");
});

async function loadUsers() {
  refreshUsersBtn.disabled = true;
  refreshUsersBtn.textContent = "Loading...";
  try {
    var snapshot = await getDocs(usersRef);
    var users = [];
    snapshot.forEach(function (doc) {
      var data = doc.data();
      var sub = data.sub || "false";
      var status;
      if (sub === "true") {
        status = "Active (legacy)";
      } else if (sub === "false" || !sub) {
        status = "Expired";
      } else {
        var now = new Date();
        var expiry = new Date(sub);
        status = now > expiry ? "Expired (" + sub + ")" : "Active until " + sub;
      }
      var isActive = status.indexOf("Active") === 0;
      users.push({
        phone: data.phoneNumber || "",
        docId: doc.id,
        sub: sub,
        status: status,
        isActive: isActive,
      });
    });
    allUsers = users;
    filterAndRender();
  } catch (err) {
    userTableContainer.innerHTML = "<p style='color:#ce2f43'>Failed to load: " + err.message + "</p>";
  } finally {
    refreshUsersBtn.disabled = false;
    refreshUsersBtn.textContent = "Refresh";
  }
}
function filterAndRender() {
  var phoneFilter = (filterPhone && filterPhone.value || "").trim().toLowerCase();
  var statusFilter = filterStatus && filterStatus.value || "all";
  var filtered = allUsers.filter(function (u) {
    if (phoneFilter && u.phone.toLowerCase().indexOf(phoneFilter) === -1) {
      return false;
    }
    if (statusFilter === "active" && !u.isActive) {
      return false;
    }
    if (statusFilter === "expired" && u.isActive) {
      return false;
    }
    return true;
  });
  renderUserTable(filtered);
}
filterPhone && filterPhone.addEventListener("input", function () {
  filterAndRender();
});
filterStatus && filterStatus.addEventListener("change", function () {
  filterAndRender();
});

function renderUserTable(users) {
  if (!users.length) {
    userTableContainer.innerHTML = "<p>No users match the filter.</p>";
    return;
  }
  var html = "<table><thead><tr><th>Phone</th><th>Doc ID</th><th>Status</th><th>Action</th></tr></thead><tbody>";
  users.forEach(function (u) {
    var actionHtml;
    if (u.isActive) {
      actionHtml = "<button class=\"action-btn action-deactivate\" data-docid=\"" + u.docId + "\">Deactivate</button>";
    } else {
      actionHtml = "<button class=\"action-btn action-activate\" data-docid=\"" + u.docId + "\">Activate</button>";
    }
    html += "<tr><td>" + u.phone + "</td><td>" + u.docId + "</td><td>" + u.status + "</td><td>" + actionHtml + "</td></tr>";
  });
  html += "</tbody></table>";
  userTableContainer.innerHTML = html;

  document.querySelectorAll(".action-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var docId = btn.getAttribute("data-docid");
      if (btn.classList.contains("action-deactivate")) {
        quickDeactivate(docId);
      } else {
        quickActivate(docId);
      }
    });
  });
}
async function quickActivate(docId) {
  try {
    var expiryDate = getFutureExpiryDate(31);
    await setDoc(
      doc(db, "registered_users", docId),
      { sub: expiryDate },
      { merge: true }
    );
    loadUsers();
  } catch (err) {
    console.error("Quick activate failed:", err);
  }
}
async function quickDeactivate(docId) {
  try {
    await setDoc(
      doc(db, "registered_users", docId),
      { sub: "false" },
      { merge: true }
    );
    loadUsers();
  } catch (err) {
    console.error("Quick deactivate failed:", err);
  }
}
