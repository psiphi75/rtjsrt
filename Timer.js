'use strict';


/**
 * A simple timer that stores the FPS (Frames Per Second) as a list.
 * @returns {{start: start, stop: stop, getFPSList: getFPSList}}
 * @constructor
 */
function FPSTimer() {
    var fpsTimes = [];
    var startTime;
    return {
        start: function() {
            startTime = performance.now();
        },
        stop:  function() {
            if (startTime === undefined) return NaN;
            var stopTime = performance.now();
            var fpsTime = 1000 / (stopTime - startTime);
            startTime = undefined;
            fpsTimes.push(fpsTime);
            return fpsTime;
        },
        getFPSList: function() {
            return fpsTimes;
        },
        average: function() {
            var sum = fpsTimes.reduce(function(a, b) { return a + b; });
            return sum / fpsTimes.length;
        }
    }
}