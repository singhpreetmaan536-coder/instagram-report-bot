const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Username Check API (Your Original Logic)
app.post('/check-username', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ exists: false });

    const cleanUsername = username.trim().toLowerCase();

    try {
        // Method 1: Bloks API
        const device_id = uuidv4();
        const family_device_id = uuidv4();
        const android_device_id = "android-" + Math.random().toString(36).substring(2, 12);

        const payload = {
            params: JSON.stringify({
                client_input_params: {
                    aac: JSON.stringify({
                        aac_init_timestamp: Math.floor(Date.now() / 1000),
                        aacjid: uuidv4(),
                        aaccs: Math.random().toString(36).substring(2)
                    }),
                    search_query: cleanUsername,
                    ig_android_qe_device_id: device_id,
                    search_screen_type: "email_or_username"
                },
                server_params: {
                    event_request_id: uuidv4(),
                    device_id: android_device_id,
                    family_device_id: family_device_id,
                    qe_device_id: device_id
                }
            }),
            bk_client_context: JSON.stringify({
                bloks_version: "5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b",
                styles_id: "instagram"
            }),
            bloks_versioning_id: "5e47baf35c5a270b44c8906c8b99063564b30ef69779f3dee0b828bee2e4ef5b"
        };

        const headers = {
            'User-Agent': 'Instagram 370.1.0.43.96 Android (34/14; 450dpi; 1080x2207; samsung; SM-A235F; a23; qcom; en_IN; 704872281)',
            'x-ig-app-id': '567067343352427',
            'x-ig-device-id': device_id,
            'x-ig-family-device-id': family_device_id,
            'x-ig-android-id': android_device_id,
            'accept-language': 'en-IN, en-US',
        };

        const response = await axios.post(
            'https://i.instagram.com/api/v1/bloks/async_action/com.bloks.www.caa.ar.search.async/',
            payload,
            { headers, timeout: 12000 }
        );

        const text = response.data.toString().toLowerCase();
        if (text.includes(`"${cleanUsername}"`) && !text.includes('not_found') && !text.includes('no_results')) {
            return res.json({ exists: true, username: cleanUsername });
        }
    } catch (e) {
        console.log("Bloks API failed, trying fallback...");
    }

    // Fallback Method
    try {
        const { data } = await axios.get(`https://www.instagram.com/${cleanUsername}/`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 8000
        });

        if (data.includes(`"username":"${cleanUsername}"`) || 
            (data.includes(cleanUsername) && !data.includes('Page Not Found'))) {
            return res.json({ exists: true, username: cleanUsername });
        }
    } catch (e) {
        if (e.response && e.response.status === 404) {
            return res.json({ exists: false });
        }
    }

    res.json({ exists: false });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});