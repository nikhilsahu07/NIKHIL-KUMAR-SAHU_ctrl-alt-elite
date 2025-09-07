const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = 'mood_data.json';

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(express.static('public',{
    setHeaders: (res, path) => {
        if (path.endsWith('.css')){
            res.setHeaders('Content-Type', 'text/css');
        }
            
    }
}
));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper function to read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.get('/', (req, res) => {
    const entries = readData();
    res.render('index', { entries: entries.slice(-7) }); // Show last 7 entries
});

app.get('/entry', (req, res) => {
    res.render('entry');
});

app.post('/entry', (req, res) => {
    const { date, sleep, stress, symptoms, mood, engagement, drugNames, notes } = req.body;
    
    const newEntry = {
        id: Date.now(),
        date,
        sleep: parseInt(sleep),
        stress: parseInt(stress),
        symptoms: parseInt(symptoms),
        mood: parseInt(mood),
        engagement: parseInt(engagement),
        drugNames: drugNames || '',
        notes: notes || ''
    };
    
    const entries = readData();
    entries.push(newEntry);
    writeData(entries);
    
    res.redirect('/');
});

app.get('/reports', (req, res) => {
    const entries = readData();
    
    // Calculate averages
    const totalEntries = entries.length;
    const averages = {
        sleep: 0,
        stress: 0,
        symptoms: 0,
        mood: 0,
        engagement: 0
    };
    
    if (totalEntries > 0) {
        averages.sleep = (entries.reduce((sum, entry) => sum + entry.sleep, 0) / totalEntries).toFixed(1);
        averages.stress = (entries.reduce((sum, entry) => sum + entry.stress, 0) / totalEntries).toFixed(1);
        averages.symptoms = (entries.reduce((sum, entry) => sum + entry.symptoms, 0) / totalEntries).toFixed(1);
        averages.mood = (entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries).toFixed(1);
        averages.engagement = (entries.reduce((sum, entry) => sum + entry.engagement, 0) / totalEntries).toFixed(1);
    }
    
    // Get recent trends (last 7 days vs previous 7 days)
    const recent = entries.slice(-7);
    const previous = entries.slice(-14, -7);
    
    res.render('reports', { 
        entries, 
        averages, 
        totalEntries,
        recent,
        previous
    });
});

app.get('/api/chart-data', (req, res) => {
    const entries = readData().slice(-30); // Last 30 days
    res.json(entries);
});

app.delete('/entry/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let entries = readData();
    entries = entries.filter(entry => entry.id !== id);
    writeData(entries);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🌟 Mood Tracker running at http://localhost:${PORT}`);
    console.log('📊 Track your mental wellness journey!');
});
