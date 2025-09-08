const dialog = document.getElementById("dialog");
const chooseFolderBtn = document.getElementById("chooseFolder");
let folderHandle = null;

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
    dialog.showModal();
});

// When user picks a folder manually
chooseFolderBtn.addEventListener("click", async () => {
    try {
        folderHandle = await window.showDirectoryPicker();
        await writeDummyFile();
        dialog.close();
        // console.log("New folder handle saved.");
    } catch (err) {
        // console.error("Folder selection canceled or failed:", err);
    }
});

// write dummy file so the permission get asked all at once at beginning and not afterwards when writing the file
async function writeDummyFile() {
    const filename = `Berechtigungen.txt`;
    const fileHandle = await folderHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(`Datei nur Berechtigungen erstellt`);
    await writable.close();
}

// ---------- File Saving ----------
export async function saveFile(personArray, room, quantity) {
    try {
        // If no folder handle, ask user
        let isPermitted = await verifyPermission(folderHandle);
        if (!isPermitted) {
            folderHandle = await window.showDirectoryPicker();
            await writeDummyFile();
            dialog.close();
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
                `Vorname: ${p.firstname}\nNachname: ${p.lastname}\nE-Mail: ${p.email}\nLand: ${p.country}\nOrt: ${p.city}\nPLZ: ${p.zipcode}\nStraße: ${p.street}\nNationalität: ${p.nationality}\n\n`
            );
        }

        await writable.close();
        // console.log(`Saved file: ${filename}`);
    } catch (err) {
        // console.error("Failed to save file:", err);
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
