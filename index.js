var screenshot = require('screenshot-promise');
var mkdirp = require('mkdirp');
var fs = require('fs');
var Q = require('q');
var id = 'summit-view-screenshot';
var config, settings, summit, interval, urls = [];

var takeScreenshot = function(url) {
    var size = config.size || settings.size;
    var delay = config.delay || settings.delay;
    var crop = ( typeof config.crop != 'undefined' ) ? config.crop : settings.crop;

    screenshot(url, size, {crop: false, delay: parseInt(delay)})
        .then(function(buf) {
            fs.writeFileSync('.static/' + id + '/screenshot.png', buf);
            summit.io.emit('screenshot', '');
        });

};

var setupWebhook = function() {
    // use config.filter to filter legit requests, by default anything is allowed to end up in the panel...
    var filter = config.filter || function(req) {
        // anything goes
        return Q.when(true);
    };

    // by default the target is assumed to be under the url-key in the body, use config.filterTarget if you want to get the target url from some other place.
    var filterTarget = config.filterTarget || function(req) {
        return Q.when(req.body.url);
    };

    // POST /summit-view-screenshot/screenshot
    summit.router.post('/screenshot', function(req, res) {

        Q.all([filter(req), filterTarget(req)])
            .spread(function(allowed, target) {
                if( allowed && target ) {
                    takeScreenshot(target);
                    res.status(200).send();
                }
                else if( !allowed ) {
                    res.status(401).send();
                }
                else if( !target ) {
                    res.status(400).send();
                }
            });

    });
};

var periodicCallback = function() {
    if( urls.length ) {
        // take out first url, trigger screenshot and put it in last
        var target = urls.shift();
        urls.push(target);
        takeScreenshot(target);
    }
    else {
        // have no urls to screenshot, clear interval and wait for settings
        clearInterval(interval);
    }

};

var setupPeriodic = function() {
    var seconds = config.interval || settings.interval;

    clearInterval(interval);
    interval = setInterval(periodicCallback, parseInt(seconds) * 1000);
    periodicCallback();
};

var setPeriodicUrls = function() {
    urls = [];

    var newUrl = config.url || settings.url;

    if( newUrl ) {
        // track new keywords
        var newUrls = newUrl.split(',');

        for (var i = 0; i < newUrls.length; i++) {
            urls.push(newUrls[i].trim());
        }

        if( config.mode != 'webhook' && urls.length ) {
            setupPeriodic();
        }
    }
};

var panel = function(s) {
    summit = s;
    config = config || {};

    return summit.settings()
        .then(function(s) {
            settings = s || {};

            // default settings
            settings.url = settings.url || '';
            settings.interval = settings.interval || 120;
            settings.delay = settings.delay || 10;
            settings.size = settings.size || '1440x900';
            settings.crop = (typeof settings.crop != 'undefined' ) ? settigns.crop : false;

            var deferred = Q.defer();

            mkdirp('.static/' + id, function(err) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        })
        .then(function() {

            if( !config.delay ) {
                summit.registerSetting({
                    name: 'delay',
                    label: 'Screenshot delay in seconds',
                    type: 'number',
                    value: settings.delay,
                });
            }

            if( !config.size ) {
                summit.registerSetting({
                    name: 'size',
                    label: 'Screenshot size',
                    type: 'text',
                    value: settings.size,
                    instructions: '1920x1080, 1280x720, 1440x900 etc.',
                });
            }

            if( typeof config.crop == 'undefined' ) {
                summit.registerSetting({
                    name: 'crop',
                    label: 'Crop screenshot to the resolution size (screenshots will have consistent height)',
                    type: 'boolean',
                    value: settings.crop,
                });
            }

            if( config.mode != 'webhook' ) {
                if( !config.url ) {
                    summit.registerSetting({
                        name: 'url',
                        label: 'URL',
                        type: 'text',
                        value: settings.url,
                        instructions: 'URL to take a screenshot of, separate multiple URL\'s with comma.',
                    });
                }

                if( !config.interval ) {
                    summit.registerSetting({
                        name: 'interval',
                        label: 'Screenshot interval in seconds',
                        type: 'number',
                        value: settings.interval,
                    });
                }

                setPeriodicUrls();
            }
            else {
                setupWebhook();
            }

            return {
                id: id,
            };
        });

};

var onSettings = function(s) {
    settings = s;
    clearInterval(interval);
    setPeriodicUrls();
};

var setup = function(cfg) {
    config = cfg;
    return module.exports;
};

module.exports = panel;
module.exports.id = id;
module.exports.client = __dirname + '/lib/client.js';
module.exports.style = __dirname + '/public/style.css';
module.exports.onSettings = onSettings;
module.exports.init = setup;
