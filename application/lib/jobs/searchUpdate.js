'use strict';

const decks = require('../../solr/collections/decks');
const slides = require('../../solr/collections/slides');
const users = require('../../solr/collections/users');

function handleDeckUpdate(data) {
    if (data.event === 'insert') {
        return decks.insert(data.eventData);
    } else if (data.event === 'update') {
        return decks.update(data.id);
    } else if (data.event === 'delete') {
        return decks.archive(data.id);
    }
    else {
        return Promise.resolve();
    }
}

function handleSlideUpdate(data) {
    if (data.event === 'insert') {
        return slides.insert(data.eventData);
    } else if (data.event === 'update') {
        return slides.update(data.eventData);
    } else {
        return Promise.resolve();
    }
}

function handleUserUpdate(data) {
    if (data.event === 'insert') {
        return users.insert(data.eventData);
    } else if (data.event === 'update') {
        return users.update(data.eventData);
    } else {
        return Promise.resolve();
    }
}

module.exports = (agenda) => {
    agenda.define('searchUpdate', (job, done) => {
        let data = job.attrs.data;

        switch (data.type) {
            case 'deck': 
                handleDeckUpdate(data).then( () => done()).catch(done);
                break;
            case 'slide':
                handleSlideUpdate(data).then( () => done()).catch(done);
                break;
            case 'user': 
                handleUserUpdate(data).then( () => done()).catch(done);
                break;
        }
    });
};