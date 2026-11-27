import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [foods, setFoods] = useState([]);
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! Ask me about the FeastMate menu, prices, orders, or group ordering." }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/foods`)
      .then((res) => setFoods(Array.isArray(res.data) ? res.data : res.data.foods || []))
      .catch(() => setFoods([]));
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x._id === item._id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/api/chat/message`, { message: trimmed }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply || 'No reply.' }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Assistant offline.' }]);
    }
  };

  const visibleFoods = category === 'All' ? foods : foods.filter((f) => f.category === category);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>FeastMate</h2>
        <div>
          <button onClick={() => setChatOpen((o) => !o)} style={{ marginRight: 8 }}>Assistant</button>
          <span>Cart: {cart.reduce((s, i) => s + i.qty, 0)} (Rs.{total})</span>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Burger', 'Pizza', 'Sides', 'Drinks'].map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ fontWeight: category === cat ? 'bold' : 'normal' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {visibleFoods.map((item) => (
          <div key={item._id || item.name} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 6 }} />}
            <h4>{item.name}</h4>
            <p style={{ fontSize: 13, color: '#555' }}>{item.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Rs.{item.price}</strong>
              <button onClick={() => addToCart(item)}>Add</button>
            </div>
          </div>
        ))}
      </div>

      {chatOpen && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, width: 320, background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: 12 }}>
          <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left', margin: '6px 0' }}>
                <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 8, background: m.sender === 'user' ? '#e0f2fe' : '#f3f4f6' }}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 6 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask assistant..." style={{ flex: 1, padding: 6 }} />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
