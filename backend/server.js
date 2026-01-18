require('dotenv').config()

const express = require('express')
const cors = require('cors')

//express app
const app = express()

//middleware
app.use(cors())
app.use(express.json())

//routes
app.get('/', (req, res) => {
    res.json({mssg: 'Wellcome to the app'})
})

// Media routes
app.use('/api', require('./routes/media'))

// listen for requests
app.listen(process.env.PORT, () => {
    console.log('listening on port ', process.env.PORT )
})
