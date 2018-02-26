if (process.env.NODE_ENV === 'production') {
    module.exports = require('./configure-ots-setup-store-prod');
} else {
    module.exports = require('./configure-ots-setup-store-dev');
}
