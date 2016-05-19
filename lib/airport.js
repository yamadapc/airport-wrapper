'use strict';
var _ = require('lodash');
var exec = require('child_process').exec;
var plist = require('plist');
var q = require('q');
var macProvider = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport'; // eslint-disable-line max-len
/*!
 * The executor command simply executes the airport utility binary ,
 * the result is returned in a plist and then parsed to a javascript object
 */
function executor(params, callback) {
    if (!callback) {
        throw new Error('Missing callback function');
    }
    exec(macProvider + ' ' + params + ' --xml', function (err, stdout, stderr) {
        if (err) {
            return callback(err, null);
        }
        var obj = plist.parseStringSync(stdout);
        return callback(err, obj);
    });
}
/*!
 * Parser functions
 */
function parseGetInfo(str) {
    return _(str.split('\n'))
        .filter(_.identity)
        .map(function (l) { return l.split(':'); })
        .reduce(function (memo, sline) {
        var key = sline[0];
        var value = sline.slice(1).join(':');
        memo[_.trim(key)] = _.trim(value);
        return memo;
    }, {});
}
function parseScan(str) {
    var lines = str.split('\n');
    var colSsid = 0;
    var colMac = lines[0].indexOf('BSSID');
    var colRssi = lines[0].indexOf('RSSI');
    var colChannel = lines[0].indexOf('CHANNEL');
    var colHt = lines[0].indexOf('HT');
    var colCc = lines[0].indexOf('CC');
    var colSec = lines[0].indexOf('SECURITY');
    var wifis = [];
    for (var i = 1, l = lines.length; i < l; i++) {
        wifis.push({
            ssid: lines[i].substr(colSsid, colMac).trim(),
            bssid: lines[i].substr(colMac, colRssi - colMac).trim(),
            rssi: lines[i].substr(colRssi, colChannel - colRssi).trim(),
            channel: lines[i].substr(colChannel, colHt - colChannel).trim(),
            ht: lines[i].substr(colHt, colCc - colHt).trim(),
            cc: lines[i].substr(colCc, colSec - colCc).trim(),
            security: lines[i].substr(colSec).trim()
        });
    }
    wifis.pop();
    return wifis;
}
/* Run an airport scan and then parse the  */
function scan(callback) {
    if (!callback) {
        throw new Error('scan() is missing callback function');
    }
    exec(macProvider + ' -s', function (err, stdout) {
        if (err) {
            return callback(err, null);
        }
        var data = parseScan(stdout);
        callback(null, data);
    });
}
function getinfo(cb) {
    if (!cb) {
        throw new Error('Missing callback function');
    }
    exec(macProvider + ' --getinfo', function (err, stdout) {
        if (err)
            return cb(err);
        var data = parseGetInfo(stdout);
        return cb(null, data);
    });
}
function disassociate(callback) {
    if (!callback) {
        throw new Error('disassociate() is missing callback function');
    }
    executor('--disassociate', function (err, data) {
        callback(err, data);
    });
}
function help(callback) {
    if (!callback) {
        throw new Error('help() is missing callback function');
    }
    executor('--help', function (err, data) {
        callback(err, data);
    });
}
exports.scan = scan;
exports.getinfo = getinfo;
exports.disassociate = disassociate;
exports.help = help;
exports.airport = executor;
exports.utility = macProvider;
