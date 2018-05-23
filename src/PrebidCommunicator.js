/**
 * Prebid.js Communication module.
 * @module prebidCommunicator
 */

var _logger = require('./Logging.js');
var _prefix = 'apnPrebidVast->PrebidCommunicator';

var prebidCommunicator = function () {
	var _options;
	var _callback;

	function doPrebid() {
		// call bidding
    	if (_options.biddersSpec) {
    		_options.doPrebid(_options, function(bids) {
    			var arrBids = (bids && bids[_options.biddersSpec.code]) ? bids[_options.biddersSpec.code].bids : [];
    			_logger.log(_prefix, 'bids for bidding: ', arrBids);
    			if (arrBids && Array.isArray(arrBids)) {
        			var creative;
        			if (_options.dfpParameters) {
        				// use DFP server if DFP settings are present in options
	        			_logger.log(_prefix, 'Use DFP');
						var dfpOpts = {adUnit: _options.biddersSpec};
						if (_options.dfpParameters.url && _options.dfpParameters.url.length > 0) {
							dfpOpts.url = _options.dfpParameters.url;
						}
						if (_options.dfpParameters.params && _options.dfpParameters.params.hasOwnProperty('iu')) {
							dfpOpts.params = _options.dfpParameters.params;
						}
						if (_options.dfpParameters.bid && Object.keys(_options.dfpParameters.bid).length > 0) {
							dfpOpts.bid = _options.dfpParameters.bid;
						}
						_logger.log(_prefix, 'DFP buildVideoUrl options: ', dfpOpts);
						creative = window.apn_pbjs.adServers.dfp.buildVideoUrl(dfpOpts);
            			_logger.log(_prefix, 'Selected VAST url: ' + creative);
						if (_callback) {
							_callback(creative);
        				}
        				else {
        					window.prebid_creative = creative;
        				}
        			}
        			else if (_options.adServerCallback) {
        				// use 3rd party ad server if ad server callback is present in options
	        			_logger.log(_prefix, 'Use 3rd party ad server');
        				_options.adServerCallback(arrBids, function(adServerCreative) {
        	    			_logger.log(_prefix, 'Selected VAST url: ' + creative);
							if (_callback) {
								_callback(adServerCreative);
            				}
            				else {
            					window.prebid_creative = adServerCreative;
            				}
        				});
        			}
        			else {
        				// select vast url from bid with higher cpm
	        			_logger.log(_prefix, 'Select winner by CPM');
	    				var cpm = 0.0;
	    				creative = null;
	    				for (var i = 0; i < arrBids.length; i++) {
	    					if (arrBids[i].cpm > cpm) {
	    						cpm = arrBids[i].cpm;
	    						creative = arrBids[i].vastUrl;
	    					}
	    				}
    	    			_logger.log(_prefix, 'Selected VAST url: ' + creative);
						if (_callback) {
        					_callback(creative);
        				}
        				else {
        					window.prebid_creative = creative;
        				}
        			}
    			}
    			else {
   	    			_logger.log(_prefix, 'Selected VAST url: null');
 				    if (_callback) {
    					_callback(null);
    				}
    			}
    		});
    	}
    	else {
			if (_callback) {
				_callback(null);
			}
    	}
	}

    this.doPrebid = function (options, callback) {
    	_options = options;
    	_callback = callback;

    	if (_options.doPrebid) {
    		if (window.apn_pbjs) {
    			// do prebid if prebid.js is loaded
    			doPrebid();
    		}
    		else {
    			// wait until prebid.js is loaded
    			var waitPbjs = setInterval(function() {
    	    		if (window.apn_pbjs) {
    	    			clearInterval(waitPbjs);
    	    			waitPbjs = null;
    	    			doPrebid();
    	    		}
    	    		else if (window.apn_pbjs_error) {
    	    			clearInterval(waitPbjs);
    	    			waitPbjs = null;
    	    			callback(null);
    	    		}
    			}, 100);
    		}
    	}
    	else {
    		if (_callback) {
    			_callback(null);
    		}
    	}
    };

    // @exclude
    // Method exposed only for unit Testing Purpose
    // Gets stripped off in the actual build artifact
	this.test = function() {
		return {
		};
	};
	// @endexclude
};

module.exports = prebidCommunicator;