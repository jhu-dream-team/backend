import { profileResolvers, profileSchema } from "./components/profiles";
import {
  questionCategorySchema,
  questionCategoryResolvers
} from "./components/questionCategories";
import { scoreSchema, scoreResolvers } from "./components/scores";
import { questionSchema, questionResolvers } from "./components/questions";
import { answerSchema, answerResolvers } from "./components/answers";
import { freeSpinSchema, freeSpinResolvers } from "./components/freeSpins";
import { voteSchema, voteResolvers } from "./components/votes";
import { gameSchema, gameResolvers } from "./components/games";
import statusSchema from "./components/status";
import { merge } from "lodash";

const schema = {
  typeDefs: [
    profileSchema,
    questionCategorySchema,
    questionSchema,
    statusSchema,
    scoreSchema,
    answerSchema,
    freeSpinSchema,
    voteSchema,
    gameSchema
  ],
  resolvers: merge(
    profileResolvers,
    questionCategoryResolvers,
    questionResolvers,
    scoreResolvers,
    answerResolvers,
    freeSpinResolvers,
    voteResolvers,
    gameResolvers
  )
};

export default schema;
