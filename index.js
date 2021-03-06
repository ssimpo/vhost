/*!
 * vhost
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module exports.
 * @public
 */

module.exports = vhost;

/**
 * Module variables.
 * @private
 */
var asteriskRegExp = /\*/g;
var asteriskReplace = '([^\.]+)';
var endAnchoredRegExp = /(?:^|[^\\])(?:\\\\)*\$$/;
var escapeRegExp = /([.+?^=!:${}()|\[\]\/\\])/g;
var escapeReplace = '\\$1'

/**
 * Create a vhost middleware.
 *
 * @param {string|RegExp} hostname
 * @param {function} handle
 * @return {Function}
 * @public
 */
function vhost(hostname, handle) {
  if (!hostname) {
    throw new TypeError('argument hostname is required');
  }

  if (!handle) {
    throw new TypeError('argument handle is required');
  }

  if (typeof handle !== 'function') {
    throw new TypeError('argument handle must be a function');
  }

  // create regular expression for hostname
  var regexp = hostRegExp(hostname);

  return function vhost(req, res, next) {
    var vhostdata = vhostOf(req, regexp);

    if (!vhostdata) {
      return next();
    }

    // populate
    req.vhost = vhostdata;

    // handle
    handle(req, res, next);
  }
}

/**
 * Get hostname of request.
 *
 * @param (object} req
 * @return {string}
 * @private
 */
function hostNameOf(req) {
  var host = req.headers.host;

  if (!host) {
    return;
  }

  var offset = host[0] === '['
    ? host.indexOf(']') + 1
    : 0;
  var index = host.indexOf(':', offset);

  return index !== -1
    ? host.substring(0, index)
    : host;
}

/**
 * Determine if object is RegExp.
 *
 * @param (object} val
 * @return {boolean}
 * @private
 */
function isRegExp(val) {
  return Object.prototype.toString.call(val) === '[object RegExp]';
}

/**
 * Determine if object is an array.
 *
 * @param (object} val
 * @return {boolean}
 * @private
 */
function isArray(val) {
  return (Object.prototype.toString.call(val) === '[object Array]' );
}


/**
 * Generate RegExp group for the supplied value.
 *
 * @param (string|RegExp} val
 * @private
 */
function hostRegExpGroup(val) {
  var source = !isRegExp(val)
      ? String(val).replace(escapeRegExp, escapeReplace).replace(asteriskRegExp, asteriskReplace)
      : val.source;

  // force leading anchor matching
  if (source[0] === '^') {
    source = source.slice(0, 1);
  }

  // force trailing anchor matching
  if (endAnchoredRegExp.test(source)) {
    source = source.slice(0, -1);
  }

  return '(?:' + source + ')';
}

/**
 * Generate RegExp for given hostname(s) value.
 *
 * @param (string|RegExp} val
 * @private
 */
function hostRegExp(val) {
  val = ((isArray(val))?val:[val]);

  var source = '^' + val.map(function(val) {
    return hostRegExpGroup(val);
  }).join('|') + '$';

  return new RegExp(source, 'i');
}

/**
 * Get the vhost data of the request for RegExp
 *
 * @param (object} req
 * @param (RegExp} regexp
 * @return {object}
 * @private
 */
function vhostOf(req, regexp) {
  var host = req.headers.host;
  var hostname = hostNameOf(req);

  if (!hostname) {
    return;
  }

  var match = regexp.exec(hostname);

  if (!match) {
    return;
  }

  var obj = Object.create(null);

  obj.host = host;
  obj.hostname = hostname;
  obj.length = match.length - 1;

  for (var i = 1; i < match.length; i++) {
    obj[i - 1] = match[i];
  }

  return obj;
}
