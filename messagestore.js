const MAX_STORE = 500;
const store = new Map();

function saveMessage(jid, sender, text, timestamp, pushName = "Unknown") {
    if (!store.has(jid)) store.set(jid, []);

    const arr = store.get(jid);

    arr.push({
        sender,
        text,
        time: timestamp,
        pushName
    });

    if (arr.length > MAX_STORE) {
        arr.splice(0, arr.length - MAX_STORE);
    }
}

function getLastMessages(jid, count) {
    if (!store.has(jid)) return [];
    return store.get(jid).slice(-count);
}

module.exports = {
    saveMessage,
    getLastMessages
};
