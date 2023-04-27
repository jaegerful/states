'use strict'

/* '__dirname' holds absolute path to 'controllers' directory. */

import path, {dirname} from 'path'
import {fileURLToPath} from 'url'

const url = import.meta.url
const normalized = fileURLToPath(url)
const __dirname = dirname(normalized)

/* store '__dirname' in a globally accessible object.  */

import {store} from './store.js'
store['__dirname'] = __dirname

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

/* start server once database connected. */

mongoose.connection.once('connected', async () => {

    /* middleware. */
    
    const {middleware} = await import('./middleware.js')
    await middleware(server, express, path, store['__dirname'])

    /* invalid routes. */

    const {error} = await import('./error.js')
    server.all('*', error)

    /* start server. */

    console.log(`\ndatabase connection established.`)

    server.listen(port, () => {
        console.log(`server running on port: ${port}.\n`)
    })
})