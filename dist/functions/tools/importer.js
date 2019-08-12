"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lazyModule = void 0;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const MODULES = {};

const lazyModule =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (modulePath) {
    if (!MODULES[modulePath]) {
      MODULES[modulePath] = yield Promise.resolve().then(() => _interopRequireWildcard(require(`${modulePath}`)));
    }

    return MODULES[modulePath];
  });

  return function lazyModule(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.lazyModule = lazyModule;