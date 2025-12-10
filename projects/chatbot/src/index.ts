import express from 'express';
import orchestrationEndpoints from './orchestration-endpoints';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount the standardized endpoints
app.use('/', orchestrationEndpoints);

app.get('/', (req, res) => {
    res.send('Chatbot Project is running');
});

app.listen(PORT, () => {
    console.log(`Chatbot Server running on port ${PORT}`);
});
