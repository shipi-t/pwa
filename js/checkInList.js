import { getCheckIns, importCheckIn } from "./dboperations.js";
import { fadeIn, fadeOut } from "./animations.js";

const secretDialog = document.getElementById("dialogSecret");
document.getElementById("checkInListBtn").addEventListener("click", () => {
    secretDialog.showModal();
});
document.getElementById("cancelSecretBtn").addEventListener("click", () => {
    secretDialog.close();
});
document.getElementById("checkInListFilterOpen").addEventListener("click", () => {
    showCheckInList(0);
});
document.getElementById("checkInListFilterAll").addEventListener("click", () => {
    showCheckInList(99);
});
document.getElementById("checkInListBack").addEventListener("click", () => {
    location.reload();
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
    showCheckInList(0);
});

async function showCheckInList(imported) {
    // 0 heißt noch nicht fertig.. alternativ auch garnicht mitgeben und alle auswählen...
    const checkIns = await getCheckIns(imported);
    checkIns.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableBody = document.querySelector("#checkInListTable tbody");
    tableBody.innerHTML = "";
    checkIns.forEach((p) => {
        tableBody.innerHTML += `
            <tr>
                <td>${formatDateTime(p.date)}</td>
                <td>${p.firstname}</td>
                <td>${p.lastname}</td>
                <td>${p.email}</td>
                <td>${p.country}</td>
                <td>${p.city}</td>
                <td>${p.zipcode}</td>
                <td>${p.street}</td>
                <td>${p.housenumber}</td>
                <td>${
                    p.imported == 0
                        ? `<button onclick="importEntry(${p.id})" class="importedBtn">Erledigen</button>`
                        : "Erledigt &#9989;"
                }</td>
            </tr>
        `;
        console.log("Incomplete Item:", p);
    });
    fadeOut(document.getElementById("checkInForm"));
    fadeOut(document.getElementById("checkInListBtn"));
    fadeIn(checkInList);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// weil wir in einem modul sind ist die funktion selbst nich global also wirds nicht gefunden... deswegen so:
window.importEntry = async function (id) {
    await importCheckIn(id);
    showCheckInList(0);
};
