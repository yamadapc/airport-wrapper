'use strict';
const _ = require('lodash');
const exec = require('child_process').exec;
const plist = require('plist');
const q = require('q');


const macProvider = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport'; // eslint-disable-line max-len


/*!
 * The executor command simply executes the airport utility binary ,
 * the result is returned in a plist and then parsed to a javascript object
 */

function executor(params, callback) {
  if (!callback) {
    throw new Error('Missing callback function');
  }

  exec(macProvider + ' ' + params + ' --xml', (err, stdout, stderr) => {
    if (err) {
      return callback(err, null);
    }
    const obj = plist.parseStringSync(stdout);
    return callback(err, obj);
  });
}


/*!
 * Parser functions
 */

function parseGetInfo(str: string): Object {
  return _(str.split('\n'))
    .filter(_.identity)
    .map(l => l.split(':'))
    .reduce((memo, sline) => {
      const key = sline[0];
      const value = sline.slice(1).join(':');
      memo[_.trim(key)] = _.trim(value);
      return memo;
    }, {});
}

function parseScan(str: string): Object[] {
  const lines = str.split('\n');
  const colSsid = 0;
  const colMac = lines[0].indexOf('BSSID');
  const colRssi = lines[0].indexOf('RSSI');
  const colChannel = lines[0].indexOf('CHANNEL');
  const colHt = lines[0].indexOf('HT');
  const colCc = lines[0].indexOf('CC');
  const colSec = lines[0].indexOf('SECURITY');

  const wifis = [];
  for (let i = 1, l = lines.length; i < l; i++) {
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
  exec(macProvider + ' -s', (err, stdout) => {
    if (err) {
      return callback(err, null);
    }

    const data = parseScan(stdout)
    callback(null, data);
  });
}

function getinfo(cb: (error: Error, data?: any) => void) {
  if (!cb) {
    throw new Error('Missing callback function');
  }

  exec(macProvider + ' --getinfo', (err, stdout) => {
    if (err) return cb(err);

    const data = parseGetInfo(stdout);
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
