require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Last.fm API proxy endpoint
app.get('/api/lastfm', async (req, res) => {
    try {
        const { method, ...params } = req.query;

        if (!method) {
            return res.status(400).json({ error: 'Method is required' });
        }

        const url = new URL('https://ws.audioscrobbler.com/2.0/');
        url.searchParams.set('method', method);
        url.searchParams.set('api_key', process.env.LAST_FM_API_KEY);
        url.searchParams.set('format', 'json');

        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        console.log(`Fetching from Last.fm: ${method}`);
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.error) {
            console.error(`Last.fm API Error (${data.error}): ${data.message}`);
        }

        res.json(data);
    } catch (error) {
        console.error('Server error fetching from Last.fm:', error.message);
        res.status(500).json({ error: 'Failed to fetch from Last.fm' });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
