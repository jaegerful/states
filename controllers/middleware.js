/* setup middleware. */

export async function middleware(server, express, path, __dirname) {

    /* parse json bodies. */

    server.use(express.json())

    /* log method and route of request. */

    server.use((request, _, next) => {
        console.log(`${request.method} from '${request.headers.origin ?? 'localhost'}': ${request.url}`)
        next() /* since this middleware uses a custom function, 'next' must be invoked. */
    })

    /* try and match route in 'public' directory. if path valid, serve file. */

    const handler = express.static(path.join(__dirname, '../public'))
    server.use(handler)

    /* use router for '/states'. */

    const {router} = await import('./router.js') /* use dynamic import to ensure store has '__dirname' set to corresponding path. */
    server.use('/states', router)
}