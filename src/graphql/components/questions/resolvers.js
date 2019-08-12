import * as questionDataSource from "./dataSource";
import * as questionCategoriesDataSource from "../questionCategories/dataSource";
import * as profileDataSource from "../profiles/dataSource";

const rootResolvers = {
  Query: {
    Question(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      if (args.random == true && args.question_category != null) {
        return questionDataSource
          .getRandomQuestionByCategory(args.question_category)
          .then(result => {
            if (result.error != null) {
              throw result.error;
            }
            return result.data;
          });
      } else if (args.question_category == null || args.random != true)
        return questionDataSource
          .getQuestionCategoryById(args.id)
          .then(result => {
            if (result.error != null) {
              throw error;
            }
            return {
              data: result.data,
              count: result.count,
              cursor: null
            };
          });
    },
    Questions(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return questionDataSource
        .getQuestionsPaginated(args.limit, args.after)
        .then(result => {
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
  Question: {
    owner(question, args, context, info) {
      return profileDataSource.getUserById(question.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }
        return result.data;
      });
    },
    question_category(question, args, context, info) {
      return questionCategoriesDataSource
        .getQuestionCategoryById(question.question_category_id)
        .then(result => {
          if (result.error) {
            throw result.error;
          }
          return result.data;
        });
    }
  },
  Mutation: {
    createQuestion(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return questionDataSource
        .createQuestion(
          args.question,
          args.suggested_answer,
          args.max_points,
          args.question_category_id,
          context.user.id
        )
        .then(result => {
          if (result.error != null) {
            return result.error;
          }
          return result.data;
        });
    },
    updateQuestion(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      let id = args.id;
      delete args.id;
      return questionDataSource.updateQuestion(id, args, context.user.id);
    },
    deleteQuestion(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return questionDataSource.deleteQuestion(args.id, context.user.id);
    }
  }
};

export default rootResolvers;
