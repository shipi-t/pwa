import { getCheckIns, changeCheckInStatus } from "./dboperations.js";
import { fadeIn, fadeOut } from "./animations.js";
import { resetPage } from "./index.js";

let currentStatus = 0;

const filterOpenBtn = document.getElementById("checkInListFilterOpen");
const filterAllBtn = document.getElementById("checkInListFilterAll");

const secretDialog = document.getElementById("dialogSecret");
document.getElementById("checkInListBtn").addEventListener("click", () => {
    secretDialog.showModal();
});
document.getElementById("cancelSecretBtn").addEventListener("click", () => {
    secretDialog.close();
});
filterOpenBtn.addEventListener("click", () => {
    currentStatus = 0;
    filterAllBtn.classList.add("inactiveBtn");
    filterOpenBtn.classList.remove("inactiveBtn");
    showCheckInList();
});
filterAllBtn.addEventListener("click", () => {
    currentStatus = 99;
    filterAllBtn.classList.remove("inactiveBtn");
    filterOpenBtn.classList.add("inactiveBtn");
    showCheckInList();
});
document.getElementById("checkInListBack").addEventListener("click", () => {
    resetPage();
});

const secretInput = document.getElementById("secret");
const checkInList = document.getElementById("checkInList");
document.getElementById("secretBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const pass = secretInput.value;
    secretInput.value = "";
    if (pass != "urfa") {
        secretInput.style.borderColor = "red";
        return;
    }
    secretDialog.close();
    fadeOut(document.getElementById("checkInListBtn"));
    showCheckInList();
});

async function showCheckInList() {
    // 0 heißt noch nicht fertig.. alternativ auch garnicht mitgeben und alle auswählen...
    const checkIns = await getCheckIns(currentStatus);
    checkIns.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableBody = document.querySelector("#checkInListTable tbody");
    tableBody.innerHTML = "";
    checkIns.forEach((p) => {
        tableBody.innerHTML += `
            <tr>
                <td>${formatDateTime(p.date)}</td>
                <td>${p.room}</td>
                <td>${p.name}</td>
                <td>${p.birthdate}</td>
                <td>${p.nationality}</td>
                <td>${p.contact}</td>
                <td>${p.country}</td>
                <td>${p.city}</td>
                <td>${p.zipcode}</td>
                <td>${p.street}</td>
                ${
                    p.imported == 0
                        ? `<td>&#10060;</td>
                            <td><button onclick="changeEntryStatus(${p.id}, 1)" class="importCheckInBtn">Fertig</button></td>`
                        : `<td>&#9989;</td>
                            <td><button onclick="changeEntryStatus(${p.id}, 0)" class="importCheckInUndoBtn">Zurück</button></td>`
                }
                
            </tr>
        `;
    });
    fadeOut(document.getElementById("checkInForm"));
    fadeIn(checkInList);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// weil wir in einem modul sind ist die funktion selbst nich global also wirds nicht gefunden... deswegen so:
window.changeEntryStatus = async function (id, status) {
    await changeCheckInStatus(id, status);
    showCheckInList();
};
