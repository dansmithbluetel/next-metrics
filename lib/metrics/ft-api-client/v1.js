'use strict';
var _       = require('lodash');
var metrics = require('metrics');

var FtApi = module.exports = function FtApi() {
    this.counters = {};
    this.reportFields = [];
    this.reportGetters = [];
};

FtApi.prototype.setupResponseHandler = function (requestType) { 

    // slightly dirty simple check to see if setup already done, but can't see it ever going wrong
    if (!this.counters[requestType + '_status_2xx_response_time']) {
        ['2xx', '4xx', '5xx'].forEach(function (statusCode) {
            this.counters[requestType + '_status_' + statusCode + '_response_time'] = new metrics.Histogram.createUniformHistogram();
            this.counters[requestType + '_status_' + statusCode] = new metrics.Counter();

            this.reportFields = this.reportFields.concat([
                'ft-api-client.v1.' + requestType + '.response.status_' + statusCode + '.response_time.mean',
                'ft-api-client.v1.' + requestType + '.response.status_' + statusCode + '.response_time.min',
                'ft-api-client.v1.' + requestType + '.response.status_' + statusCode + '.response_time.max',
                'ft-api-client.v1.' + requestType + '.response.status_' + statusCode + '.count'
            ]);

            this.reportGetters = this.reportGetters.concat([
                function () { return this.counters[requestType + '_status_' + statusCode + '_response_time'].mean(); }.bind(this),
                function () { return this.counters[requestType + '_status_' + statusCode + '_response_time'].min; }.bind(this),
                function () { return this.counters[requestType + '_status_' + statusCode + '_response_time'].max; }.bind(this),
                function () { return this.counters[requestType + '_status_' + statusCode ].count; }.bind(this)
            ]);

        }.bind(this));
    }

    return function (time, response) {
        if (!response || !response.statusCode) {
            return false;
        }

        var statusCode = parseInt(response.statusCode.toString().charAt(0), 10);
        switch (statusCode) {
            case 2:
                this.counters[requestType + '_status_2xx'].inc(1);
                this.counters[requestType + '_status_2xx_response_time'].update(time);
                break;
            case 4:
                this.counters[requestType + '_status_4xx'].inc(1);
                this.counters[requestType + '_status_4xx_response_time'].update(time);
                break;
            case 5:
                this.counters[requestType + '_status_5xx'].inc(1);
                this.counters[requestType + '_status_5xx_response_time'].update(time);
                break;
            default:
                console.err('statusCode not found', statusCode);
        }
    }.bind(this);
};

FtApi.prototype.setupRequestHandler = function (requestType, obj) {
    this.counters[requestType] = new metrics.Counter();
    this.reportFields.push('ft-api-client.v1.' + requestType + '.count');
    this.reportGetters.push(function () {
        return this.counters[requestType].count;
    }.bind(this));
    
    obj.on('ft-api-client:v1:' + requestType, function () {
        this.counters[requestType].inc(1);
    }.bind(this));
};


FtApi.prototype.instrument = function (obj) {

    this.setupRequestHandler('items', obj);
    this.setupRequestHandler('search', obj);
    this.setupRequestHandler('elasticSearch', obj);

    obj.on('ft-api-client:v1:requestHandler:response', this.setupResponseHandler('items'));
    obj.on('ft-api-client:v1:complexSearch:response', this.setupResponseHandler('search'));
    obj.on('ft-api-client:v1:elasticSearch:response', this.setupResponseHandler('elasticSearch'));

};

FtApi.prototype.reset = function () {
    _.forEach(this.counters, function (counter) {
        counter.clear();
    });
};

FtApi.prototype.counts = function () {
    return _.zipObject(this.reportFields, this.reportGetters.map(function (getter) {
        return getter();
    }));
};