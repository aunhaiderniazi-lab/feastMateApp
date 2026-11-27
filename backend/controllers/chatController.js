const Food = require('../models/Food');
const Order = require('../models/Order');

const ML_SERVICE_URL = process.env.CHATBOT_ML_URL || 'http://localhost:5001';

const STATIC_RESPONSES = {
    greeting: "Hello! I'm FeastMate's assistant. I can help you browse the menu, check prices, track your order status, or set up a group order. What do you need?",
    goodbye: "Goodbye! Enjoy your meal and come back anytime you're hungry.",
    thanks: "You're welcome! Let me know if you need anything else.",
    bot_identity: "I'm the FeastMate assistant powered by our TF-IDF + Logistic Regression NLP classifier and live MongoDB menu engine.",
    place_order_help: "To place an order: browse the menu on the Home page, click 'Add to Cart', then click 'Proceed to Checkout' in the right sidebar to enter your address and payment method.",
    group_order_help: "To start a group order: click 'Group Order with Friends' in the top bar, create a room code, share it with your friends, and everyone can add items to the shared cart with automatic bill splitting!",
    group_order_join: "To join a group order, ask the host for their FEAST-XXXXXX room code, click 'Group Order with Friends', and enter the code with your name.",
    payment_inquiry: "We currently support Cash on Delivery (COD) and Credit/Debit Card payments at checkout.",
    complaint: "I'm sorry to hear that! Please share your Order ID and issue details with our support team so an admin can resolve it immediately.",
    affirm: "Great, let's continue!",
    deny: "No problem, let me know what you'd like instead.",
    fallback: "Sorry, I didn't quite get that. Try asking about the menu, burgers/pizzas, item prices, your order status, or group ordering!"
};

function fallbackClassify(message) {
    const m = message.toLowerCase().trim();
    if (/\b(hi|hello|hey|salam|assalam|good morning|good evening)\b/.test(m)) return { intent: 'greeting', confidence: 0.85 };
    if (/\b(bye|goodbye|see ya|take care|cya)\b/.test(m)) return { intent: 'goodbye', confidence: 0.85 };
    if (/\b(thank|thanks|thnx|ty|appreciate)\b/.test(m)) return { intent: 'thanks', confidence: 0.85 };
    if (/\b(who are you|what are you|bot|assistant|what can you do)\b/.test(m)) return { intent: 'bot_identity', confidence: 0.85 };
    if (/\b(join|room code|friends order)\b/.test(m)) return { intent: 'group_order_join', confidence: 0.82 };
    if (/\b(group|split|friends|shared cart)\b/.test(m)) return { intent: 'group_order_help', confidence: 0.82 };
    if (/\b(status|track|where is my order|delivered|arriving)\b/.test(m)) return { intent: 'order_status', confidence: 0.85 };
    if (/\b(history|past orders|previous orders|old orders)\b/.test(m)) return { intent: 'order_history', confidence: 0.85 };
    if (/\b(price|cost|how much|rate)\b/.test(m)) return { intent: 'price_inquiry', confidence: 0.85 };
    if (/\b(burger|pizza|drink|fries|side)\b/.test(m)) return { intent: 'category_inquiry', confidence: 0.82 };
    if (/\b(menu|food|dishes|available|serve)\b/.test(m)) return { intent: 'menu_inquiry', confidence: 0.82 };
    if (/\b(pay|payment|cash|card|cod)\b/.test(m)) return { intent: 'payment_inquiry', confidence: 0.82 };
    if (/\b(how to order|place an order|checkout|add to cart)\b/.test(m)) return { intent: 'place_order_help', confidence: 0.82 };
    if (/\b(wrong|cold|late|refund|complaint|missing|issue)\b/.test(m)) return { intent: 'complaint', confidence: 0.82 };
    return { intent: 'fallback', confidence: 0.50 };
}

async function classifyIntent(message) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`ML service returned ${response.status}`);
        return await response.json();
    } catch {
        return fallbackClassify(message);
    }
}

async function buildMenuReply() {
    const foods = await Food.find({}, 'name price category').limit(12);
    if (!foods.length) return "The menu is currently empty. Please check back soon!";
    const list = foods.map(f => `• ${f.name} (${f.category}) - Rs.${f.price}`).join('\n');
    return `Here's what we have on the menu:\n${list}`;
}

async function buildCategoryReply(message) {
    const categories = ['Burger', 'Pizza', 'Sides', 'Drinks'];
    const lowerMsg = message.toLowerCase();
    const found = categories.find(c => lowerMsg.includes(c.toLowerCase()))
        || (lowerMsg.includes('fries') || lowerMsg.includes('side') ? 'Sides' : null)
        || (lowerMsg.includes('soft drink') || lowerMsg.includes('drink') ? 'Drinks' : null);

    if (!found) return "Which category are you interested in — Burger, Pizza, Sides, or Drinks?";
    const items = await Food.find({ category: found }, 'name price');
    if (!items.length) return `We don't have any ${found} items available right now.`;
    const list = items.map(f => `• ${f.name} - Rs.${f.price}`).join('\n');
    return `${found} options:\n${list}`;
}

async function buildPriceReply(message) {
    const foods = await Food.find({}, 'name price');
    const lowerMsg = message.toLowerCase();
    const match = foods.find(f => lowerMsg.includes(f.name.toLowerCase()));
    if (match) return `${match.name} costs Rs.${match.price}.`;
    return "Please tell me the exact item name and I'll check its price for you.";
}

async function buildOrderStatusReply(userId) {
    if (!userId) return "Please log in so I can check your live order status.";
    const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!lastOrder) return "I couldn't find any recent orders for your account.";
    return `Your last order (#${lastOrder._id.toString().slice(-6).toUpperCase()}, Rs.${lastOrder.totalAmount}) is currently: ${lastOrder.status}.`;
}

async function buildOrderHistoryReply(userId) {
    if (!userId) return "Please log in so I can show your order history.";
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5);
    if (!orders.length) return "You don't have any past orders yet.";
    const list = orders.map(o => `• #${o._id.toString().slice(-6).toUpperCase()}: Rs.${o.totalAmount} (${o.status})`).join('\n');
    return `Your recent orders:\n${list}`;
}

const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required!' });
        }
        const { intent, confidence } = await classifyIntent(message);
        let reply;
        switch (intent) {
            case 'menu_inquiry':
                reply = await buildMenuReply();
                break;
            case 'category_inquiry':
                reply = await buildCategoryReply(message);
                break;
            case 'price_inquiry':
                reply = await buildPriceReply(message);
                break;
            case 'order_status':
                reply = await buildOrderStatusReply(req.user?._id);
                break;
            case 'order_history':
                reply = await buildOrderHistoryReply(req.user?._id);
                break;
            default:
                reply = STATIC_RESPONSES[intent] || STATIC_RESPONSES.fallback;
        }
        res.status(200).json({ reply, intent, confidence });
    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ message: 'AI Assistant temporarily unavailable', error: error.message });
    }
};

module.exports = { handleChat };
