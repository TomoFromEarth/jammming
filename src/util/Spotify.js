const clientID = '815d4d83e2bb432e98b76265d0398299';
const redirectURI = 'http://localhost:3000';
const state = 'Huyt5j9LKogfRExC';

let accessToken;

const Spotify = {

    getAccessToken() {
        if (accessToken) {
            return accessToken;
        };
        //check token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1])

            //clears params, grabs new token on expire
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        }  else {
            const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&state=${state}&redirect_uri=${redirectURI}`;
            window.location = accessURL;
        };
    },

    async search(term) {
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}`, 'Access-Control-Allow-Origin': redirectURI };

        try {
            const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, headers);
            if (!response.ok) {
                throw new Error(`Error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            if (!jsonResponse.tracks) {
                return [];
            }
                return jsonResponse.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri
                }));
        } catch (error) {
            console.log(error);
        }
    },

    savePlaylist(pListName, trackURIs) {
        if (!pListName || !trackURIs) {
            return;
        }
        
        const accessToken = Spotify.getAccessToken();

        const headers = { Authorization: `Bearer ${accessToken}`, 'Access-Control-Allow-Origin': redirectURI };

        let userID;

        return fetch(`https://api.spotify.com/v1/me`, { headers: headers })
            .then(response => response.json())
            .then(jsonResponse => {
                userID = jsonResponse.id;
                return fetch(`https://api.spotify/com/v1/users/${userID}/playlists`, 
            {
                headers: headers,
                method: 'POST', 
                body: JSON.stringify({ name: pListName })
            })
            .then(response => response.json())
            .then(jsonResponse => {
                const pListID = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${pListID}/tracks`,
                {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({ uris: trackURIs })
                });
            });
        });
    }
};

export default Spotify;