import { openDB, loadFolderHandle } from "./dboperations.js";

const dialog = document.getElementById("dialog");
const chooseFolderBtn = document.getElementById("chooseFolder");
let folderHandle = null;

async function saveFolderHandle(handle) {
    const db = await openDB();
    const tx = db.transaction("handles", "readwrite");
    const store = tx.objectStore("handles");
    store.put(handle, "folderHandle");

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ---------- Permission Check ----------
async function verifyPermission(handle) {
    if (!handle) return false;

    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") return true;

    if (permission === "prompt") {
        const newPermission = await handle.requestPermission({
            mode: "readwrite",
        });
        return newPermission === "granted";
    }
    return false;
}

addEventListener("DOMContentLoaded", async () => {
    await openDB();
    try {
        const storedHandle = await loadFolderHandle();
        if (storedHandle && (await verifyPermission(storedHandle))) {
            folderHandle = storedHandle;
            console.log("Restored folder handle with permissions granted.");
        } else {
            console.log("No valid stored handle. Asking user to choose folder...");
            dialog.showModal();
        }
    } catch {
        dialog.showModal();
    }
});

// When user picks a folder manually
chooseFolderBtn.addEventListener("click", async () => {
    try {
        folderHandle = await window.showDirectoryPicker();
        await saveFolderHandle(folderHandle);
        dialog.close();
        console.log("New folder handle saved.");
    } catch (err) {
        console.error("Folder selection canceled or failed:", err);
    }
});

// ---------- File Saving ----------
export async function saveFile(personArray, room, quantity) {
    try {
        // If no folder handle, ask user
        if (!folderHandle) {
            folderHandle = await window.showDirectoryPicker();
            await saveFolderHandle(folderHandle);
        }

        const date = new Date();
        const filename = `Zimmer ${room} am ${getFormatDateForFilename(true, date)} mit ${quantity} Person(en).txt`;

        // Create file handle
        const fileHandle = await folderHandle.getFileHandle(filename, {
            create: true,
        });

        // Write file content
        const writable = await fileHandle.createWritable();
        await writable.write(`Zimmer ${room} am ${getFormatDateForFilename(false, date)}\n\n`);

        for (let p of personArray) {
            await writable.write(`Person ${personArray.indexOf(p) + 1}\n`);
            await writable.write(
                `Vorname: ${p.firstname}\nNachname: ${p.lastname}\nE-Mail: ${p.email}\nLand: ${p.country}\nOrt: ${p.city}\nPLZ: ${p.zipcode}\nStraße: ${p.street}\nHausnummer: ${p.housenumber}\n\n`
            );
        }

        await writable.close();
        console.log(`Saved file: ${filename}`);
    } catch (err) {
        console.error("Failed to save file:", err);
    }
}

function getFormatDateForFilename(isFilename, date = new Date()) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    if (isFilename) return `${day}-${month}-${year} ${hours}-${minutes}`;
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}
