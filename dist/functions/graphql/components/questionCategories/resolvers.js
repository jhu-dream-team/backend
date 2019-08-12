"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var questionCategoriesDataSource = _interopRequireWildcard(require("./dataSource"));

var questionDataSource = _interopRequireWildcard(require("../questions/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    QuestionCategory(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return questionCategoriesDataSource.getQuestionCategoryById(args.id).then(result => {
        if (result.error != null) {
          throw result.error;
        }

        return result.data;
      });
    },

    QuestionCategories(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return questionCategoriesDataSource.getQuestionCategoriesPaginated(args.limit, args.after, args.owner ? context.user.id : null).then(result => {
        if (result.error != null) {
          throw error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    }

  },
  QuestionCategory: {
    owner(question_category, args, context, info) {
      return profileDataSource.getUserById(question_category.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    questions(question_category, args, context, info) {
      return questionDataSource.getQuestionsByCategoryPaginated(question_category.id, args.limit, args.after).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          cursor: result.cursor,
          count: result.count
        };
      });
    }

  },
  Mutation: {
    createQuestionCategory(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return questionCategoriesDataSource.createQuestionCategory(args.name, context.user.id).then(result => {
        if (result.error != null) {
          return result.error;
        }

        return result.data;
      });
    },

    updateQuestionCategory(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return questionCategoriesDataSource.updateQuestionCategory(args.id, args.name, context.user.id);
    },

    deleteQuestionCategory(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return questionCategoriesDataSource.deleteQuestionCategory(args.id, context.user.id);
    }

  }
};
var _default = rootResolvers;
exports.default = _default;