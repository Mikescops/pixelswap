require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

const username = 'lokta';
const apiUrl = `https://api.discogs.com/users/${username}/collection/folders/0/releases`;

const fetchVinyls = async () => {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data.releases;
    } catch (error) {
        console.error('Error fetching data from Discogs:', error);
        return [];
    }
};

const transformToJSON = (vinyls) => {
    return vinyls.map(vinyl => ({
        title: vinyl.basic_information.title,
        artist: vinyl.basic_information.artists.map(artist => artist.name).join(", "),
        label: vinyl.basic_information.labels.map(label => label.name).join(", "),
        year: vinyl.basic_information.year,
        image: vinyl.basic_information.cover_image
    }));
};

const main = async () => {
    const vinyls = await fetchVinyls();
    const vinylsJSON = transformToJSON(vinyls);
    fs.writeFileSync('data/vinyls.json', JSON.stringify(vinylsJSON, null, 4));
    console.log('Vinyls data written to vinyls.json');
};

main();
