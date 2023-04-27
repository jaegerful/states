/* handler for invalid routes */

import path from 'path'
import {store} from './store.js'

export function error(request, response) {
    response.status(404)

    if (request.accepts('html')) {
        response.sendFile(path.join(store['__dirname'], '../public', 'error.html'))
        return
    }

    if (request.accepts('json')) {
        response.send({'error': '404 Not Found'})
        return
    }
    
    response.end()
}