const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const path = require('path');
const PORT = process.env.PORT || 8000;
const { router: code, startAllSessions } = require('./main.js');

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(express.static(__path));

app.get('/', (req, res) => {
    res.sendFile(path.join(__path, 'pair-code.html'));
});

app.use('/code', code);

app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: '❌ Unknown Endpoint!'
    });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, async () => {
    console.log(`╔► 🚀 Server is running on port http://localhost:${PORT}`);
    console.log(`╠► 📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`╠► ⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log(`╠► 🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`╚► 💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Start all sessions
    await startAllSessions();
});

module.exports = app;