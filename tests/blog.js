const { expect } = require('@playwright/test')

const sink = process.env.SINK || `http://localhost:3000/blog-links`;

let uploadBlogLinks = async (links) => {

    const response = await fetch(sink,
        {
            method: 'POST',
            body: JSON.stringify(links),
            headers: {
                'Content-Type': 'application/json'
            },
        }
    );
    expect(response.status).toBe(200);
};
module.exports = {
    upload: uploadBlogLinks,
};
