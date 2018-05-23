var ApnPrebidVast = require('./../../../src/ApnPrebidVast.js');
var logger = require('./../../../src/Logging.js');

describe('ApnPrebidVast unit test', function() {
    var mock;
	var mockObject;
	var sinonStub;

	before(function(done) {
		setTimeout(function() {
			done();
		}, 1500);
	});

	beforeEach(function (done) {
		console.log(this.currentTest.title);
		window.pbjs = {
			que: [],
			requestBids: function(obj) {}
		};
        mock = function () {
            this.options = {
            		prebidPath: '//acdn.adnxs.com/prebid/not-for-prod/1/prebid.js',
            		biddersSpec: {
            	        code: 'my-video-tag',
            	        sizes: [640, 480],
            	        mediaTypes: {
            	        	video: {
            	                context: 'instream',
            	                mimes: ['video/mp4', 'application/javascript'],
            	                // add 7 and 8 to include vast 4
            	                protocols: [1, 2, 3, 4, 5, 6, 7, 8],
            	                playbackmethod: [1, 2],
            	                api: [1, 2]
            	            }
            	        },
            	        bids: [
            	            {
            	                bidder: 'appnexusAst',
            	                params: {
            	                    // "placementId": 8845778,
            	                    video: {
            	                        skippable: true,
            	                        playback_method: ['auto_play_sound_off']
            	                    }
            	                }
            	            }
            	        ]
            		},
            		prebidConfigOptions: {
            			cache: {
            				url: 'https://prebid.adnxs.com/pbc/v1/cache'
            			},
            			enableSendAllBids: true
            		},
            		prebidTimeout: 700,
            		enablePrebidCache: true
            };
        };
        mockObject = new mock();
        done();
    });

    afterEach(function () {
		if (sinonStub) {
			sinonStub.restore();
			sinonStub = null;
		}
	});

	it('doPrebid test - success bidding for 1 bidder', function (done) {
		this.timeout(5000);
		ApnPrebidVast.test().loadPrebidScript(mockObject.options, false);
		setTimeout(function() {
			var options = mockObject.options;
			options.biddersSpec.bids[0].params.placementId = 11653264;
			sinonStub = sinon.stub(window.pbjs, 'requestBids', function(obj) {
				var response = {
					'my-video-tag': {
						bids: [
							{cpm: 1,
							 currency: 'USD',
							 statusMessage: 'Bid available',
							 vastUrl: 'http://bla_bla'}
						]
					}
				};
				setTimeout(function() {
					obj.bidsBackHandler(response);
				}, 0);
			});
			ApnPrebidVast.test().doPrebid(options, function(bids) {
				   var arrBids = (bids && bids[options.biddersSpec.code]) ? bids[options.biddersSpec.code].bids : [];
				assert.strictEqual(arrBids.length, 1, 'failed - expected 1 bid');
				assert.strictEqual(arrBids[0].vastUrl && arrBids[0].vastUrl.length > 0, true, 'failed - empty vastUrl property');
				done();
			});
		}, 2000);
    });

    it('loadPrebidScript test - loads prebid js on a page and starts pushing command in pbjs que', function (done) {
		sinonStub = sinon.stub(logger, 'log', function(pref, data) {
			if (data && data.indexOf('Selected VAST url') === 0) {
				console.log(data);
				done();
			}
		});
		ApnPrebidVast.test().loadPrebidScript(mockObject.options, true);
     });

    it('loadApnMolPlugin test - loads Appnexus MailOnline Plugin', function (done) {
		ApnPrebidVast.test().loadApnMolPlugin(function(succ) {
			assert.isTrue(succ);
			done();
		});
    });

    it('init test - registers Brightcove Prebid Plugin in videojs', function (done) {
		sinonStub = sinon.stub(videojs, 'registerPlugin', function(name, fnc) {
			assert.equal(name, 'apnPrebidVastPlugin');
			assert.isTrue(typeof fnc == 'function');
			done();
		});
		ApnPrebidVast.init();
    });
});