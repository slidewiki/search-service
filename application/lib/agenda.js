'use strict';

const Agenda = require('agenda');
const { agendaConfig, mongoConfig } = require('../configuration');

// graceful stop so as to unlock currently running jobs
function gracefulStop() {
    console.log('Agenda gracefully stopped');
    agenda.stop( () => {
        process.exit(0);
    });
}

// TODO maybe use another database as this is only transient persistance ?
let connectionString = `mongodb://${mongoConfig.HOST}:${mongoConfig.PORT}/${mongoConfig.SLIDEWIKIDATABASE}`;

let agenda = new Agenda({
    db: {
        address: connectionString,
        collection: agendaConfig.AGENDA_JOBS_COLLECTION,
    },

    // number of a specific job running concurrently
    defaultConcurrency: agendaConfig.AGENDA_JOBS_CONCURRENCY,

    // max number jobs that can be locked
    lockLimit: agendaConfig.AGENDA_JOBS_LOCK_LIMIT,
});

let jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach((type) => {
    require('./jobs/' + type)(agenda);
});

if (jobTypes.length) {
    // we are a worker
    agenda.on('ready', () => {
        agenda.start();
        console.log('Agenda listener is waiting for jobs');
    });

    // also log stuff
    agenda.on('start', (job) => {
        console.log('Job %s (%s) started for %s %s', job.attrs.name, job.attrs.data.event, job.attrs.data.type, job.attrs.data.id);
    });
    agenda.on('success', (job) => {
        console.log('Job %s (%s) completed successfully for %s %s', job.attrs.name, job.attrs.data.event, job.attrs.data.type, job.attrs.data.id);
    });
    agenda.on('fail', (err, job) => {
        console.warn('Job %s (%s) for %s %s failed', job.attrs.name, job.attrs.data.event, job.attrs.data.type, job.attrs.data.id);
        console.warn(err.message);
    });

    // frequency at which agenda will query the database looking for jobs
    agenda.processEvery('1 minute');

    process.on('SIGTERM', gracefulStop);
    process.on('SIGINT' , gracefulStop);
}

module.exports = agenda;