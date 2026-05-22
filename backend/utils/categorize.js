// ─── Keyword-based Smart Categorization ──────────────────────────────
const categoryKeywords = {
    "Food & Dining": [
        "food", "restaurant", "cafe", "coffee", "pizza", "burger", "lunch",
        "dinner", "breakfast", "snack", "swiggy", "zomato", "meal", "eat",
        "hotel", "dhaba", "biryani", "tea", "juice", "bakery",
    ],
    Transportation: [
        "uber", "ola", "cab", "taxi", "bus", "metro", "train", "fuel",
        "petrol", "diesel", "auto", "rickshaw", "flight", "rapido",
        "parking", "toll", "transport",
    ],
    Shopping: [
        "amazon", "flipkart", "myntra", "clothes", "shoes", "shirt",
        "dress", "shopping", "mall", "market", "buy", "purchase",
        "grocery", "supermarket", "store",
    ],
    Entertainment: [
        "movie", "netflix", "spotify", "game", "concert", "show",
        "theatre", "cinema", "hotstar", "prime", "youtube", "music",
        "subscription", "fun", "party",
    ],
    "Health & Medical": [
        "doctor", "hospital", "medicine", "pharmacy", "medical", "health",
        "clinic", "gym", "fitness", "yoga", "chemist", "tablet", "injection",
    ],
    "Bills & Utilities": [
        "electricity", "water", "gas", "internet", "wifi", "phone", "bill",
        "recharge", "broadband", "rent", "maintenance", "society",
    ],
    Education: [
        "course", "book", "school", "college", "fees", "tuition", "exam",
        "study", "class", "workshop", "udemy", "coaching",
    ],
    Travel: [
        "hotel", "resort", "trip", "tour", "travel", "vacation", "holiday",
        "flight", "booking", "airbnb", "oyo", "makemytrip",
    ],
    "Personal Care": [
        "salon", "haircut", "spa", "beauty", "cosmetics", "makeup",
        "grooming", "parlour", "nykaa",
    ],
};

const smartCategorize = (title, notes = "") => {
    const text = `${title} ${notes}`.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((keyword) => text.includes(keyword))) {
            return category;
        }
    }

    return "Other";
};

module.exports = { smartCategorize };