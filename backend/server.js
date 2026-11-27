const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupOrderRoutes = require('./routes/groupOrderRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Database Connected Successfully!'))
    .catch((err) => console.log('Database Connection Error: ', err));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/group-orders', groupOrderRoutes);

app.get('/', (req, res) => {
    res.send('FeastMateApp API is running successfully!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
