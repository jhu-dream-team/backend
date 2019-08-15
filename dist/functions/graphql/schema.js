"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _profiles = require("./components/profiles");

var _questionCategories = require("./components/questionCategories");

var _scores = require("./components/scores");

var _questions = require("./components/questions");

var _answers = require("./components/answers");

var _freeSpins = require("./components/freeSpins");

var _votes = require("./components/votes");

var _games = require("./components/games");

var _status = _interopRequireDefault(require("./components/status"));

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schema = {
  typeDefs: [_profiles.profileSchema, _questionCategories.questionCategorySchema, _questions.questionSchema, _status.default, _scores.scoreSchema, _answers.answerSchema, _freeSpins.freeSpinSchema, _votes.voteSchema, _games.gameSchema],
  resolvers: (0, _lodash.merge)(_profiles.profileResolvers, _questionCategories.questionCategoryResolvers, _questions.questionResolvers, _scores.scoreResolvers, _answers.answerResolvers, _freeSpins.freeSpinResolvers, _votes.voteResolvers, _games.gameResolvers)
};
var _default = schema;
exports.default = _default;