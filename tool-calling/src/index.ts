import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.route.ts';
import customerRoutes from './routes/customer.route.ts';
import orderRoutes from './routes/order.route.ts';
import weatherRoutes from './routes/weather.route.ts';

const app = express();
//Middleware
app.use(express.json());
app.use(cors());


// Sample route
app.get('/', (req, res) => { res.send('Hello World awdawd') });

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/weather', weatherRoutes);

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
