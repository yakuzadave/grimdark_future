
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(process.env.AIRTABLE_BASE);
const exphbs = require('express-handlebars');
const fastify = require('fastify')({ logger: true });
const view = require('@fastify/view');
const handlebars = require('handlebars');
const path = require('path');


require('dotenv').config();

fastify.register(view, {
    engine: { handlebars },
    root: path.join(__dirname, 'src/pages'),
    layout: 'layout.hbs'
});

let cache = {};

async function refreshCache() {
    try {
        const records = await base('Units').select({
            view: 'Grid view'
        }).firstPage();

        const armies = {};
        for (const record of records) {
            const armyId = record.fields.Army[0];
            const armyRecord = await base('Armies').find(armyId);
            const armyName = armyRecord.fields.Name;
            if (!armies[armyName]) {
                armies[armyName] = [];
            }
            armies[armyName].push(record.fields.Name);
        }

        cache.armies = armies;
    } catch (err) {
        console.error(err);
    }
}



fastify.get('/api/units/records', async (request, reply) => {
    try {
        const records = await base('Units').select({
            view: 'Grid view'
        }).firstPage();

        const armies = {};
        for (const record of records) {
            const armyId = record.fields.Army[0];
            const armyRecord = await base('Armies').find(armyId);
            const armyName = armyRecord.fields.Name;
            if (!armies[armyName]) {
                armies[armyName] = [];
            }
            armies[armyName].push(record.fields.Name);
        }

        return reply.view('units-by-army.hbs', { armies });
    } catch (err) {
        console.error(err);
        return reply.code(500).send({ error: 'An error occurred while fetching records or rendering the view.' });
    }
});





fastify.get('/', async (request, reply) => {
    return reply.view('index.hbs');
});




const start = async () => {
    try {
        await fastify.listen(process.env.PORT);
        fastify.log.info(`server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();