/* setup router for '/states'. */

import express from 'express'
export const router = new express.Router()

/* read contents of './../models/states.json' into store. */

import * as fs from 'fs/promises'
import path from 'path'
import {store} from '../models/store.js'

async function read() {
    const data = await fs.readFile(path.join(store['__dirname'], '../models', 'states.json'), 'utf8')
    return JSON.parse(data)
}

store.states = await read()

/* read fun facts from database into store. */

import {model} from './../models/states.js'

async function retrieve() {
    const database = await model.find({})
    const map = {}

    for (let document of database) /* make map w/ this structure: {stateCode: funFacts}. */
        map[document.stateCode] = document.funFacts

    /* add fun facts to corresponding states. */

    for (let state of store.states) {
        const result = map[state.code]

        if (result === undefined)
            continue

        state.funFacts = result
    }
}

await retrieve()

/* route: get all data for states. */

router.get('/', async (request, response) => {

    /* filter data based on the 'contig' query parameter, if it exists. */

    const non_contiguous = ['AK', 'HI']

    const data = store.states.filter(state => {

        switch (request.query.contig) {

            /* if 'contig' is 'true' and current state is non-contiguous, remove state from 'data'. */
        
            case 'true':
                if (non_contiguous.includes(state.code))
                    return false
                    
                break
                
            /* if 'contig' is 'false' and current state is contiguous, remove state from 'data'. */
                
            case 'false':
                if (!non_contiguous.includes(state.code))
                    return false
        }

        return true
    })

    /* if request accepts json. */

    if (request.accepts('json')) {
        response.send(data)
        return
    }

    /* otherwise, use plain text. */
    
    response.type('text/plain')
    response.send(JSON.stringify(data))
})

/* validate routes w/ ':state' url parameter. */

import {error} from './error.js'
const symbol = Symbol.for('state code exists')

router.all('/:state*', (request, response, next) => {
    const code = request.params.state.toUpperCase()

    for (let state of store.states) {
        if (code === state.code) {
            request[symbol] = {data: state}

            next()
            return
        }
    }

    if (request[symbol] === undefined)
        error(request, response)     
})

/* route: get data for a particular state. */

router.get('/:state', (request, response) => {
    const {data: state} = request[symbol]
    response.send(state)
})

/* route: get a random fun fact for a particular state. */

router.get('/:state/funfact', (request, response) => {
    const {data: state} = request[symbol]

    if (state.funFacts === undefined) {
        response.status(404)
        response.send({'message': `No Fun Facts found for ${state.state}`})
        return
    }

    const index = Math.trunc(Math.random() * state.funFacts.length) /* select random index in array. */
    response.send({'funfact': state.funFacts[index]})
})

/* route: get the capital of a particular state. */

router.get('/:state/capital', (request, response) => {
    const {data: state} = request[symbol]

    response.send({
        'state': state.state, 
        'capital': state.capital_city
    })
})

/* route: get the nickname of a particular state. */

router.get('/:state/nickname', (request, response) => {
    const {data: state} = request[symbol]

    response.send({
        'state': state.state, 
        'nickname': state.nickname
    })
})

/* route: get the population of a particular state. */

router.get('/:state/population', (request, response) => {
    const {data: state} = request[symbol]

    response.send({
        'state': state.state, 
        'population': state.population
    })
})

/* route: get the admission date of a particular state. */

router.get('/:state/admission', (request, response) => {
    const {data: state} = request[symbol]

    response.send({
        'state': state.state, 
        'admitted': state.admission_date
    })
})

/* route: insert fun fact(s) for a particular state. */

router.post('/:state/funfact', async (request, response) => {

    /* if body does not have 'funfacts' parameter. */

    if (request.body.funfacts === undefined || !Array.isArray(request.body.funfacts)) {
        error(request, response)
        return
    }
    
    /* check if state already has some fun facts stored in database. */

    const {data: state} = request[symbol]
    const document = await model.findOne({'stateCode': state.code}).exec()

    let result

    if (document) { /* if so, append fun facts from request. */
        document.funFacts.push(...request.body.funfacts)
        result = await document.save()
    }

    /* otherwise, create an entry for state. */

    else {
        result = await model.create({
            'stateCode': state.code, 
            'funFacts': request.body.funfacts
        })
    }
    
    /* send repsonse w/ result. */

    response.status(201)
    response.send(result)
})