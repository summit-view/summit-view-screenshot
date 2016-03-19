# summit-view-screenshot
Screenshot-panel for Summit View


## Usage

Simple example, by default the panel will cycle through a list of URL's to take screenshots of. Settings is avaible in the settings-section.  

```
var summit = require('summit-view');
var Screenshot = require('summit-view-screenshot');

summit.listen(3000);

summit.panels([
    Screenshot,
]);
```

### Usage - Periodic
```
var summit = require('summit-view');
var Screenshot = require('summit-view-screenshot');

summit.listen(3000);

// Screenshot periodically
summit.panels([
    Screenshot.init({
        url: 'https://www.npmjs.com/,https://github.com/',
        interval: 120,
        delay: 10,
        size: '1440x900',
    }),
]);
```

### Usage - Webhook
By initializing the panel with `mode: 'webhook'` the panel will set up a route at  listening for `POST`-requests.

```
var summit = require('summit-view');
var Screenshot = require('summit-view-screenshot');
var Q = require('q');

summit.listen(3000);

// Screenshot when a POST-request hits /summit-view-screenshot/screenshot
summit.panels([
    Screenshot.init({
        mode: 'webhook',
        delay: 10,
        size: '1440x900',
        filter: function(req) {
            var allowed = (req.body.secret == 'super-secret-string');
            return Q.when(allowed);
        },
        filterTarget: function(req) {
            return Q.when(req.body.url);
        },
    }),
]);
```

## Options

Initialize the panel with an object to override any settings. Options that aren't specified will be available in the settings-section for the panel depending on the `mode`.

### Available options

#### url
Type: `string`  

Comma-separater list of url's to screenshot.  
*Not used if the panel is in `webhook`-mode.*  

#### interval
Type: `number`  
Default: `120`  

The interval, in seconds, to take screenshots at.  
*Not used if the panel is in `webhook`-mode.*  

#### delay
Type: `number`  
Default: `10`  

The delay, in seconds, to wait before taking a screenshot when visiting an url.  

#### size
Type: `string`  
Default: `1440x900`  

Size of the viewport when taking a screenshot.  

#### mode
Type: `string`  
Available values: `webhook`  

Set the mode of the panel. Leave empty or set to anything for default behaviour.  

##### Mode: `webhook`
A `POST`-route will be set up at `/summit-view-screenshot/screenshot`, requests can be filtered with `filter` and `filterTarget`.

#### filter(req)
Type: `function`  
Default: All requests will be allowed.  
Return: A promise with either `true` if a screenshot should be generated or `false` if not.  

When the panel is in `webhook`-mode the `filter`-function will be called before a request is allowed to trigger a screenshot being generated. This is where you validate the payload of the request.   

#### filterTarget(req)
Type: `function`  
Default: The url will be assumed to be in `req.body.url`.  
Return: A promise with the url to take a screenshot of.  

When the panel is in `webhook`-mode the `filterTarget`-function will be called to get the url that should be used when generating a screenshot.  