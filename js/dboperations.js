/**********************************************************
indexDB Setup
**********************************************************/
export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("hotelCheckinDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("check_ins")) {
                const objectStore = db.createObjectStore("check_ins", {
                    keyPath: "id",
                    autoIncrement: true,
                });
                objectStore.createIndex("imported", "imported", {
                    unique: false,
                });
                console.log('Object store "check_ins" created.');
            }

            // Create "handles" object store
            if (!db.objectStoreNames.contains("handles")) {
                db.createObjectStore("handles");
                console.log('Object store "handles" created.');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log("Database opened successfully.");
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("Database error:", event.target.errorCode);
            reject(event.target.error);
        };
    });
}

export async function storeCheckIns(personArray, room) {
    const db = await openDB();
    const transaction = db.transaction(["check_ins"], "readwrite");
    const objectStore = transaction.objectStore("check_ins");

    for (let person of personArray) {
        let newCheckin = structuredClone(person);
        newCheckin.room = room;
        newCheckin.date = new Date();
        newCheckin.imported = 0;

        const addRequest = objectStore.add(newCheckin);
        addRequest.onsuccess = () => console.log("Saved:", newCheckin);
        addRequest.onerror = () => console.error("Error adding check-in:", addRequest.error);
    }

    transaction.oncomplete = () => console.log("All check-ins processed successfully.");
}

// Load the folder handle
export async function loadFolderHandle() {
    const db = await openDB();
    const tx = db.transaction("handles", "readonly");
    const store = tx.objectStore("handles");

    return new Promise((resolve) => {
        const request = store.get("folderHandle");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

export async function getCheckIns(imported = 99) {
    const db = await openDB();
    const transaction = db.transaction("check_ins", "readonly");
    const store = transaction.objectStore("check_ins");

    // Get the index
    const importedIndex = store.index("imported");

    return new Promise((resolve, reject) => {
        let request = imported == 99 ? importedIndex.getAll() : importedIndex.getAll(IDBKeyRange.only(imported));

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export async function importCheckIn(id) {
    const db = await openDB();
    const transaction = db.transaction("check_ins", "readwrite");
    const store = transaction.objectStore("check_ins");

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
            console.log("Entry does not exist, id:", id);
        }
        const updated = { ...existing, imported: 1 };
        store.put(updated);
    };
}
