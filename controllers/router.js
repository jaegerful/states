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

    /* validate 'funfacts' parameter. */

    const checks = {
        'defined': request.body.funfacts !== undefined,
        'is_array': Array.isArray(request.body.funfacts),
        'is_array_of_only_strings': request.body.funfacts.every(funFact => typeof funFact === 'string')
    }

    if (!checks['defined']) {
        response.send({'message': 'State fun facts value required'})
        return
    }

    if (!checks['is_array']) {
        response.send({'message': 'State fun facts value must be an array'})
        return
    }

    if (!checks['is_array_of_only_strings']) {
        response.send({'message': 'State fun facts array must only contain string elements'})
        return
    }
    
    /* check if state already has some fun facts stored in database. */

    const {data: state} = request[symbol]
    const document = await model.findOne({'stateCode': state.code}).exec()

    let result

    if (document !== null) { /* if so, append fun facts from request. */
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

/* route: replace fun fact for a particular state. */

router.patch('/:state/funfact', async (request, response) => {

    /* check if state has some fun facts stored in database. */

    const {data: state} = request[symbol]
    const document = await model.findOne({'stateCode': state.code}).exec()

    response.status(400)

    /* validate 'index' and 'funfact' parameters. */

    const checks = {
        'index': {
            'defined': request.body.index !== undefined,
        },
        'funfact': {
            'defined': request.body.funfact !== undefined,
            'is_string': typeof request.body.funfact === 'string'
        }
    }

    if (!checks['index']['defined']) {
        response.send({'message': 'State fun fact index value required'})
        return
    }

    if (!checks['funfact']['defined']) {
        response.send({'message': 'State fun fact value required'})
        return
    }

    if (!checks['funfact']['is_string']) {
        response.send({'message': 'State fun fact value must be a string'})
        return
    }

    /* if state does not a single fun fact. */

    response.status(404)

    if (document === null) {
        response.send({'message': `No Fun Facts found for ${state.state}`})
        return
    }

    /* if 'index' parameter out of range. */

    const index = request.body.index - 1

    if (document.funFacts[index] === undefined) {
        response.send({'message': 'No Fun Fact found at that index for Texas'})
        return
    }

    /* replace fun fact with corresponding index. */

    document.funFacts[index] = request.body.funfact
    let result = await document.save()
    
    /* send repsonse w/ result. */

    response.status(200)
    response.send(result)
})