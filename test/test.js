'use strict';
const airport = require('..');
const assert = require('assert');

describe('airport', function () {
  describe('.scan', function () {
    it('yields some data', function (done) {
      airport.scan((err, data) => {
        assert(!!data, 'Didn\'t yield data');
        this.data = data;
        done(err);
      });
    });

    it('the data is properly parsed');
  });

  describe('.getinfo', function () {
    it('yields some data', function (done) {
      airport.getinfo((err, data) => {
        console.log(data);
        assert(!!data, 'Didn\'t yield data');
        this.data = data;
        done(err);
      });
    });

    it('the data is properly parsed', function() {
      Object.keys(this.data).forEach((key) => {
        assert(key.indexOf(':') === -1, 'Parser left some ":"');
        const value = this.data[key];
        assert(value.indexOf(':') === -1, 'Parser left some ":"');
      })
    });
  });
});
