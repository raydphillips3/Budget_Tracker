let db;
const request = indexedDB.open("tracker", 1);


request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("pendingTrans", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Uh oh " + event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["pendingTrans"], "readwrite");
  const store = transaction.objectStore("pendingTrans");
  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["pendingTrans"], "readwrite");
  const store = transaction.objectStore("pendingTrans");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(["pendingTrans"], "readwrite");
        const store = transaction.objectStore("pendingTrans");
        let request = store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);