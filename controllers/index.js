'use strict'

/* '__dirname' holds absolute path to 'controllers' directory. */

import path, {dirname} from 'path'
import {fileURLToPath} from 'url'

const url = import.meta.url
const normalized = fileURLToPath(url)
const __dirname = dirname(normalized)

/* import environment variables. */

import {config} from 'dotenv'
config()

/* setup server. */

import express from 'express'

const server = express()
const port = process.env.port ?? 1800

/* connect to database. */

import mongoose from 'mongoose'

mongoose.connect(process.env.dsn, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})

/* middleware. */

import {middleware} from './middleware.js'
middleware(server, express, path, __dirname)

/* invalid routes. */

server.all('*', (request, response) => {
    response.status(404)

    if (request.accepts('html')) {
        response.sendFile(path.join(__dirname, '../public', 'error.html'))
        return
    }

    if (request.accepts('json')) {
        response.send({'error': '404 Not Found'})
        return
    }

    response.end()
})

/* start server once database connected. */

mongoose.connection.once('connected', () => {
    console.log(`\ndatabase connection established.`)

    server.listen(port, () => {
        console.log(`server running on port: ${port}.\n`)
    })
})