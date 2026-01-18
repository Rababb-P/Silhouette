require('dotenv').config()

const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')
const { File } = require('file-api')
const { RealtimeVision } = require('@overshoot/sdk')

//express app
const app = express()

app.use(cors())
app.use(express.json())

// Configure multer for video upload
const upload = multer({ dest: 'uploads/' })

//routes
app.get('/', (req, res) => {
    res.json({mssg: 'Welcome to the app'})
})

app.post('/api/analyze-style', upload.single('video'), async (req, res) => {
    try {
        console.log('Received analyze request')
        if (!req.file) {
            console.log('No file provided')
            return res.status(400).json({ error: 'No video file provided' })
        }

        const videoPath = req.file.path
        console.log('Video file path:', videoPath)
        const buffer = fs.readFileSync(videoPath)
        const videoFile = new File([buffer], req.file.originalname, { type: req.file.mimetype })

        const results = []

        console.log('Creating RealtimeVision...')
        const vision = new RealtimeVision({
            apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
            apiKey: process.env.OVERSHOOT_API_KEY,
            prompt: 'Analyze the person\'s style and body type. Output a JSON object with exactly three properties: "colour" (string), "style" (one of: baggy, active, formal), "item" (one of: bottoms, tops, etc). Choose appropriate values based on what you see.',
            source: { type: 'video', file: videoFile },
            onResult: (result) => {
                console.log('Received result:', result)
                results.push(result.result)
            }
        })

        console.log('Starting vision...')
        await vision.start()
        console.log('Vision started, waiting 5 seconds...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log('Stopping vision...')
        await vision.stop()
        console.log('Vision stopped, results:', results)

        const finalResult = results[results.length - 1] || 'No results'
        console.log('Final result:', finalResult)

        res.json({ text: finalResult })
    } catch (error) {
        console.error('Analysis error:', error.message)
        console.error('Stack:', error.stack)
        res.status(500).json({ error: 'Analysis failed', details: error.message })
    }
})

// listen for requests
app.listen(process.env.PORT, () => {
    console.log('listening on port ', process.env.PORT )
})

