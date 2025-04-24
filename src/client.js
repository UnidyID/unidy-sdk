// node:events
var a = typeof Reflect == "object" ? Reflect : null;
var d = a && typeof a.apply == "function" ? a.apply : function(e, n, r) {
  return Function.prototype.apply.call(e, n, r);
};
var l;
a && typeof a.ownKeys == "function" ? l = a.ownKeys : Object.getOwnPropertySymbols ? l = function(e) {
  return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
} : l = function(e) {
  return Object.getOwnPropertyNames(e);
};
function x(t) {
  console && console.warn && console.warn(t);
}
var L = Number.isNaN || function(e) {
  return e !== e;
};
function o() {
  o.init.call(this);
}
o.EventEmitter = o;
o.prototype._events = undefined;
o.prototype._eventsCount = 0;
o.prototype._maxListeners = undefined;
var h = 10;
function v(t) {
  if (typeof t != "function")
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof t);
}
Object.defineProperty(o, "defaultMaxListeners", { enumerable: true, get: function() {
  return h;
}, set: function(t) {
  if (typeof t != "number" || t < 0 || L(t))
    throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + t + ".");
  h = t;
} });
o.init = function() {
  (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || undefined;
};
o.prototype.setMaxListeners = function(e) {
  if (typeof e != "number" || e < 0 || L(e))
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
  return this._maxListeners = e, this;
};
function m(t) {
  return t._maxListeners === undefined ? o.defaultMaxListeners : t._maxListeners;
}
o.prototype.getMaxListeners = function() {
  return m(this);
};
o.prototype.emit = function(e) {
  for (var n = [], r = 1;r < arguments.length; r++)
    n.push(arguments[r]);
  var i = e === "error", f = this._events;
  if (f !== undefined)
    i = i && f.error === undefined;
  else if (!i)
    return false;
  if (i) {
    var s;
    if (n.length > 0 && (s = n[0]), s instanceof Error)
      throw s;
    var u = new Error("Unhandled error." + (s ? " (" + s.message + ")" : ""));
    throw u.context = s, u;
  }
  var c = f[e];
  if (c === undefined)
    return false;
  if (typeof c == "function")
    d(c, this, n);
  else
    for (var p = c.length, O = b(c, p), r = 0;r < p; ++r)
      d(O[r], this, n);
  return true;
};
function y(t, e, n, r) {
  var i, f, s;
  if (v(n), f = t._events, f === undefined ? (f = t._events = Object.create(null), t._eventsCount = 0) : (f.newListener !== undefined && (t.emit("newListener", e, n.listener ? n.listener : n), f = t._events), s = f[e]), s === undefined)
    s = f[e] = n, ++t._eventsCount;
  else if (typeof s == "function" ? s = f[e] = r ? [n, s] : [s, n] : r ? s.unshift(n) : s.push(n), i = m(t), i > 0 && s.length > i && !s.warned) {
    s.warned = true;
    var u = new Error("Possible EventEmitter memory leak detected. " + s.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
    u.name = "MaxListenersExceededWarning", u.emitter = t, u.type = e, u.count = s.length, x(u);
  }
  return t;
}
o.prototype.addListener = function(e, n) {
  return y(this, e, n, false);
};
o.prototype.on = o.prototype.addListener;
o.prototype.prependListener = function(e, n) {
  return y(this, e, n, true);
};
function C() {
  if (!this.fired)
    return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function g(t, e, n) {
  var r = { fired: false, wrapFn: undefined, target: t, type: e, listener: n }, i = C.bind(r);
  return i.listener = n, r.wrapFn = i, i;
}
o.prototype.once = function(e, n) {
  return v(n), this.on(e, g(this, e, n)), this;
};
o.prototype.prependOnceListener = function(e, n) {
  return v(n), this.prependListener(e, g(this, e, n)), this;
};
o.prototype.removeListener = function(e, n) {
  var r, i, f, s, u;
  if (v(n), i = this._events, i === undefined)
    return this;
  if (r = i[e], r === undefined)
    return this;
  if (r === n || r.listener === n)
    --this._eventsCount === 0 ? this._events = Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, r.listener || n));
  else if (typeof r != "function") {
    for (f = -1, s = r.length - 1;s >= 0; s--)
      if (r[s] === n || r[s].listener === n) {
        u = r[s].listener, f = s;
        break;
      }
    if (f < 0)
      return this;
    f === 0 ? r.shift() : j(r, f), r.length === 1 && (i[e] = r[0]), i.removeListener !== undefined && this.emit("removeListener", e, u || n);
  }
  return this;
};
o.prototype.off = o.prototype.removeListener;
o.prototype.removeAllListeners = function(e) {
  var n, r, i;
  if (r = this._events, r === undefined)
    return this;
  if (r.removeListener === undefined)
    return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : r[e] !== undefined && (--this._eventsCount === 0 ? this._events = Object.create(null) : delete r[e]), this;
  if (arguments.length === 0) {
    var f = Object.keys(r), s;
    for (i = 0;i < f.length; ++i)
      s = f[i], s !== "removeListener" && this.removeAllListeners(s);
    return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
  }
  if (n = r[e], typeof n == "function")
    this.removeListener(e, n);
  else if (n !== undefined)
    for (i = n.length - 1;i >= 0; i--)
      this.removeListener(e, n[i]);
  return this;
};
function _(t, e, n) {
  var r = t._events;
  if (r === undefined)
    return [];
  var i = r[e];
  return i === undefined ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? R(i) : b(i, i.length);
}
o.prototype.listeners = function(e) {
  return _(this, e, true);
};
o.prototype.rawListeners = function(e) {
  return _(this, e, false);
};
o.listenerCount = function(t, e) {
  return typeof t.listenerCount == "function" ? t.listenerCount(e) : w.call(t, e);
};
o.prototype.listenerCount = w;
function w(t) {
  var e = this._events;
  if (e !== undefined) {
    var n = e[t];
    if (typeof n == "function")
      return 1;
    if (n !== undefined)
      return n.length;
  }
  return 0;
}
o.prototype.eventNames = function() {
  return this._eventsCount > 0 ? l(this._events) : [];
};
function b(t, e) {
  for (var n = new Array(e), r = 0;r < e; ++r)
    n[r] = t[r];
  return n;
}
function j(t, e) {
  for (;e + 1 < t.length; e++)
    t[e] = t[e + 1];
  t.pop();
}
function R(t) {
  for (var e = new Array(t.length), n = 0;n < e.length; ++n)
    e[n] = t[n].listener || t[n];
  return e;
}
var P = o.prototype;

// src/newsletters.ts
class NewsletterService {
  client;
  constructor(client) {
    this.client = client;
  }
  async createSubscriptions(payload) {
    return this.client.post("/api/sdk/v1/newsletter_subscriptions", payload);
  }
  onSubscriptionsCreated(callback) {
    this.client.on("success", (response) => {
      callback(response.data.created);
    });
  }
  onError(callback) {
    this.client.on("error", (response) => {
      callback(response.data.errors);
    });
  }
  onUnconfirmedSubscriptionError(callback) {
    this.onSpecificError(callback, "unconfirmed");
  }
  onAlreadySubscribedError(callback) {
    this.onSpecificError(callback, "already_subscribed");
  }
  onInvalidEmailError(callback) {
    this.onSpecificError(callback, "invalid_email");
  }
  onSpecificError(callback, errorIdentifier) {
    this.client.on("error", (response) => {
      const specificErrors = response.data.errors.filter((error) => error.error_identifier === errorIdentifier);
      if (specificErrors.length > 0) {
        callback(specificErrors);
      }
    });
  }
}

// src/client.ts
class UnidyClient extends o {
  baseUrl;
  api_key;
  newsletters;
  constructor(baseUrl, api_key) {
    super();
    this.baseUrl = baseUrl;
    this.api_key = api_key;
    this.newsletters = new NewsletterService(this);
    this.api_key = api_key;
  }
  async post(endpoint, body) {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.api_key}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const response = {
        data,
        status: res.status,
        headers: res.headers
      };
      if (res.ok) {
        this.emit("success", response);
      }
      if (!res.ok || res.status === 207) {
        this.emit("error", response);
      }
      return response;
    } catch (error) {
      if (error instanceof Error) {
        this.emit("error", {
          status: 0,
          message: error.message
        });
      }
    }
  }
}
export {
  UnidyClient
};
