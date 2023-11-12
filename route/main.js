const renderMW = require('../middleware/renderMW');

module.exports = function(app) {
    app.get(
        '/',
        renderMW('chat')
    );
};