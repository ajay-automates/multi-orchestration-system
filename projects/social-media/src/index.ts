import express from 'express';
import orchestrationEndpoints from './orchestration-endpoints';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount the standardized endpoints
app.use('/', orchestrationEndpoints);

app.get('/', (req, res) => {
    res.send('Social Media Automator Project is running');
});

app.listen(PORT, () => {
    console.log(`Social Media Automator Server running on port ${PORT}`);
});
