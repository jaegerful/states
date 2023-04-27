/* a store that can be accessed anywhere in program. */

/* in particular, this object has two properties: */
/* 1. '__dirname': prevents '../controllers/router.js' from having to recalculate '__dirname'. */
/* 2. 'states': holds merged data from './states.json' and remote database. */

export const store = {
    '__dirname': null,
    'states': null
}