if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("./service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("Service Worker registration failed:", err));
}

import { fadeIn, fadeOut } from "./animations.js";
import { storeCheckIns } from "./dboperations.js";
import { saveFile } from "./fileoperations.js";

const roomInput = document.getElementById("room");
const quantityInput = document.getElementById("quantity");
const startCheckInBtn = document.getElementById("startCheckInBtn");
const cancelCheckInBtn = document.getElementById("cancelCheckInBtn");
const personDiv = document.getElementById("person");
const overview = document.querySelector(".overview");
const tabsDiv = document.querySelector(".tabs");
const focusableElements = document.querySelectorAll("input");

const inputFieldsIDs = ["firstname", "lastname", "email", "country", "city", "street", "zipcode", "housenumber"];

let room = "";
let quantity = 0;
let personArray = [];

startCheckInBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!validateElement("room") || !validateElement("quantity")) {
        return;
    }
    roomInput.style.borderColor = "#CCC";
    quantityInput.style.borderColor = "#CCC";
    roomInput.readOnly = true;
    quantityInput.readOnly = true;
    room = roomInput.value;
    quantity = quantityInput.value;
    cancelCheckInBtn.classList.remove("hidden");
    startCheckInBtn.classList.add("hidden");
    showForm();
});

cancelCheckInBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetPage();
});

export function resetPage() {
    personArray = [];
    roomInput.readOnly = false;
    quantityInput.readOnly = false;
    roomInput.value = "";
    quantityInput.value = "";
    cancelCheckInBtn.classList.add("hidden");
    startCheckInBtn.classList.remove("hidden");
    tabsDiv.innerHTML = "";
    personDiv.classList.add("hidden");
    overview.classList.add("hidden");
    document.querySelector("#overviewTable tbody").innerHTML = "";
    document.getElementById("checkInList").classList.add("hidden");
    document.querySelector("#checkInListTable tbody").innerHTML = "";
    fadeIn(document.getElementById("checkInForm"));
    fadeIn(document.getElementById("checkInListBtn"));
}

function showForm() {
    if (personArray.length < quantity) {
        personArray.push(getNewObject());
        let len = personArray.length;
        tabsDiv.innerHTML += `
            <label for="option${len}" class="radio-label">${len}<input type="radio" id="option${len}" name="choice" value="${len}"></label>
        `;
        showPersonform(len);
    } else {
        setActiveTab(-1);
        showOverview();
    }
}

tabsDiv.addEventListener("click", async (e) => {
    e.preventDefault();
    const label = e.target;
    // sonst tippt man aufs DIV im hintergrund und die Funktion wird getriggert
    if (label.nodeName.toUpperCase() != "LABEL") return;
    const input = label.children[0];
    if (!isValid(validateForm())) {
        return;
    }
    writePersonIntoArray();
    await fadeOut(personDiv);
    showPersonform(input.value);
});

async function showOverview() {
    const tableBody = document.querySelector("#overviewTable tbody");
    tableBody.innerHTML = "";
    for (let p of personArray) {
        tableBody.innerHTML += `
            <tr>
                <td>${p.firstname}</td>
                <td>${p.lastname}</td>
                <td>${p.email}</td>
                <td>${p.country}</td>
                <td>${p.city}</td>
                <td>${p.zipcode}</td>
                <td>${p.street}</td>
                <td>${p.housenumber}</td>
            </tr>
        `;
    }
    await fadeIn(overview);
}

async function showPersonform(idx) {
    setActiveTab(idx);
    const p = personArray[idx - 1];
    for (let id of inputFieldsIDs) {
        let ele = document.getElementById(id);
        ele.value = p[id];
        ele.style.borderColor = "#ccc";
    }
    // overview.classList.add("hidden");
    // personDiv.classList.remove("hidden");
    await fadeOut(overview);
    await fadeIn(personDiv);
}

function addNameToTab(obj, idx) {
    let label = document.querySelector(`label[for="option${idx}"]`);
    label.innerHTML = `${idx}${
        obj.firstname != "" ? `-${obj.firstname}` : ""
    }<input type="radio" id="option${idx}" name="choice" value="${idx}">`;
}

function writePersonIntoArray() {
    let idx = getActiveTab();
    if (idx < 0) return;
    const obj = {};
    for (let id of inputFieldsIDs) {
        obj[id] = document.getElementById(id).value;
    }
    personArray[idx - 1] = obj;
    addNameToTab(obj, idx);
}

document.getElementById("nextBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!isValid(validateForm())) {
        return;
    }
    writePersonIntoArray();
    await fadeOut(personDiv);
    showForm();
});

function setActiveTab(idx) {
    const tabs = document.querySelectorAll(`input[type="radio"]`);
    tabs.forEach((ele) => {
        ele.checked = ele.value == idx;
        ele.value == idx
            ? ele.parentElement.classList.add("active-tab")
            : ele.parentElement.classList.remove("active-tab");
    });
}

function getActiveTab() {
    const tabs = document.querySelectorAll(`input[type="radio"]`);
    for (let i = 0; i < tabs.length; i++) {
        const ele = tabs[i];
        if (ele.checked) return ele.value;
    }
    return -99;
}

function validateElement(id) {
    const ele = document.getElementById(id);
    let isV = ele.checkValidity();
    ele.style.borderColor = isV ? "#205c1c" : "red";
    return isV;
}

function validateForm() {
    const obj = {};
    for (let id of inputFieldsIDs) {
        obj[id] = validateElement(id);
    }
    return obj;
}

function isValid(validation) {
    for (let x in validation) {
        if (!validation[x]) return false;
    }
    return true;
}

function getNewObject() {
    if (personArray.length != 0 && document.getElementById("copyAddress").checked) {
        let p = structuredClone(personArray[personArray.length - 1]);
        p.firstname = "";
        p.lastname = "";
        p.email = "";
        return p;
    } else {
        const obj = {};
        for (let id of inputFieldsIDs) {
            obj[id] = "";
        }
        return obj;
    }
}

document.getElementById("finishBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    // if both fail: alert
    let storeSuccess = false;
    let saveSuccess = false;

    try {
        await storeCheckIns(personArray, room);
        storeSuccess = true;
    } catch (err) {}

    // Try saveFile
    try {
        await saveFile(personArray, room, quantity);
        saveSuccess = true;
    } catch (err) {}

    if (!storeSuccess && !saveSuccess) {
        alert("Both operations failed!");
    } else {
        resetPage();
    }
});

document.addEventListener("keydown", (event) => {
    // Check if the pressed key is "Enter" and if an element is currently focused
    if (event.key === "Enter") {
        const currentElement = document.activeElement;
        if (currentElement) {
            event.preventDefault();
            const currentIndex = Array.from(focusableElements).indexOf(currentElement);
            const nextIndex = (currentIndex + 1) % focusableElements.length;
            focusableElements[nextIndex].focus();
        }
    }
});
