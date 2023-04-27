/* a store for '__dirname' that can be accessed anywhere in program. */
/* this object prevents './router.js' from having to recalculate '__dirname'. */

export const store = {
    '__dirname': null
}