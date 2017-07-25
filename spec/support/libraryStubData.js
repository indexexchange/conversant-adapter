var partnerStub = require('./partnerStub.js');
var openRtbStub = require('./openRtbStub.js');

/* Instantiate mock browser objects */
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();

var libraryStubData = {
    'bid-transformer.js': function (config) {
        return {
            apply: function (price) {
                return price;
            }
        }
    },
    'browser.js': {
        getProtocol: function () {
            return 'http://';
        },
        getReferrer: function () {
            return 'localhost';
        },
        getPageUrl: function () {
            return 'localhost';
        },
        getUserAgent: function () {
            return 'desktop';
        },
        getLanguage: function () {
            return 'en-US';
        },
        getScreenWidth: function () { 
        	return 1024;
        },
        getScreenHeight: function () {
        	return 768;
        },
        getPageUrl: function () {
        	return 'http://www.indexexchange.com';
        }
    },
    'classify.js': {
        derive: function (baseClass, derivedClass) {
            return derivedClass;
        },
    },
    'constants.js': {
        LineItemTypes: {
            ID_AND_SIZE: 0,
            ID_AND_PRICE: 1
        },
    },
    'partner.js': partnerStub,
    'openrtb.js': openRtbStub,
    'size.js': {
        arrayToString: function (arr) {
            return arr[0] + 'x' + arr[1];
        },
    },
    'network.js': {
        isXhrSupported: function () {
            return true;
        }
    },
    'space-camp.js': {
        services: {
            EventsService: {
                emit: function (eventName, data) {
                    return;
                }
            },
            RenderService: {
                registerAdByIdAndSize: function () {
                    return;
                },
                registerAdByIdAndPrice: function () {
                    return;
                },
                registerAd: function () {
                    return '_' + Math.random().toString(36).substr(2, 9);
                }
            }
        },
    },
    'system.js': {
        generateUniqueId: function () {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        documentWrite: function (doc, adm) {
            return adm;
        },
    },
    'utilities.js': {},
    'whoopsie.js': function () {
        return null;
    },
    'config-validators.js': {
        partnerBaseConfig: function () {
            return null;
        },
    },
    'scribe.js': {
        info: function () {
            return;
        },
    },
    'conversant-htb-validator.js': function () {
        return null;
    },
    'conversant-htb-utils.js' : {
    	getWindow: function () { 
    		return mock.getWindow();
    	},
    	getNavigator: function () {
    		return mock.getNavigator();
    	}
    }
};
module.exports = libraryStubData;