'use strict';

const helper = require('./helper');
const { agendaConfig } = require('../configuration');

// this function should include commands that create indexes (if any)
// for any collections that the service may be using

// it should always return a promise
module.exports = function() {
    return helper.getCollection(agendaConfig.AGENDA_JOBS_COLLECTION).then((agenda) => {
        return agenda.createIndexes([
            { key: { 'data.id': 1, 'data.type': 1, 'data.event': 1 } },
        ]);
    });
};
