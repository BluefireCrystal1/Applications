const mongoose = require('mongoose')
const applicationSchema = new mongoose.Schema({
    appId: { type: String, required: true },
    pending: { type: Boolean, default: true },
    accepted: { type: Boolean, default: false }
}
);
const model = mongoose.model('ApplicationModel', applicationSchema)
module.exports = model; 