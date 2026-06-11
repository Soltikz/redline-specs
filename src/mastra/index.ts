import { Mastra } from '@mastra/core';
import { bikeExpertAgent } from './agents/bikeExpert';

export const mastra = new Mastra({
  agents: { bikeExpertAgent },
});

export { bikeExpertAgent };