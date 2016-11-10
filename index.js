/*!
 * each-promise <https://github.com/tunnckoCore/each-promise>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var utils = require('./utils')
var each = module.exports

/**
 * > Iterate over `iterable` in series (serially)
 * with optional `options` (see [options section](#options))
 * and optional `mapper` function (see [mapper section](#mapper)).
 *
 * @name   .serial/.series
 * @param  {Array|Object} `<iterable>` iterable object like array or object
 * @param  {Function} `[mapper]` function to map over values, see [mapper section](#mapper)
 * @param  {Object} `[options]` see [options section](#options)
 * @return {Promise}
 * @api public
 */

each.serial = function eachSerial (iterable, mapper, options) {
  return compose(false)(iterable, mapper, options)
}
each.series = each.serial

/**
 * > Iterate over `iterable` in parallel (support limiting with `options.concurrency`)
 * with optional `options` (see [options section](#options))
 * and optional `mapper` function (see [mapper section](#mapper)).
 *
 * @name   .parallel
 * @param  {Array|Object} `<iterable>` iterable object like array or object
 * @param  {Function} `[mapper]` function to map over values, see [mapper section](#mapper)
 * @param  {Object} `[options]` see [options section](#options)
 * @return {Promise}
 * @api public
 */

each.parallel = function eachParallel (iterable, mapper, options) {
  var parallel = compose(true)
  return parallel(iterable, mapper, options)
}

function compose (parallel) {
  return function flow (iterable, mapper, opts) {
    if (typeof iterable !== 'object') {
      var err = new TypeError('expect `iterable` to be array, iterable or object')
      return Promise.reject(err)
    }
    var options = utils.defaults(mapper, opts)
    options.parallel = parallel
    return eachPromise(iterable, options)
  }
}

function eachPromise (iterable, opts) {
  return new opts.Promise(function (resolve, reject) {
    var results = []
    var arr = Array.isArray(iterable) ? iterable : []
    arr.doneCount = 0

    if (!arr.length && typeof iterable === 'object') {
      for (var key in iterable) {
        arr.push(iterable[key])
      }
    }
    opts.concurrency = opts.parallel ? opts.concurrency : 1
    opts.concurrency = opts.concurrency || arr.length

    opts.start()
    if (opts.parallel) {
      for (var index = 0; index < opts.concurrency; index++) {
        utils.iterator(arr, results)(opts, resolve, reject)(index)
      }
      return
    }
    utils.iterator(arr, results)(opts, resolve, reject)(0)
  })
}
