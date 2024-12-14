import express from 'express';

const app = express();

app.get('/_health', (req, res) => {
    res.send({
        "status": "ok"
    })
})

export default app;