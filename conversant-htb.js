/**
 * @author:    Partner
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (c) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 * and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */

'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var Browser = require('browser.js');
var Classify = require('classify.js');
var Constants = require('constants.js');
var Partner = require('partner.js');
var Size = require('size.js');
var SpaceCamp = require('space-camp.js');
var System = require('system.js');
var Utilities = require('utilities.js');
var Whoopsie = require('whoopsie.js');
var EventsService;
var RenderService;

//? if (DEBUG) {
var ConfigValidators = require('config-validators.js');
var PartnerSpecificValidator = require('conversant-htb-validator.js');
var Scribe = require('scribe.js');
//? }

////////////////////////////////////////////////////////////////////////////////
// Main ////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Partner module template
 *
 * @class
 */
function ConversantHtb(configs) {
    /* =====================================
     * Data
     * ---------------------------------- */

    /* Private
     * ---------------------------------- */

    /**
     * Reference to the partner base class.
     *
     * @private {object}
     */
    var __baseClass;

    /**
     * Profile for this partner.
     *
     * @private {object}
     */
    var __profile;

    var w = Browser.topWindow;
    var n = w.navigator;

    /* =====================================
     * Functions
     * ---------------------------------- */

    /* Conversant
     * ---------------------------------- */

    /**
     * Return the indicator value for do-not-track
     */

    function __getDNT() {
    	return (n.doNotTrack === '1' || w.doNotTrack === '1' || n.msDoNotTrack === '1' || n.doNotTrack === 'yes') ? 1 : 0;
    }

    /**
     * Return the device object for the bid request
     */

    function __getDevice() {
    	return {
    		h: Browser.getScreenHeight(),
    		w: Browser.getScreenWidth(),
    		dnt : __getDNT(),
    		language: Browser.getLanguage(),
    		make: n.vendor ? n.vendor : '',
    		ua: Browser.getUserAgent()
    	};
    }

    /**
     * Return site object for the bid request
     */

    function __getSite() {
    	return {
    		id: configs.siteId,
    		mobile: w.document.querySelector('meta[name="viewport"][content*="width=device-width"]') !== null ? 1 : 0,
    		page: Browser.getPageUrl()
    	};
    }

    /**
     * Return an array of impressions for the bid request
     */

    function __getImps(returnParcels) {
    	var conversantImps = [];
    	var secure = (Browser.getProtocol().search(/^https:/i) >= 0) ? 1 : 0;

    	// Each parcel is a unique combination of a htSlot and xSlot.
    	// Since Conversant bid requests do not require unique placement ids,
    	// requestIds are used instead.

    	for (var i = 0; i < returnParcels.length; ++i) {
    		var parcel = returnParcels[i];
    		var xSlot = parcel.xSlotRef;
    		var imp = {};
    		var banner = {};

    		imp.id = parcel.requestId;
    		imp.secure = secure;
    		imp.displaymanager = '40834-index-client';
    		imp.displaymanagerver = '0.0.1';

    		if (xSlot.hasOwnProperty('bidfloor')) {
    			imp.bidfloor = xSlot.bidfloor;
    		}

    		if (xSlot.hasOwnProperty('placementId')) {
    			imp.tagid = xSlot.placementId;
    		}

    		var format = [];
    		for (var size_idx in xSlot.sizes) {
    			var size = xSlot.sizes[size_idx];
    			format.push({w: size[0], h: size[1]});
    		}

    		banner.format = format;

    		if (xSlot.hasOwnProperty('position')) {
    			banner.pos = xSlot.position;
    		}

    		imp.banner = banner;

    		conversantImps.push(imp);
    	}

    	return conversantImps;
    }

    /**
     * Build and return the header bidding request
     */

    function __buildBidRequest(returnParcels) {
    	return {
    		id: System.generateUniqueId(),
    		imp: __getImps(returnParcels),
    		site: __getSite(),
    		device: __getDevice(),
    		at: 1
    	};
    }

    /* Utilities
     * ---------------------------------- */

    /**
     * Generates the request URL and query data to the endpoint for the xSlots
     * in the given returnParcels.
     *
     * @param  {object[]} returnParcels
     *
     * @return {object}
     */
    function __generateRequestObj(returnParcels) {
        var queryObj = {};

        /* todo : specify length and format for cache buster */
        var baseUrl = Browser.getProtocol() + '//media.msg.dotomi.com/s2s/header/24?cb=' + System.generateUniqueId();

        /* =============================================================================
         * STEP 2  | Generate Request URL
         * -----------------------------------------------------------------------------
         *
         * Generate the URL to request demand from the partner endpoint using the provided
         * returnParcels. The returnParcels is an array of objects each object containing
         * an .xSlotRef which is a reference to the xSlot object from the partner configuration.
         * Use this to retrieve the placements/xSlots you need to request for.
         *
         * If your partner is MRA, returnParcels will be an array of length one. If your
         * partner is SRA, it will contain any number of entities. In any event, the full
         * contents of the array should be able to fit into a single request and the
         * return value of this function should similarly represent a single request to the
         * endpoint.
         *
         * Return an object containing:
         * queryUrl: the url for the request
         * data: the query object containing a map of the query string paramaters
         *
         * callbackId:
         *
         * arbitrary id to match the request with the response in the callback function. If
         * your endpoint supports passing in an arbitrary ID and returning as part of the response
         * please use the callbackType: Partner.CallbackTypes.ID and fill out the adResponseCallback.
         * Also please provide this adResponseCallback to your bid request here so that the JSONP
         * response calls it once it has completed.
         *
         * If your endpoint does not support passing in an ID, simply use
         * Partner.CallbackTypes.CALLBACK_NAME and the wrapper will take care of handling request
         * matching by generating unique callbacks for each request using the callbackId.
         *
         * If your endpoint is ajax only, please set the appropriate values in your profile for this,
         * i.e. Partner.CallbackTypes.NONE and Partner.Requesttypes.AJAX
         *
         * The return object should look something like this:
         * {
         *     url: 'http://bidserver.com/api/bids' // base request url for a GET/POST request
         *     data: { // query string object that will be attached to the base url
         *        slots: [
         *             {
         *                 placementId: 54321,
         *                 sizes: [[300, 250]]
         *             },{
         *                 placementId: 12345,
         *                 sizes: [[300, 600]]
         *             },{
         *                 placementId: 654321,
         *                 sizes: [[728, 90]]
         *             }
         *         ],
         *         site: 'http://google.com'
         *     },
         *     callbackId: '_23sd2ij4i1' //unique id used for pairing requests and responses
         * }
         */

        /* PUT CODE HERE */

        queryObj = __buildBidRequest(returnParcels);
        //console.log(JSON.stringify(queryObj, null, '\t'));

        /* -------------------------------------------------------------------------- */

        return {
            url: baseUrl,
            data: queryObj,
            callbackId: queryObj.id,

            /* Signal a POST request and the content type */
            networkParamOverrides: {
            	method: 'POST'
            }
        };
    }

    /* =============================================================================
     * STEP 3  | Response callback
     * -----------------------------------------------------------------------------
     *
     * This generator is only necessary if the partner's endpoint has the ability
     * to return an arbitrary ID that is sent to it. It should retrieve that ID from
     * the response and save the response to adResponseStore keyed by that ID.
     *
     * If the endpoint does not have an appropriate field for this, set the profile's
     * callback type to CallbackTypes.CALLBACK_NAME and omit this function.
     */
    function adResponseCallback(adResponse) {
        /* get callbackId from adResponse here */
        var callbackId = 0;

        if (adResponse.hasOwnProperty('id')) {
        	callbackId = adResponse.id;
        }
        else {
            throw Whoopsie('Cnvr bid response missing id', adResponse);
        }

        __baseClass._adResponseStore[callbackId] = adResponse;
    }
    /* -------------------------------------------------------------------------- */

    /* Helpers
     * ---------------------------------- */

    /* =============================================================================
     * STEP 5  | Rendering
     * -----------------------------------------------------------------------------
     *
     * This function will render the ad given. Usually need not be changed unless
     * special render functionality is needed.
     *
     * @param  {Object} doc The document of the iframe where the ad will go.
     * @param  {string} adm The ad code that came with the original demand.
     */
    function __render(doc, adm) {
        System.documentWrite(doc, adm);
    }

    /**
     * Parses and extracts demand from adResponse according to the adapter and then attaches it
     * to the corresponding bid's returnParcel in the correct format using targeting keys.
     *
     * @param {string} sessionId The sessionId, used for stats and other events.
     *
     * @param {any} adResponse This is the adresponse as returned from the bid request, that was either
     * passed to a JSONP callback or simply sent back via AJAX.
     *
     * @param {object[]} returnParcels The array of original parcels, SAME array that was passed to
     * generateRequestObj to signal which slots need demand. In this funciton, the demand needs to be
     * attached to each one of the objects for which the demand was originally requested for.
     */
    function __parseResponse(sessionId, adResponse, returnParcels) {

        var unusedReturnParcels = returnParcels.slice();

        /* =============================================================================
         * STEP 4  | Parse & store demand response
         * -----------------------------------------------------------------------------
         *
         * Fill the below variables with information about the bid from the partner, using
         * the adResponse variable that contains your module adResponse.
         */

        /* This an array of all the bids in your response that will be iterated over below. Each of
         * these will be mapped back to a returnParcel object using some criteria explained below.
         * The following variables will also be parsed and attached to that returnParcel object as
         * returned demand.
         *
         * Use the adResponse variable to extract your bid information and insert it into the
         * bids array. Each element in the bids array should represent a single bid and should
         * match up to a single element from the returnParcel array.
         *
         */

        /* ---------- Process adResponse and extract the bids into the bids array ------------*/

        var bids = [];

        // There should only be one seatbid, but just in case, flatten all bids into a single
        // array

        if (adResponse.hasOwnProperty('seatbid')) {
        	for (var i = 0; i < adResponse.seatbid.length; ++i) {
        		var seatbid = adResponse.seatbid[i];
        		bids = bids.concat(seatbid.bid);
        	}
        }

        /* --------------------------------------------------------------------------------- */

        for (var i = 0; i < bids.length; i++) {

            var curReturnParcel;
            var curBid;

            for (var j = unusedReturnParcels.length - 1; j >= 0; j--) {

                /**
                 * This section maps internal returnParcels and demand returned from the bid request.
                 * In order to match them correctly, they must be matched via some criteria. This
                 * is usually some sort of placements or inventory codes. Please replace the someCriteria
                 * key to a key that represents the placement in the configuration and in the bid responses.
                 */

                if (unusedReturnParcels[j].requestId === bids[i].id) {
                    curReturnParcel = unusedReturnParcels[j];
                    curBid = bids[i];
                    unusedReturnParcels.splice(j, 1);
                    break;
                }
            }

            if (!curReturnParcel) {
                continue;
            }

            /* ---------- Fill the bid variables with data from the bid response here. ------------*/

            var bidPrice = curBid.price; // the bid price for the given slot
            var bidWidth = curBid.w; // the width of the given slot
            var bidHeight = curBid.h; // the height of the given slot
            var bidCreative = curBid.adm; // the creative/adm for the given slot that will be rendered if is the winner.
            var bidDealId = ''; // the dealId if applicable for this slot.  no deal supported yet.
            var bidIsPass = bidPrice <= 0 ? true : false; // true/false value for if the module returned a pass for this slot.

            /* ---------------------------------------------------------------------------------------*/

            if (bidIsPass) {
                //? if (DEBUG) {
                Scribe.info(__profile.partnerId + ' returned pass for { id: ' + adResponse.id + ' }.');
                //? }
                if (__profile.enabledAnalytics.requestTime) {
                    EventsService.emit('hs_slot_pass', {
                        sessionId: sessionId,
                        statsId: __profile.statsId,
                        htSlotId: curReturnParcel.htSlot.getId(),
                        xSlotNames: [curReturnParcel.xSlotName]
                    });
                }

                curReturnParcel.pass = true;

                continue;
            }

            if (__profile.enabledAnalytics.requestTime) {
                EventsService.emit('hs_slot_bid', {
                    sessionId: sessionId,
                    statsId: __profile.statsId,
                    htSlotId: curReturnParcel.htSlot.getId(),
                    xSlotNames: [curReturnParcel.xSlotName]
                });
            }

            curReturnParcel.size = [bidWidth, bidHeight];
            curReturnParcel.targetingType = 'slot';
            curReturnParcel.targeting = {};

            //? if (FEATURES.GPT_LINE_ITEMS) {
            var targetingCpm = __baseClass.__bidTransformers.targeting.apply(bidPrice);
            var sizeKey = Size.arrayToString(curReturnParcel.size);

            if (bidDealId !== '') {
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.pmid] = [sizeKey + '_' + bidDealId];
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.pm] = [sizeKey + '_' + targetingCpm];
            } else {
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.om] = [sizeKey + '_' + targetingCpm];
            }
            curReturnParcel.targeting[__baseClass._configs.targetingKeys.id] = [curReturnParcel.requestId];

            if (__baseClass._configs.lineItemType === Constants.LineItemTypes.ID_AND_SIZE) {
                RenderService.registerAdByIdAndSize(
                    sessionId,
                    __profile.partnerId,
                    __render, [bidCreative],
                    '',
                    __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0,
                    curReturnParcel.requestId, [bidWidth, bidHeight]
                );
            } else if (__baseClass._configs.lineItemType === Constants.LineItemTypes.ID_AND_PRICE) {
                RenderService.registerAdByIdAndPrice(
                    sessionId,
                    __profile.partnerId,
                    __render, [bidCreative],
                    '',
                    __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0,
                    curReturnParcel.requestId,
                    targetingCpm
                );
            }
            //? }

            //? if (FEATURES.RETURN_CREATIVE) {
            curReturnParcel.adm = bidCreative;
            //? }

            //? if (FEATURES.RETURN_PRICE) {
            curReturnParcel.price = Number(__baseClass.__bidTransformers.price.apply(bidPrice));
            //? }

            //? if (FEATURES.INTERNAL_RENDER) {
            var pubKitAdId = RenderService.registerAd(
                sessionId,
                __profile.partnerId,
                __render, [bidCreative],
                '',
                __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0
            );
            curReturnParcel.targeting.pubKitAdId = pubKitAdId;
            //? }
        }

    }

    /* =====================================
     * Constructors
     * ---------------------------------- */

    (function __constructor() {
        EventsService = SpaceCamp.services.EventsService;
        RenderService = SpaceCamp.services.RenderService;

        /* =============================================================================
         * STEP 1  | Partner Configuration
         * -----------------------------------------------------------------------------
         *
         * Please fill out the below partner profile according to the steps in the README doc.
         */

        /* ---------- Please fill out this partner profile according to your module ------------*/
        __profile = {
            partnerId: 'ConversantHtb', // PartnerName
            namespace: 'ConversantHtb', // Should be same as partnerName
            statsId: 'CONV', // Unique partner identifier
            version: '2.0.0',
            targetingType: 'slot',
            enabledAnalytics: {
                requestTime: true
            },
            features: {
                demandExpiry: {
                    enabled: false,
                    value: 0
                },
                rateLimiting: {
                    enabled: false,
                    value: 0
                }
            },
            targetingKeys: { // Targeting keys for demand, should follow format ix_{statsId}_id
                id: 'ix_conv_id',
                om: 'ix_conv_cpm',
                pm: 'ix_conv_cpm',
                pmid: 'ix_conv_dealid'
            },
            bidUnitInCents: 100,
            lineItemType: Constants.LineItemTypes.ID_AND_SIZE,
            callbackType: Partner.CallbackTypes.NONE, // Callback type, please refer to the readme for details
            architecture: Partner.Architectures.SRA, // Request architecture, please refer to the readme for details
            requestType: Partner.RequestTypes.ANY // Request type, jsonp, ajax, or any.
        };
        /* ---------------------------------------------------------------------------------------*/

        //? if (DEBUG) {
        var results = ConfigValidators.partnerBaseConfig(configs) || PartnerSpecificValidator(configs);

        if (results) {
            throw Whoopsie('INVALID_CONFIG', results);
        }
        //? }

        __baseClass = Partner(__profile, configs, null, {
            parseResponse: __parseResponse,
            generateRequestObj: __generateRequestObj,
            adResponseCallback: adResponseCallback
        });
    })();

    /* =====================================
     * Public Interface
     * ---------------------------------- */

    var derivedClass = {
        /* Class Information
         * ---------------------------------- */

        //? if (DEBUG) {
        __type__: 'ConversantHtb',
        //? }

        //? if (TEST) {
        __baseClass: __baseClass,
        //? }

        /* Data
         * ---------------------------------- */

        //? if (TEST) {
        profile: __profile,
        //? }

        /* Functions
         * ---------------------------------- */

        //? if (TEST) {
        render: __render,
        parseResponse: __parseResponse,
        generateRequestObj: __generateRequestObj,
        adResponseCallback: adResponseCallback,
        //? }
    };

    return Classify.derive(__baseClass, derivedClass);
}

////////////////////////////////////////////////////////////////////////////////
// Exports /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

module.exports = ConversantHtb;
