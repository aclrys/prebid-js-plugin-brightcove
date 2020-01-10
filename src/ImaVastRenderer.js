/**
 * IMA VAST Renderer module.
 * @module imaVastRenderer
 */

var _logger = require('./Logging.js');
var _prefix = 'PrebidVast->imaVastRenderer';

var imaVastRenderer = function (player) {
    var _eventCallback;
    var _player = player;
    var _cbStyleDisplay;
    var _cdStyleDisplayChanged = false;
    var _adDone = false;

    var isMobile = function isMobile () {
    	return /iP(hone|ad|od)|Android|Windows Phone/.test(navigator.userAgent);
    };

    var isIDevice = function isIDevice () {
    	return /iP(hone|ad)/.test(navigator.userAgent);
    };

    var isIPhone = function isIPhone () {
    	return /iP(hone|od)/.test(navigator.userAgent);
	};

    // resend event to caller
    function resendEvent (event) {
        _eventCallback(event);
    }

    function closeEvent (event) {
        resendEvent(event);
        removeListeners();
    }

    function activateImaAdControlBar (activate) {
        var elems = _player.el_.getElementsByClassName('vjs-ad-control-bar');
        if (elems && elems.length > 0) {
            var cb = elems[0];
            if (activate) {
                _cbStyleDisplay = cb.style.display;
                _cdStyleDisplayChanged = true;
                cb.style.display = 'flex';
            }
            else {
                if (_cdStyleDisplayChanged) {
                    cb.style.display = _cbStyleDisplay;
                    _cdStyleDisplayChanged = false;
                }
            }
        }
    }

    function onEvent (event) {
        var mapCloseEvents = {
            'ima3error': 'vast.adError',
            'ads-ended': 'vast.contentEnd',
            'ads-ad-skipped': 'vast.adSkip',
            'ima3-ad-error': 'vast.adError',
            'ima3-complete': 'adFinished',
            'ima3-hardtimeout': 'vast.adsCancel',
            'ima3-hard-timeout': 'vast.adsCancel',
            'ad-hard-timeout': 'vast.adsCancel'
        };
        _logger.log(_prefix, 'IMA3 plugin event: ' + event.type + '. ', event);

        var adFinished = function (evt) {
            _player.trigger({type: 'internal', data: {name: 'cover', cover: false}});
            closeEvent({type: evt, data: {}});
            // for iPhone force main content to play
            if (isIPhone()) {
                setTimeout(function () {
                    _player.play();
                }, 0);
            }
            activateImaAdControlBar(false);
        };

        // make sure big play button not visible when ad is playing
        _player.bigPlayButton.el_.style.display = 'none';

        var str = 'IMA3 plugin event: ' + event.type + '. ';
        switch (event.type) {
            case 'ima3error':
                str += 'Error loading the IMA3 SDK from Google.';
            break;
            case 'ads-request':
                str += 'Upon request ad data.';
            break;
            case 'ads-load':
                str += 'An ad data is available.';
            break;
            case 'ads-started':
                str += 'An ad has started playing.';
                str += ' Main content playing: ' + (!_player.paused());
                _player.trigger({type: 'internal', data: {name: 'cover', cover: false}});
            break;
            case 'ads-ended':
                str += 'An ad has finished playing.';
            break;
            case 'ads-ad-skipped':
                str += 'An ad is skipped.';
            break;
            case 'ads-click':
                str += 'A viewer clicked on the playing ad.';
            break;
            case 'ads-volumechange':
                str += 'The volume of the playing ad has been changed. Volume: ';
                var vol = _player.ima3.adsManager.getVolume();
                str += vol;
            break;
            case 'ima3-ad-error':
                str += 'An error has occurred in the IMA3 SDK.';
                if (event.originalEvent && event.originalEvent.h) {
                    str += (' Error code: ' + event.originalEvent.h.h);
                    str += ('. Message: ' + event.originalEvent.h.l);
                }
            break;
            case 'ima3-ads-manager-loaded':
                str += 'Ads have been loaded and an AdsManager is available.';
                str += ' Main content playing: ' + (!_player.paused());
                _player.one('playing', function () {
                    if (!_adDone) {
                        _adDone = true;
                        console.log('****** player start playing after ima3-ads-manager-loaded event');
                        adFinished('vast.adError');
                    }
                });
            break;
            case 'ima3-click':
                str += 'An ad is clicked.';
            break;
            case 'ima3-complete':
                str += 'An ad completes playing.';
            break;
            case 'ima3-hardtimeout':
            case 'ima3-hard-timeout':
            case 'ad-hard-timeout':
                str += 'Reached a timeout';
            break;
            case 'ima3-loaded':
                str += 'An ad data is available.';
            break;
            case 'ima3-started':
                str += 'An ad starts playing. Url: ';
                var media = _player.ima3.currentAd.getMediaUrl();
                str += media;
                _player.trigger({type: 'internal', data: {name: 'cover', cover: false}});
                activateImaAdControlBar(true);
            break;
            case 'ima3-volume-change':
                str += 'An ad volume has changed. Volume: ';
                vol = _player.ima3.adsManager.getVolume();
                str += vol;
            break;
        }
        _player.trigger({type: 'trace.message', data: {message: str}});
        if (mapCloseEvents[event.type]) {
            _adDone = true;
            adFinished(mapCloseEvents[event.type]);
        }
    }

	// add listeners for renderer events
    function addListeners () {
        _player.on('ima3error', onEvent);
        _player.on('ads-request', onEvent);
        _player.on('ads-load', onEvent);
        _player.on('ads-started', onEvent);
        _player.on('ads-ended', onEvent);
        _player.on('ads-ad-skipped', onEvent);
        _player.on('ads-click', onEvent);
        _player.on('ads-volumechange', onEvent);

        _player.on('ima3-ad-error', onEvent);
        _player.on('ima3-ads-manager-loaded', onEvent);
        _player.on('ima3-click', onEvent);
        _player.on('ima3-complete', onEvent);
        _player.on('ima3-hardtimeout', onEvent);
        _player.on('ima3-hard-timeout', onEvent);
        _player.on('ad-hard-timeout', onEvent);
        _player.on('ima3-loaded', onEvent);
        _player.on('ima3-started', onEvent);
        _player.on('ima3-volume-change', onEvent);

    	_player.on('trace.message', resendEvent);
        _player.on('trace.event', resendEvent);

        _player.on('internal', resendEvent);
    }

	// remove listeners for renderer events
    function removeListeners () {
        _player.off('ima3error', onEvent);
        _player.off('ads-request', onEvent);
        _player.off('ads-load', onEvent);
        _player.off('ads-started', onEvent);
        _player.off('ads-ended', onEvent);
        _player.off('ads-ad-skipped', onEvent);
        _player.off('ads-click', onEvent);
        _player.off('ads-volumechange', onEvent);

        _player.off('ima3-ad-error', onEvent);
        _player.off('ima3-ads-manager-loaded', onEvent);
        _player.off('ima3-click', onEvent);
        _player.off('ima3-complete', onEvent);
        _player.off('ima3-hardtimeout', onEvent);
        _player.off('ima3-hard-timeout', onEvent);
        _player.off('ad-hard-timeout', onEvent);
        _player.off('ima3-loaded', onEvent);
        _player.off('ima3-started', onEvent);
        _player.off('ima3-volume-change', onEvent);

    	_player.off('trace.message', resendEvent);
    	_player.off('trace.event', resendEvent);

        _player.off('internal', resendEvent);
    }

    // play single ad
    this.playAd = function (xml, options, firstVideoPreroll, mobilePrerollNeedClick, prerollNeedClickToPlay, eventCallback) {
        // if IMA plugin is not registered in videojs immediatelly notify caller and return
        if (!_player.ima3) {
            if (eventCallback) {
                eventCallback({type: 'internal', data: {name: 'resetContent'}});
            }
            return;
        }
        _adDone = false;

        // IMA plugin can play ONLY vast tag
        var creativeIsVast = xml.indexOf('<VAST') >= 0;
        if (creativeIsVast) {
            if (eventCallback) {
                eventCallback({type: 'internal', data: {name: 'resetContent'}});
            }
            return;
        }

        _eventCallback = eventCallback;
        _options = options;

		// player event listeners
        addListeners();

        var renderAd = function (canAutoplay) {
            setTimeout(function () {
                var requestImaPlayAd = function () {
                    // for iOS/android start to render an ad only when main content start playing
                    // we have to do it because 'adrequest' not support preroll
                    if (isMobile()) {
                        _player.trigger({type: 'internal', data: {name: 'cover', cover: true}});
                        _player.bigPlayButton.el_.style.display = 'none';
                        var checkTime = function () {
                            if (_player.currentTime() > 0.5) {
                                _player.off('timeupdate', checkTime);
                                _player.pause();
                                // request IMA plugin to render ad
                                _player.ima3.adrequest(xml);
                            }
                        }
                        if (_player.currentTime() > 0.5) {
                            // request IMA plugin to render ad
                            _player.ima3.adrequest(xml);
                        }
                        else {
                            _player.on('timeupdate', checkTime);
                        }
                    }
                    else {
                        _player.bigPlayButton.el_.style.display = 'none';
                        // request IMA plugin to render ad
                        _player.ima3.adrequest(xml);
                    }
                };
                if (canAutoplay) {
                    _player.play();
                    requestImaPlayAd();
                }
                else {
                    // make short delay to make sure we can pause main content
                    setTimeout(function () {
                        // hide black cover before show play button
                        _player.trigger({type: 'internal', data: {name: 'cover', cover: false}});
                        // pause main content just in case
                        _player.pause();
                        _player.trigger({type: 'trace.message', data: {message: 'Video main content - activate play button'}});
                        _player.bigPlayButton.el_.style.display = 'block';
                        _player.bigPlayButton.el_.style.opacity = 1;
                        _player.bigPlayButton.el_.style.zIndex = 99999;
                        // wait until main content start playing
                        var eventFired = false;
                        _player.one('play', function () {
                            if (!eventFired) {
                                eventFired = true;
                                requestImaPlayAd();
                            }
                        });
                        _player.one('playing', function () {
                            if (!eventFired) {
                                eventFired = true;
                                requestImaPlayAd();
                            }
                        });
                    }, 100);
                }
            }, 0);
        };

        if (firstVideoPreroll) {
            if ((isIDevice() && !_player.muted()) || isIPhone()) {
                // no ad autoplay for iPhone and not muted main content on iOS
                renderAd(false);
            }
            else {
                var valAutoplay = _player.autoplay();
                if (valAutoplay === false) {
                    // do not autoplay
                    _logger.log(_prefix, 'Player cofigured for not-autoplay');
                    _player.trigger({type: 'trace.message', data: {message: 'Player cofigured for not-autoplay'}});
                    renderAd(false);
                }
                else if (valAutoplay === 'muted') {
                    _logger.log(_prefix, 'Player cofigured for autoplay-muted');
                    _player.trigger({type: 'trace.message', data: {message: 'Player cofigured for autoplay-muted'}});
                    _player.muted(true);
                    renderAd(true);
                }
                else {
                    _logger.log(_prefix, 'Player cofigured for autoplay');
                    _player.trigger({type: 'trace.message', data: {message: 'Player cofigured for autoplay'}});
                    try {
                        var playPromise = _player.play();
                        if (playPromise !== undefined && typeof playPromise.then === 'function') {
                            playPromise.then(function () {
                                _player.pause();
                                _logger.log(_prefix, 'Video can play with sound (allowed by browser)');
                                _player.trigger({type: 'trace.message', data: {message: 'Video can play with sound (allowed by browser)'}});
                                renderAd(true);
                            }).catch(function () {
                                setTimeout(function () {
                                    _player.pause();
                                    _logger.log(_prefix, 'Video cannot play with sound (browser restriction)');
                                    _player.trigger({type: 'trace.message', data: {message: 'Video cannot play with sound (browser restriction)'}});
                                    renderAd(false);
                                }, 200);
                            });
                        }
                        else {
                            _logger.log(_prefix, 'Video can play with sound (promise undefined)');
                            traceMessage({data: {message: 'Video can play with sound (promise undefined)'}});
                            if (_player.paused()) {
                                _player.trigger({type: 'trace.message', data: {message: 'Main video paused before preroll'}});
                                renderAd(false);
                            }
                            else {
                                _player.trigger({type: 'trace.message', data: {message: 'Main video is auto-playing. Pause it.'}});
                                _player.pause();
                                renderAd(true);
                            }
                        }
                    }
                    catch (ex) {
                        _logger.log(_prefix, 'Video can play with sound (exception)');
                        _player.trigger({type: 'trace.message', data: {message: 'Video can play with sound (exception)'}});
                        renderAd(false);
                    }
                }
            }
        }
        else {
            _logger.log(_prefix, 'Playing midroll or postroll');
            renderAd(true);
        }
    };

    // stop ad
    this.stop = function () {
        if (_player.ima3 && typeof _player.ima3 !== 'function' && _player.ima3.adsManager) {
            _player.ima3.adsManager.stop();
            // notify caller
            closeEvent({type: 'vast.adsCancel', data: {}});
            activateImaAdControlBar(false);
        }
    };

    // @exclude
    // Method exposed only for unit Testing Purpose
    // Gets stripped off in the actual build artifact
	this.test = function () {
		return {
            setEventCallback: function (callback) {
                _eventCallback = callback
            },
            addListeners: addListeners
		};
	};
	// @endexclude
};

module.exports = imaVastRenderer;
