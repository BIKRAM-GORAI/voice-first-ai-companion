export const shouldRecallMemory = () => {

  const chance = Math.random();

  return chance < 0.25;

};


export const pickMemoryToRecall = (memories) => {

  if (!memories.length) return null;

  const index = Math.floor(Math.random() * memories.length);

  return memories[index];

};