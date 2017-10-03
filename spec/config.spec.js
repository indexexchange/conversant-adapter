'use strict';

/* =====================================
 * Utilities
 * ---------------------------------- */


/* =====================================
 * Testing
 * ---------------------------------- */


/**
 * This drives testings for the validator, but is disabled by default.
 * To include this as part of the testing, the following changes are needed.
 * 
 * 1. Change 'xdescribe' below to 'describe'.
 * 2. In convertsant-htb-validator.js, change the require statement to use
 *    schema-inspector without the relative path.
 */

xdescribe('Partner Config', function() {
    /* Setup and Library Stub
     * ------------------------------------------------------------- */
    var inspector = require('schema-inspector');
    var proxyquire = require('proxyquire').noCallThru();
    var libraryStubData = require('./support/libraryStubData.js');
    var partnerConfig = require('./support/mockPartnerConfig.json');
    var expect = require('chai').expect;
    var partnerValidator = proxyquire('../conversant-htb-validator.js', libraryStubData);
    /* -------------------------------------------------------------------- */

    it('validate configuation', function() {
    	var result = partnerValidator(partnerConfig);
    	expect(result).to.be.null;
    });
    
	
});