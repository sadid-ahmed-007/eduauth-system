const dotenv = require('dotenv');
const app = require('./src/app'); // Import the app we just made
require('./src/config/db'); // Keep DB connection alive

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});