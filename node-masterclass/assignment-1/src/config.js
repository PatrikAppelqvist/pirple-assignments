const staging = {
    httpPort: 3000,
    httpsPort: 3001,
    env: 'staging'
}

const production = {
    httpPort: 5000,
    httpsPort: 5001,
    env: 'production'
}

const environments = { staging, production }

// Let user configure env via code if NODE_ENV is not set
module.exports = env => {
    // Environment is env param if exist, otherwise process.env.NODE_ENV. If none exists default to empty string
    const environment = (env || process.env.NODE_ENV) || ''

    return environments[environment.toLowerCase()] || environments.staging
}