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

    let d = new Date();
    for (let person of personArray) {
        let newCheckin = structuredClone(person);
        d.setTime(d.getTime() + 1000); // for sorting purpose to get always same result
        newCheckin.room = room;
        newCheckin.date = d;
        newCheckin.imported = 0;
        const addRequest = objectStore.add(newCheckin);
        addRequest.onsuccess = () => console.log("Saved:", newCheckin);
        addRequest.onerror = () => console.error("Error adding check-in:", addRequest.error);
    }

    transaction.oncomplete = () => console.log("All check-ins processed successfully.");
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

export async function changeCheckInStatus(id, status) {
    const db = await openDB();
    const transaction = db.transaction("check_ins", "readwrite");
    const store = transaction.objectStore("check_ins");

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
            console.log("Entry does not exist, id:", id);
        }
        const updated = { ...existing, imported: status };
        store.put(updated);
    };
}
