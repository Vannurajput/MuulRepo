const BaseConnector = require('./BaseConnector');
const LocalConfigService = require('../LocalConfigService');

class LocalConfigConnector extends BaseConnector {
    async execute(payload) {
        const service = new LocalConfigService();
        const action = (payload?.action || payload?.type)?.toUpperCase();

        switch (action) {
            case 'GET_LOCAL_CONFIG':
                return await service.getLocalConfig();

            case 'GET_FOLDER_DETAILS':
                return await service.getFolderDetails();

            case 'READ_FILE':
                return await service.readFile(payload);

            case 'WRITE_FILE':
                return await service.writeFile(payload);

            case 'APPEND_FILE':
                return await service.appendFile(payload);

            default:
                throw new Error(`Unknown local config action: ${payload?.action}`);
        }
    }
}

module.exports = LocalConfigConnector;
