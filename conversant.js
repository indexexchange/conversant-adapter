/**
 * File Information
 * =============================================================================
 * @overview  Partner Module Template
 * @version   1.5.x
 * @author	Index Exchange
 * @copyright Copyright (C) 2016 Index Exchange All Rights Reserved.
 *
 * The information contained within this document is confidential, copyrighted
 * and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 * -----------------------------------------------------------------------------
 */

window.headertag.partnerScopes.push(function() {
	'use strict';

	/* =============================================================================
	 * SECTION A | Configure Module Name and Feature Support
	 * -----------------------------------------------------------------------------
	 *
	 * Configure all of the following settings for this module.
	 *
	 * PARTNER_ID:
	 *	 Three or four character partner ID provided by Index Exchange.
	 *
	 * SUPPORTED_TARGETING_TYPES:
	 *	 The types of targeting that are supported by this module.
	 *
	 *		  - page: targeting is set on the page as a whole.
	 *		  - slot: targeting is set on each slot individually.
	 *
	 * SUPPORTED_ANALYTICS:
	 *	 The types of analytics the wrapper should support for this module.
	 *
	 *		  - time:   time between when this module's getDemand function is
	 *					called, and when it returns its retrieved demand.
	 *		  - demand: the targeting information returned from this module.
	 *
	 */
	
	var cnvr_integration_id = '40834-index-client';
	var cnvr_adapter_version = '0.1';
	
	var PARTNER_ID = 'CONV';

	var SUPPORTED_TARGETING_TYPES = {
		page: false,
		slot: true
	};

	var SUPPORTED_ANALYTICS = {
		time: true,
		demand: true
	};

	var SUPPORTED_OPTIONS = {};

	/* -------------------------------------------------------------------------- */

	var Utils = window.headertag.Utils;
	var Network = window.headertag.Network;
	var BidRoundingTransformer = window.headertag.BidRoundingTransformer;

	function validateTargetingType(tt) {
		return typeof tt === 'string' && SUPPORTED_TARGETING_TYPES[tt];
	}

	function init(config, callback) {
		//? if (DEBUG) {
		var err = [];

		if (!config.hasOwnProperty('targetingType') || !validateTargetingType(config.targetingType)) {
			err.push('targetingType either not provided or invalid.');
		}

		/* =============================================================================
		 * SECTION B | Validate Module-Specific Configurations
		 * -----------------------------------------------------------------------------
		 *
		 * Validate all the module-specific parameters in the `config` object.
		 * Validation functions have been provided in the `Utils` object for
		 * convenience. See ../lib/utils.js for more information.
		 *
		 * For required configurations use:
		 *
		 *	 if (!config.hasOwnProperty(<parameter>) || ... || ...) {
		 *		 err.push(<error message>);
		 *	 }
		 *
		 * For optional configurations use:
		 *
		 *	 if (config.hasOwnProperty(<parameters>)  && (... || ...)) {
		 *		 err.push(<error message>);
		 *	 }
		 *
		 */

		// Conversant only accepts a single site id on a request.
		// Its specified on the top level of the config for this reason.
		if (!config.hasOwnProperty("site_id")) {
			err.push("Conversant 'site_id' is requred.");
			console.log("Conversant 'site_id' is requred.");   
		} else {
			// site_id has to be a string
			if (!Utils.isString(config.site_id)) {
				err.push("Conversant 'site_id' needs to be a string.");
				console.log("Conversant 'site_id' needs to be a string.");  
			} else {
				//site_id can't be empty
				if (Utils.isEmpty(config.site_id)) {
					err.push("Conversant 'site_id' cannot be an empty string.");
					console.log("Conversant 'site_id' cannot be an empty string.");  
				}
			}
		}
		
		//secure is optional
		if (config.hasOwnProperty("secure")) {
			if (!Utils.isBoolean(config.secure) && !Utils.isNumber(config.secure)) {
				err.push("Conversant's 'secure' must be a boolean.");
				console.log("Conversant's 'secure' must be a boolean.");
			}
		}

		/* -------------------------------------------------------------------------- */

		var xSlotConfigValid = true;

		if (!config.hasOwnProperty('xSlots') || typeof config.xSlots !== 'object' || Utils.isArray(config.xSlots)) {
			err.push('xSlots either not provided or invalid.');
			xSlotConfigValid = false;
		} else {
			for(var xSlotName in config.xSlots){
				if(!config.xSlots.hasOwnProperty(xSlotName)){
					continue;
				}

		/* =============================================================================
		 * SECTION C | Validate Partner Slot Configurations
		 * -----------------------------------------------------------------------------
		 *
		 * Validate the specific configurations that must appear in each xSlot.
		 * An xSlot represents an ad slot as it is understood by the partner's end point.
		 * Validation functions have been provided in the `Utils` object for
		 * convenience. See ../lib/utils.js for more information.
		 *
		 * For required configurations use:
		 *
		 *	 if (!config.hasOwnProperty(<parameter>) || ... || ...) {
		 *		 err.push(<error message>);
		 *	 }
		 *
		 * For optional configurations use:
		 *
		 *	 if (config.hasOwnProperty(<parameters>)  && (... || ...)) {
		 *		 err.push(<error message>);
		 *	 }
		 *
		 */

				var xSlot = config.xSlots[xSlotName];
		
				// sizes is required per xSlot
				if (!xSlot.hasOwnProperty("sizes")) {
					err.push("Conversant's "+xSlotName+" require 'sizes' definition.");
					console.log("Conversant's "+xSlotName+" require 'sizes' definition.");
				} else {
					//Sizes has to be an array
					if (!Utils.isArray(xSlot.sizes)) {
						err.push("Conversant's xSlot "+xSlotName+"'s 'sizes' must be an array.");
						console.log("Conversant's xSlot "+xSlotName+"'s 'sizes' must be an array.");
					} else {
						//sizes can't be empty
						if (Utils.isEmpty(xSlot.sizes)) { 
							err.push("Conversant's xSlot "+xSlotName+"'s 'sizes' array cannot be empty.");
							console.log("Conversant's xSlot "+xSlotName+"'s 'sizes' array cannot be empty.");
						} else {
							//If they only have a 1-D array,
							//make sure there are exactly two elements
							if(!Utils.isArray(xSlot.sizes[0])){
								//[w,h] will have length 2
								if (xSlot.sizes.length !== 2) {
								  err.push("Conversant's xSlot "+xSlotName+"'s 'sizes' array is incorrect length.");
								  console.log("Conversant's xSlot "+xSlotName+"'s 'sizes' array is incorrect length.");
								}
							}
						}
					}
				}

				//bidfloor is optional
				if (xSlot.hasOwnProperty("bidfloor")) {
					if (!Utils.isNumber(xSlot.bidfloor)) {
						err.push("Conversant's xSlot "+xSlotName+"'s 'bidfloor' must be a float.");
						console.log("Conversant's xSlot "+xSlotName+"'s 'bidfloor' must be a float.");
					}
				}
				
				//tag_id is optional
				if (xSlot.hasOwnProperty("tag_id")) {
					if (!Utils.isString(xSlot.tag_id)) {
						err.push("Conversant's xSlot "+xSlotName+"'s 'tag_id' must be a string.");
						console.log("Conversant's xSlot "+xSlotName+"'s 'tag_id' must be a string.");
					}
				}
				
				//position is optional
				if (xSlot.hasOwnProperty("position")) {
					if (!Utils.isNumber(xSlot.position)) {
						err.push("Conversant's xSlot "+xSlotName+"'s 'position' must be an integer.");
						console.log("Conversant's xSlot "+xSlotName+"'s 'position' must be an integer.");
					}
				}
		/* -------------------------------------------------------------------------- */

			}
		}
		
		if (!config.hasOwnProperty('mapping') || typeof config.xSlots !== 'object' || Utils.isArray(config.xSlots)) {
			err.push('mapping either not provided or invalid.');
		} else {
			var seenXSlots = {};

			for(var htSlotName in config.mapping){
				if(!config.mapping.hasOwnProperty(htSlotName)){
					continue;
				}

				var htSlotMapping = config.mapping[htSlotName];

				if(!Utils.isArray(htSlotMapping) || !htSlotMapping.length){
					err.push('slot mappings missing or invalid for htSlot ' + htSlotName);
				} else {
					for(var k = 0; k < htSlotMapping.length; k++){
						if(!Utils.validateNonEmptyString(htSlotMapping[k])){
							err.push('slot mappings missing or invalid for htSlot ' + htSlotName);
						} else if(xSlotConfigValid){
							if(config.xSlots.hasOwnProperty(htSlotMapping[k])){
								if(seenXSlots.hasOwnProperty(htSlotMapping[k])){
									err.push('xSlot ' + htSlotMapping[k] + ' mapped multiple times in ' + PARTNER_ID +' config');
								} else {
									seenXSlots[htSlotMapping[k]] = true;
								}
							} else {
								err.push('invalid xSlot ' + htSlotMapping[k] + ' in mapping for htSlot ' + htSlotName);
							}
						}
					}
				}
			}
		}

		if (config.hasOwnProperty('targetKeyOverride')) {
			if (!Utils.validateNonEmptyObject(config.targetKeyOverride)) {
				err.push('targetKeyOverride must be a non-empty object');
			} else {
				if (config.targetKeyOverride.omKey && !Utils.validateNonEmptyString(config.targetKeyOverride.omKey)) {
					err.push('targetKeyOverride.omKey must be a non-empty string');
				}

				if (config.targetKeyOverride.pmKey && !Utils.validateNonEmptyString(config.targetKeyOverride.pmKey)) {
					err.push('targetKeyOverride.pmKey must be a non-empty string');
				}

				if (config.targetKeyOverride.idKey && !Utils.validateNonEmptyString(config.targetKeyOverride.idKey)) {
					err.push('targetKeyOverride.idKey must be a non-empty string');
				}
			}
		}

		if(config.hasOwnProperty('roundingBuckets')){
			if (!Utils.validateNonEmptyObject(config.roundingBuckets)) {
				err.push('roundingBuckets must be a non-empty object');
			} else {
				var rConf = config.roundingBuckets;
				if(rConf.floor && (typeof rConf.floor !== 'number' || rConf.floor < 0)){
					err.push('roundingBuckets.floor must be a non-negative number');
				}
				if(rConf.inputCentsMultiplier && (typeof rConf.inputCentsMultiplier !== 'number' || rConf.inputCentsMultiplier < 0)){
					err.push('roundingBuckets.floor must be a non-negative number');
				}
				if(rConf.outputCentsDivisor && (typeof rConf.outputCentsDivisor !== 'number' || rConf.outputCentsDivisor < 0)){
					err.push('roundingBuckets.floor must be a non-negative number');
				}
				if(rConf.outputPrecision && !Utils.validateInteger(rConf.outputPrecision)){
					err.push('roundingBuckets.outputPrecision must be an integer');
				}
				if(rConf.roundingType && !Utils.validateInteger(rConf.roundingType, 0, 3)){
					err.push('roundingBuckets.roundingType must be a valid rounding type');
				}
				if(rConf.buckets && (!Utils.isArray(rConf.buckets) || rConf.buckets.length === 0)){
					err.push('roundingBuckets.buckets must be an array');
				} else {
					for(var l = 0; l < rConf.buckets.length; l++){
						if(!Utils.validateNonEmptyObject(rConf.buckets[l])){
							err.push('roundingBuckets.buckets must contain non-empty objects');
							break;
						}
					}
				}
			}
		}

		if (err.length) {
			callback(err);
			return;
		}

		//? }

		var yourBidder = new Partner(config);

		window.headertag.ConversantHtb = {};
		window.headertag.ConversantHtb.render = yourBidder.renderAd;

		window.headertag[PARTNER_ID] = {};
		window.headertag[PARTNER_ID].callback = yourBidder.responseCallback;

		callback(null, yourBidder);
	}

	function Partner(config) {
		var _this = this;
		var __targetingType = config.targetingType;
		var __supportedAnalytics = SUPPORTED_ANALYTICS;
		var __supportedOptions = SUPPORTED_OPTIONS;

		var __creativeStore = {};
		

		/* =============================================================================
		 * Set default targeting keys to be used for DFP. Values for omKey and idKey are
		 * mandatory. pmKey/pmidKey(deals) is only necessary if the partner will use a private market.
		 *
		 * Standard values are:
		 *
		 * omKey: ix_(PARTNER ID)_cpm
		 * pmKey: ix_(PARTNER ID)_cpm
		 * idKey: ix_(PARTNER ID)_id
		 * pmidKey: ix_(PARTNER ID)_dealid
		 */
		var __targetingKeys = {
			omKey: 'ix_conv_cpm',
			pmKey: 'ix_conv_cpm',
			idKey: 'ix_conv_id',
			pmidKey: 'ix_conv_dealid'
		};

		if (config.targetKeyOverride) {
			if (config.targetKeyOverride.omKey) {
				__targetingKeys.omKey = config.targetKeyOverride.omKey;
			}

			if (config.targetKeyOverride.pmKey) {
				__targetingKeys.pmKey = config.targetKeyOverride.pmKey;
			}

			if (config.targetKeyOverride.idKey) {
				__targetingKeys.idKey = config.targetKeyOverride.idKey;
			}

			if (config.targetKeyOverride.pmidKey) {
				__targetingKeys.pmidKey = config.targetKeyOverride.pmidKey;
			}
		}

		var __bidTransformer;

		/* =============================================================================
		 * Set the default parameters for interpreting the prices sent by the bidder
		 * endpoint. The bid transformer library uses cents internally, so this object
		 * specifies how to transform to and from the units provided by the bidder
		 * endpoint and expected by the DFP line item targeting. See
		 * bid-rounding-transformer.js for more information.
		 */
		var __bidTransformConfig = {		// Default rounding configuration
			"floor": 0,					 // Minimum acceptable bid price
			"inputCentsMultiplier": 100,	// Multiply input bids by this to get cents
			"outputCentsDivisor": 1,		// Divide output bids in cents by this
			"outputPrecision": 0,		   // Decimal places in output
			"roundingType": 1,			  // Rounding method (1 is floor)
			"buckets": [{				   // Buckets specifying rounding steps
				"max": 2000,				// Maximum number of cents for this bucket
				"step": 5				   // Increments for this bucket in cents
			}, {
				"max": 5000,				// Maximum number of cents for this bucket
				"step": 100				 // Increments for this bucket in cents
			}]
		};

		if(config.roundingBuckets){
			__bidTransformConfig = config.roundingBuckets;
		}

		/* =============================================================================
		 * Use the bidTransformer object to round bids received from the partner
		 * endpoint. Usage:
		 *
		 * var roundedBid = bidTransformer.transformBid(rawBid);
		 */
		__bidTransformer = BidRoundingTransformer(__bidTransformConfig);

		/* =============================================================================
		 * SECTION E | Copy over the Configurations to Internal Variables
		 * -----------------------------------------------------------------------------
		 *
		 * Assign all the required values from the `config` object to internal
		 * variables. These values do not need to be validated here as they have already
		 * been validated in `init`.
		 *
		 * Example:
		 *
		 *	  var <internal parameter> = config.<corresponding parameter>;
		 */
		var auction_type = 1;
		
		var site_id = config.site_id;
		var secure = config.hasOwnProperty('secure') ? config.secure : 0;
		
		var mapping = config.mapping;
		var xSlots = config.xSlots;

		/* -------------------------------------------------------------------------- */

		this.getPartnerTargetingType = function getPartnerTargetingType() {
			return __targetingType;
		};

		this.getSupportedAnalytics = function getSupportedAnalytics() {
			return __supportedAnalytics;
		};

		this.getSupportedOptions = function getSupportedOptions() {
			return __supportedOptions;
		};
		
		function __getImpObj(xSlot_name) {
			var xSlot = xSlots[xSlot_name];

			//Build the impression
			var imp_obj = {}

			//The xSlot will be associated with its htSlot on the bid response
			imp_obj.id = xSlot_name;

			//Determined by config.secure
			imp_obj.secure = secure;
			
			imp_obj.displaymanager = cnvr_integration_id;
			
			imp_obj.displaymanagerver = cnvr_adapter_version;

			//xSlot Optional Parameters
			if (xSlot.hasOwnProperty('bidfloor')) {
				imp_obj.bidfloor = xSlot.bidfloor;
			}

			if (xSlot.hasOwnProperty('tag_id')) {
				imp_obj.tagid = xSlot.tag_id;
			}

			//Only Banners for now...
			var banner = {};
			var format;
			var w;
			var h;

			//If sizes is a 2D array, use the format parameter
			if (Utils.isArray(xSlot.sizes[0])) {
				format = [];
				for (var size_idx in xSlot.sizes) {
					var size = xSlot.sizes[size_idx]; 
					format.push({
						w: size[0], 
						h: size[1]
					})
				}
			}
			//If sizes is a 1D array, then the 0th index is w, 1st is h. 
			else {
				w = xSlot.sizes[0];
				h = xSlot.sizes[1];
			}

			//Use format is available.
			if (Utils.isArray(format)) {
				banner.format = format;	
			} else {
				banner.w = w;
				banner.h = h;
			}

			//Optional Banner Parameters
			if (xSlot.hasOwnProperty('position')) {
				banner.pos = xSlot.position;
			}
			
			imp_obj.banner = banner;
			
			return imp_obj;
		}
		
		function __getSiteObj() {
			var site = {};
			site.id = site_id;
			site.mobile = document.querySelector('meta[name="viewport"][content*="width=device-width"]') !== null ? 1 : 0;
			site.page = Utils.getPageUrl();
			
			return site;
			
		}
		
		function __getDeviceObj() {
			var device = {};
			var n = navigator;
			var w = window;
			var language = n.language ? 'language' : 'userLanguage';
			
			device.w = Utils.getViewportWidth();
			device.h = Utils.getViewportHeight();
			device.dnt = n.doNotTrack === '1' || w.doNotTrack === '1' || n.msDoNotTrack === '1' || n.doNotTrack === 'yes';
			device.language = n[language].split('-')[0];
			device.make = n.vendor ? n.vendor : '';
			device.ua = n.userAgent;
			
			return device;
		}
		
		function __buildBidRequest(htSlotNames) {
			var bid_req = {},
				imp = [],
				device,
				site;
			
			//An imp object for each htSlot x xSlot
			for (var name_idx in htSlotNames) {
				var htSlot_name = htSlotNames[name_idx];
				//If we have a mapping for the htSlot
				if (mapping.hasOwnProperty(htSlot_name)) {
					var slot_mapping  = mapping[htSlot_name];
					for (var slot_idx in slot_mapping){
						var xSlot_name = slot_mapping[slot_idx];
						if (xSlots.hasOwnProperty(xSlot_name)) {
							imp.push(__getImpObj(xSlot_name));
						}
					}
				}
			}
			
			device = __getDeviceObj();
			site = __getSiteObj();
			
			bid_req.id = Utils.generateCorrelator();
			bid_req.imp = imp;
			bid_req.device = device;
			bid_req.site = site;
			bid_req.at = auction_type;
			
			return bid_req;
		}
		
		function __parseBidResponse(resp){
			try {
				var resp_obj = JSON.parse(resp);
				var imps = [];
				
				//Should only have one seat, but just in case.
				for (var seat_idx in resp_obj.seatbid) {
					var seatbid = resp_obj.seatbid[seat_idx];
					for (var bid_idx in seatbid.bid) {
						var bid = seatbid.bid[bid_idx];
					}
				}
			}
			catch (e) {
				console.log("Problem reading Conversant response");
			}
		}
		function __requestDemandForSlots(htSlotNames, callback){

			/* =============================================================================
			 * SECTION F | Request demand from the Module's Ad Server
			 * -----------------------------------------------------------------------------
			 *
			 * The `htSlotNames` argument is an array of HeaderTagSlot IDs for which demand
			 * is requested. Look these up in the mapping object of the config to determine
			 * the partner xSlots which should have demand requested for them.
			 *
			 * Make a request to the module's ad server to get demand. If there is an error
			 * while doing so, then call `callback` as such:
			 *
			 *	  callback(err);
			 *
			 * where `err` is a descriptive error message.
			 *
			 * If there are no errors, and demand is returned from the ad servers, call
			 * `callback` as such:
			 *
			 *	  callback(null, demand);
			 *
			 * where `demand` is an object containing the slot-level demand in the following
			 * format:
			 *
			 *	 {
			 *		 <htSlotId>: {
			 *			 demand: {
			 *				 <key>: <value>,
			 *				 <key>: <value>,
			 *				 ...
			 *			 }
			 *		 },
			 *		 ...
			 *	 }
			 */
			 
			// Production Endpoint
			var conversant_url = (secure ? 'https' : 'http') + '://media.msg.dotomi.com/s2s/header/24';
			
			// Build the bid request
			var bid_req = __buildBidRequest(htSlotNames);
			
			//Network.ajax doesn't support a POST request
			var request = new XMLHttpRequest();				
			request.onreadystatechange = function(){
				if(request.readyState === 4){//DONE
					__parseBidResponse(request.responseText);
				}
			}
			
			request.open("POST", conversant_url, true);
			request.withCredentials = true;
			request.send(JSON.stringify(bid_req));
			
			/* -------------------------------------------------------------------------- */

		}

		this.getDemand = function getDemand(correlator, slots, callback) {
			var htSlotNames = Utils.getDivIds(slots);

			__requestDemandForSlots(htSlotNames, function(err, demandForSlots){
				if (err) {
					callback(err);
					return;
				}

				if(!demandForSlots){
					callback('Error: demandForSlots not set');
					return;
				}

				for (var htSlotName in demandForSlots) {
					if (!demandForSlots.hasOwnProperty(htSlotName)) {
						continue;
					}
					demand.slot[htSlotName] = demandForSlots[htSlotName];
					demand.slot[htSlotName].timestamp = Utils.now();
				}
				callback(null, demand);
			});
		};

		this.responseCallback = function(responseObj){
			/* =============================================================================
			 * SECTION G | Parse Demand from the Module's Ad Server
			 * -----------------------------------------------------------------------------
			 *
			 * Run this function as a callback when the ad server responds with demand.
			 * Store creatives and demand in global objects as needed for processing.
			 */

			/* PUT CODE HERE */

			/* -------------------------------------------------------------------------- */
		};

		this.renderAd = function(doc, targetingMap, width, height) {
			/* =============================================================================
			 * SECTION H | Render function
			 * -----------------------------------------------------------------------------
			 *
			 * This function will be called by the DFP creative to render the ad. It should
			 * work as-is, but additions may be necessary here if there beacons, tracking
			 * pixels etc. that need to be called as well.
			 */

			if (doc && targetingMap && width && height) {
				try {
					var id = targetingMap[__targetingKeys.idKey][0];
					
					var sizeKey = width + 'x' + height;
					if (window.headertag.sizeRetargeting && window.headertag.sizeRetargeting[sizeKey]){
						width = window.headertag.sizeRetargeting[sizeKey][0];
						height = window.headertag.sizeRetargeting[sizeKey][1];
					}

					var ad = __creativeStore[id][width + 'x' + height].ad;

					doc.write(ad);
					doc.close();
					if (doc.defaultView && doc.defaultView.frameElement) {
						doc.defaultView.frameElement.width = width;
						doc.defaultView.frameElement.height = height;
					}
				} catch (e){
					//? if (DEBUG)
					console.log('Error trying to write ' + PARTNER_ID + ' ad to the page');
				}

			}
		};
	}

	window.headertag.registerPartner(PARTNER_ID, init);
});
