import app from './src/app.js';
import config from './config.js';

const PORT = config.get('port')

app.listen(PORT, () => {
    console.log(`Video Toolbox is running on port ${PORT}`);
})