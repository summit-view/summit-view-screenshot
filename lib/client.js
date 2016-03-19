define([], function() {

    var cx = function(arg) {
        var keep = [];

        for( var key in arg ) {
            if( arg[key] ) {
                keep.push(key);
            }
        }

        return keep.join(' ');
    };

    var render = function(panel) {
        panel.innerHTML = '<img src="/static/summit-view-screenshot/screenshot.png?' + Date.now() + '" />';
    }

    var init = function(panel, socket) {
        render(panel);

        socket.on('screenshot', function() {
            render(panel);
        });
    };

    return init;
});
