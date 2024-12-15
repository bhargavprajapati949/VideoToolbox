import app from './src/app.js';
import config from './config.js';
import { initDb } from './src/models/db.js';

const PORT = config.get('port')

await initDb();

app.listen(PORT, () => {
    console.log(`Video Toolbox is running on port ${PORT}`);
})