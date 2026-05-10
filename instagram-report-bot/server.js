const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/check-username', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.json({ exists: false });

    const clean = username.trim().toLowerCase();

    try {
        const device_id = uuidv4();
        const family_device_id = uuidv4();
        const android_device_id = "android-" + Math.random().toString(36).substring(2,12);

        const payload = {
            params: JSON.stringify({
                client_input_params: {
                    aac: JSON.stringify({
                        aac_init_timestamp: Math.floor(Date.now()/1000),
                        aacjid: uuidv4(),
                        aaccs: Math.random().toString(36).substring(2)
                    }),
                    search_query: clean,
                    search_screen_type: "email_or_username"
                },
                server_params: {
                    event_request_id: uuidv4(),
                    device_id: android_device_id,
                    family_device_id: family_device_id
                }
            }),
            bk_client_context: JSON.stringify({
                bloks_version: "5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b",
                styles_id: "instagram"
            }),
            bloks_versioning_id: "5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b"
        };

        const headers = {
            'User-Agent': 'Instagram 370.1.0.43.96 Android',
            'x-ig-app-id': '567067343352427',
        };

        await axios.post('https://i.instagram.com/api/v1/bloks/async_action/com.bloks.www.caa.ar.search.async/', payload, { headers });
        // If no error, assume exists for now (simplified)
        return res.json({ exists: true });
    } catch (e) {}

    res.json({ exists: false });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
