'use strict'

/* model for 'states' collection. */

import mongoose from 'mongoose'

const schema = new mongoose.Schema({

    /* abbrevation for state. */
    
    stateCode: {
        type: String,
        required: true,
        unique: true /* creates a unique index in mongo for this column. */
    },

    /* fun facts about state. */

    funFacts: {
        type: [String]
    }
})

export const model = mongoose.model('states', schema)