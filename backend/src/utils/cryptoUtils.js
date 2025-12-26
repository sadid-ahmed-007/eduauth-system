const crypto = require('crypto');

const generateCertificateHash = (data) => {
    // Combine critical data into a single string
    const dataString = JSON.stringify(data);
    
    // Create SHA-256 hash
    return crypto.createHash('sha256').update(dataString).digest('hex');
};

module.exports = { generateCertificateHash };