// "Rahul Kumar Sharma" -> "Rahul S."; enough to confirm a recipient without exposing a full name
function maskName(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)

    if (parts.length === 0) {
        return "Account holder"
    }

    const first = parts[0]
    const last = parts[parts.length - 1]

    return parts.length > 1 ? `${first} ${last[0].toUpperCase()}.` : first
}

module.exports = maskName
