export async function feGraphApiPostWrapper(url: string, params = {}) {
    console.log('feApiPostWrapper:', 'url', url, 'params', params);
    return fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params)
    })
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(err => {
            console.log(err);
            throw (err);
        });
}