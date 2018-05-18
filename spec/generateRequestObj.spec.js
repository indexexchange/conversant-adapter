/**
 * @author:    Index Exchange
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (C) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 *  and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */
// jshint ignore: start

'use strict';

/* =====================================
 * Utilities
 * ---------------------------------- */

/**
 * Returns an array of parcels based on all of the xSlot/htSlot combinations defined
 * in the partnerConfig (simulates a session in which all of them were requested).
 *
 * @param {object} profile
 * @param {object} partnerConfig
 * @returns []
 */
function generateReturnParcels(profile, partnerConfig) {
    var returnParcels = [];

    for (var htSlotName in partnerConfig.mapping) {
        if (partnerConfig.mapping.hasOwnProperty(htSlotName)) {
            var xSlotsArray = partnerConfig.mapping[htSlotName];
            var htSlot = {
                id: htSlotName,
                getId: function () {
                    return this.id;
                }
            }
            for (var i = 0; i < xSlotsArray.length; i++) {
                var xSlotName = xSlotsArray[i];
                returnParcels.push({
                    partnerId: profile.partnerId,
                    htSlot: htSlot,
                    ref: "",
                    xSlotRef: partnerConfig.xSlots[xSlotName],
                    requestId: '_' + Date.now()
                });
            }
        }
    }

    return returnParcels;
}

/**
 * Return a simplified openrtb schema to validate Conversant bid request
 * @returns {object}
 */

function getOpenrtbSchema() {
	return {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				minLength: 1
			},
			imp: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: {
							type: 'string'
						},
						secure: {
							type: 'integer',
							optional: true
						},
						displaymanager: {
							type: 'string'
						},
						displaymanagerver: {
							type: 'string'
						},
						tagid: {
							type: 'string',
							optional: true
						},
						bidfloor: {
							type: 'number',
							optional: true
						},
						banner: {
							type: 'object',
							properties: {
								format: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											w: {
												type: 'integer'
											},
											h: {
												type: 'integer'
											}
										}
									}
								},
								pos: {
									type: 'integer',
									optional: true
								}
							}
						}
					}
				}
			},
			site: {
				type: 'object',
				properties: {
					id: {
						type: 'string'
					},
					mobile: {
						type: 'integer',
						gte: 0,
						lte: 1
					},
					page: {
						type: 'string'
					}
				}
			},
			device: {
				type: 'object',
				properties: {
					ua: {
						type: 'string'
					},
					dnt: {
						type: 'integer',
						gte: 0,
						lte: 1
					},
					h: {
						type: 'integer'
					},
					w: {
						type: 'integer'
					},
					language: {
						type: 'string',
						optional: true
					},
					make: {
						type: 'string',
						optional: true
					}
				}
			},
			at: {
				type: 'integer',
				gte: 0,
				lte: 3
			}
		}
	};
}

/* =====================================
 * Testing
 * ---------------------------------- */

describe('generateRequestObj', function () {
	
    /* Setup and Library Stub
     * ------------------------------------------------------------- */
    var inspector = require('schema-inspector');
    var proxyquire = require('proxyquire').noCallThru();
    var libraryStubData = require('./support/libraryStubData.js');
    var partnerModule = proxyquire('../conversant-htb.js', libraryStubData);
    var partnerConfig = require('./support/mockPartnerConfig.json');
    var expect = require('chai').expect;
    /* -------------------------------------------------------------------- */

    /* Instantiate your partner module */
    var partnerModule = partnerModule(partnerConfig);
    var partnerProfile = partnerModule.profile;

    /* Generate dummy return parcels based on MRA partner profile */
    var returnParcels;
    var requestObject;

    /* Generate a request object using generated mock return parcels. */
    returnParcels = generateReturnParcels(partnerProfile, partnerConfig);

    /* -------- IF SRA, generate a single request for all the parcels -------- */
    if (partnerProfile.architecture) {
        requestObject = partnerModule.generateRequestObj(returnParcels);
        //console.log(JSON.stringify(requestObject));

        /* Simple type checking, should always pass */
        it('SRA - should return a correctly formatted object', function () {
            var result = inspector.validate({
                type: 'object',
                strict: true,
                properties: {
                    url: {
                        type: 'string',
                        minLength: 1
                    },
                    data: getOpenrtbSchema(),
                    callbackId: {
                        type: 'string',
                        minLength: 1
                    },
                    networkParamOverrides: {
                    	type: 'object',
                    	properties: {
                    		method: {
                    			type: 'string',
                    			eq: 'POST'
                    		}
                    	}
                    }
                }
            }, requestObject);

            expect(result.valid, result.format()).to.be.true;
        });

        /* Test that the generateRequestObj function creates the correct object by building a URL
            * from the results. This is the bid request url that wrapper will send out to get demand
            * for your module.
            *
            * The url should contain all the necessary parameters for all of the request parcels
            * passed into the function.
            */

        /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
        it('should correctly build a url', function () {
            /* Write unit tests to verify that your bid request url contains the correct
                * request params, url, etc.
                */
        	var parser = require('url');
        	var url = parser.parse(requestObject.url);
        	        	
        	expect(url.protocol).to.match(/^http.?:/);
        	expect(url.pathname).to.match(/\/s2s\/header/);
        	expect(url.hostname).to.match(/web\.hb\.ad\.cpe\.dotomi\.com/);
        });
        
        it('check banner objects', function () {
        	for (var i = 0; i < requestObject.data.imp.length; ++i) {
        		var bid = requestObject.data.imp[i];
        		var xSlot = returnParcels[i].xSlotRef;
        		expect(bid).to.exist;
        		expect(bid.banner.format.length).to.equal(xSlot.sizes.length);
        		if (typeof xSlot.position != 'undefined') {
        			expect(bid.banner.pos).to.equal(xSlot.position);
        		}
        		if (typeof xSlot.bidfloor != 'undefined') {
        			expect(bid.bidfloor).to.equal(xSlot.bidfloor);
        		}
        	}
        });
        
        it('check site id', function () {
        	expect(requestObject.data.site.id === partnerConfig.siteId).to.be.true;
        	expect(requestObject.callbackId === requestObject.data.id).to.be.true;
        });
        
        it('check gdpr', function() {
        	expect(requestObject.data).to.have.deep.property('user', {ext: {consent: 'BOQ7WlgOQ7WlgABABwAAABJOACgACAAQABA'}});
        	expect(requestObject.data).to.have.deep.property('regs', {ext: {gdpr: 1}});
        })
        /* -----------------------------------------------------------------------*/

    /* ---------- IF MRA, generate a single request for all the parcels ---------- */
    } else {
        for (var i = 0; i < returnParcels.length; i++) {
            requestObject = partnerModule.generateRequestObj([returnParcels[i]]);

            /* Simple type checking, should always pass */
            it('MRA - should return a correctly formatted object', function () {
                var result = inspector.validate({
                    type: 'object',
                    strict: true,
                    properties: {
                        url: {
                            type: 'string',
                            minLength: 1
                        },
                        data: {
                            type: 'object'
                        },
                        callbackId: {
                            type: 'string',
                            minLength: 1
                        }
                    }
                }, requestObject);

                expect(result.valid).to.be.true;
            });

            /* Test that the generateRequestObj function creates the correct object by building a URL
                * from the results. This is the bid request url that wrapper will send out to get demand
                * for your module.
                *
                * The url should contain all the necessary parameters for all of the request parcels
                * passed into the function.
                */

            /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
            it('should correctly build a url', function () {
                /* Write unit tests to verify that your bid request url contains the correct
                    * request params, url, etc.
                    */
                expect(requestObject).to.exist;
            });
            /* -----------------------------------------------------------------------*/
        }
    }
});
